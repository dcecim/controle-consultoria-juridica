# Top-level imports e classe de auditoria
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, JSON, func, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String, nullable=True)
    responsible_name = Column(String, nullable=True)
    responsible_oab = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    # relationships futuros

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    sector = Column(String, nullable=True)  # NOVO

    contacts = relationship("Contact", back_populates="organization")
    deals = relationship("Deal", back_populates="organization")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    client_type = Column(String, nullable=True)  # NOVO: PF / PJ / Publico
    lead_source = Column(String, nullable=True)  # NOVO: indicacao / website / redes / evento

    organization = relationship("Organization", back_populates="contacts")
    deals = relationship("Deal", back_populates="contact")

class Stage(Base):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    order = Column(Integer, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)

    deals = relationship("Deal", back_populates="stage")

class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    value = Column(Float, default=0.0)
    status = Column(String, index=True)  # ex.: "open", "won", "lost"
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    # NOVOS: variáveis para lead scoring
    main_issue = Column(String, nullable=True)
    estimated_value = Column(Float, nullable=True)
    opened_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    email_open_rate = Column(Float, nullable=True)          # 0.0–1.0
    interactions_total = Column(Integer, nullable=False, default=0)
    docs_shared = Column(Boolean, nullable=False, default=False)

    stage = relationship("Stage", back_populates="deals")
    contact = relationship("Contact", back_populates="deals")
    organization = relationship("Organization", back_populates="deals")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    entity_name = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(128), nullable=False, index=True)
    action = Column(String(16), nullable=False)
    actor = Column(String(128), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    details = Column(JSON, nullable=True)

class LeadScore(Base):
    __tablename__ = "lead_scores"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True, index=True)
    score = Column(Integer, nullable=False)                 # 0–100
    model_version = Column(String, nullable=False)
    factors = Column(JSON, nullable=True)                   # explicações/sinais usados
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class DocumentType(Base):
    __tablename__ = "document_types"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True, index=True)            # opcional, único por tenant se desejado
    description = Column(String, nullable=True)
    allowed_mime_types = Column(JSON, nullable=True)            # lista opcional de mimes permitidos

class DealRequiredDocument(Base):
    __tablename__ = "deal_required_documents"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False, index=True)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False, index=True)
    required_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class OrganizationRequiredDocument(Base):
    __tablename__ = "organization_required_documents"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False, index=True)
    required_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class DocumentUpload(Base):
    __tablename__ = "document_uploads"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False, index=True)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)                   # nome salvo (uuid.ext)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, nullable=True, index=True)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    role = Column(String, nullable=False, index=True)
    resource = Column(String, nullable=False, index=True)
    actions = Column(JSON, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=False, unique=True, index=True)
    role = Column(String, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    must_change_password = Column(Boolean, nullable=False, default=True)
