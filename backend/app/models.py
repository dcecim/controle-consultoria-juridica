# Top-level imports e classe de auditoria
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, JSON, func
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