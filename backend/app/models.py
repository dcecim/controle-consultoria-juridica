# Top-level imports e classe de auditoria
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, JSON, func, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
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