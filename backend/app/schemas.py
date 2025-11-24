# imports e schemas de auditoria
from pydantic import BaseModel, ConfigDict
from typing import Any, Optional, Dict
from datetime import datetime

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class OrganizationBase(BaseModel):
    name: str
    sector: Optional[str] = None  # NOVO

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: int
    tenant_id: int
    model_config = ConfigDict(from_attributes=True)

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    organization_id: Optional[int] = None
    client_type: Optional[str] = None      # NOVO
    lead_source: Optional[str] = None      # NOVO

class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    tenant_id: int
    model_config = ConfigDict(from_attributes=True)

class StageBase(BaseModel):
    name: str
    order: int

class StageCreate(StageBase):
    pass

class Stage(StageBase):
    id: int
    tenant_id: int
    model_config = ConfigDict(from_attributes=True)

class DealBase(BaseModel):
    title: str
    value: float = 0.0
    status: Optional[str] = None
    stage_id: Optional[int] = None
    contact_id: Optional[int] = None
    organization_id: Optional[int] = None
    # NOVOS
    main_issue: Optional[str] = None
    estimated_value: Optional[float] = None
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    email_open_rate: Optional[float] = None
    interactions_total: Optional[int] = None
    docs_shared: Optional[bool] = None

class DealCreate(DealBase):
    pass

class DealUpdate(DealBase):
    pass

class Deal(DealBase):
    id: int
    tenant_id: int
    model_config = ConfigDict(from_attributes=True)

class AuditLogBase(BaseModel):
    tenant_id: int
    entity_name: str
    entity_id: str
    action: str
    actor: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    details: Optional[Dict[str, Any]] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogRead(AuditLogBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# NOVOS: LeadScore
class LeadScoreBase(BaseModel):
    tenant_id: int
    contact_id: Optional[int] = None
    deal_id: Optional[int] = None
    score: int
    model_version: str
    factors: Optional[Dict[str, Any]] = None

class LeadScoreCreate(LeadScoreBase):
    pass

class LeadScoreRead(LeadScoreBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)