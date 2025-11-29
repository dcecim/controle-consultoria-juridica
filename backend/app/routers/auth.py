from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
import secrets
import time
import os
try:
    import pyotp  # type: ignore
except Exception:
    pyotp = None
import smtplib
from email.message import EmailMessage
import base64
try:
    import qrcode  # type: ignore
except Exception:
    qrcode = None
try:
    from twilio.rest import Client  # type: ignore
except Exception:
    Client = None

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int | None = Header(default=None, alias="X-Tenant-ID")) -> int:
    try:
        import os
        if x_tenant_id is None:
            return int(os.getenv("TENANT_ID", "1"))
        return int(x_tenant_id)
    except Exception:
        return 1

_tokens: dict[str, int] = {}
_mfa_challenges: dict[str, dict] = {}

def _hash_password(raw: str) -> str:
    import hashlib
    import os
    salt = os.getenv("AUTH_SALT", "static-salt")
    return hashlib.sha256((salt + raw).encode("utf-8")).hexdigest()

@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginPayload, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if user.password_hash != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if user.mfa_enabled:
        method = (user.mfa_method or "totp").lower()
        challenge = secrets.token_urlsafe(24)
        if method == "totp":
            if pyotp is None:
                raise HTTPException(status_code=500, detail="MFA indisponível: pyotp não instalado")
            _mfa_challenges[challenge] = {"user_id": user.id, "expires": time.time() + 300, "type": "totp"}
        else:
            import random
            code = f"{random.randint(0, 999999):06d}"
            _mfa_challenges[challenge] = {"user_id": user.id, "expires": time.time() + 300, "type": "otp", "code": code}
            if method == "otp_email":
                _send_email_otp(user.email, code)
            elif method == "otp_sms":
                _send_sms_otp(user.phone, code)
            elif method == "otp_whatsapp":
                _send_whatsapp_otp(user.phone, code)
            else:
                _send_email_otp(user.email, code)
        return {
            "token": "",
            "role": user.role,
            "must_change_password": user.must_change_password,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
            "mfa_required": True,
            "mfa_token": challenge,
        }
    token = secrets.token_urlsafe(32)
    _tokens[token] = user.id
    return {
        "token": token,
        "access_token": token,
        "role": user.role,
        "must_change_password": user.must_change_password,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }

@router.get("/me")
def me(authorization: str | None = Header(default=None, alias="Authorization"), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = authorization.split(" ", 1)[1]
    user_id = _tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

@router.post("/mfa/verify", response_model=schemas.LoginResponse)
def mfa_verify(payload: schemas.MfaVerifyPayload, db: Session = Depends(get_db)):
    ch = _mfa_challenges.get(payload.mfa_token)
    if not ch:
        raise HTTPException(status_code=400, detail="Challenge inválido ou expirado")
    if ch["expires"] < time.time():
        _mfa_challenges.pop(payload.mfa_token, None)
        raise HTTPException(status_code=400, detail="Challenge expirado")
    user = db.query(models.User).filter(models.User.id == ch["user_id"]).first()
    if not user or not user.mfa_enabled:
        _mfa_challenges.pop(payload.mfa_token, None)
        raise HTTPException(status_code=400, detail="Usuário sem MFA habilitado")
    ctype = ch.get("type")
    if ctype == "totp":
        if pyotp is None:
            raise HTTPException(status_code=500, detail="MFA indisponível: pyotp não instalado")
        if not user.mfa_secret:
            _mfa_challenges.pop(payload.mfa_token, None)
            raise HTTPException(status_code=400, detail="MFA TOTP não configurado")
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(payload.code, valid_window=1):
            raise HTTPException(status_code=401, detail="Código MFA inválido")
    else:
        if payload.code != ch.get("code"):
            raise HTTPException(status_code=401, detail="Código MFA inválido")
    token = secrets.token_urlsafe(32)
    _tokens[token] = user.id
    _mfa_challenges.pop(payload.mfa_token, None)
    return {
        "token": token,
        "access_token": token,
        "role": user.role,
        "must_change_password": user.must_change_password,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }

@router.post("/mfa/setup")
def mfa_setup(authorization: str | None = Header(default=None, alias="Authorization"), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = authorization.split(" ", 1)[1]
    user_id = _tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if pyotp is None:
        raise HTTPException(status_code=500, detail="pyotp não instalado")
    secret = pyotp.random_base32()
    issuer = os.getenv("MFA_ISSUER", "Consultor Juridico")
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email or f"user-{user.id}", issuer_name=issuer)
    user.mfa_secret = secret
    user.mfa_enabled = True
    user.mfa_method = (user.mfa_method or "totp")
    db.commit()
    qr_b64 = None
    if qrcode is not None:
        import io
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
    return {"otpauth_uri": uri, "secret": secret, "qr_base64": qr_b64}

def _send_email_otp(to_email: str | None, code: str):
    if not to_email:
        return
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("SMTP_TLS", "true").lower() == "true"
    sender = os.getenv("SMTP_FROM", user or "no-reply@example.com")
    if not host:
        print(f"[MFA] OTP para {to_email}: {code}")
        return
    msg = EmailMessage()
    msg["Subject"] = "Seu código de verificação"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(f"Seu código é: {code}\nEle expira em 5 minutos.")
    try:
        with smtplib.SMTP(host, port) as s:
            if use_tls:
                s.starttls()
            if user and password:
                s.login(user, password)
            s.send_message(msg)
    except Exception as e:
        print(f"Falha ao enviar e-mail OTP: {e}")

def _send_sms_otp(phone: str | None, code: str):
    if not phone:
        return
    if Client is None:
        print(f"[MFA] OTP SMS para {phone}: {code}")
        return
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_sms = os.getenv("TWILIO_FROM_SMS")
    if not sid or not token or not from_sms:
        print(f"[MFA] OTP SMS para {phone}: {code}")
        return
    try:
        client = Client(sid, token)
        client.messages.create(body=f"Seu código é: {code}", from_=from_sms, to=phone)
    except Exception as e:
        print(f"Falha ao enviar SMS OTP: {e}")

def _send_whatsapp_otp(phone: str | None, code: str):
    if not phone:
        return
    if Client is None:
        print(f"[MFA] OTP WhatsApp para {phone}: {code}")
        return
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_wa = os.getenv("TWILIO_FROM_WHATSAPP")
    if not sid or not token or not from_wa:
        print(f"[MFA] OTP WhatsApp para {phone}: {code}")
        return
    to_wa = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"
    try:
        client = Client(sid, token)
        client.messages.create(body=f"Seu código é: {code}", from_=from_wa, to=to_wa)
    except Exception as e:
        print(f"Falha ao enviar WhatsApp OTP: {e}")
