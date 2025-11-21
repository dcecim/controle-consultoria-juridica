from pydantic import BaseModel, ConfigDict
from typing import Optional

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    organization_id: Optional[int] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StageBase(BaseModel):
    name: str
    order: int

class StageCreate(StageBase):
    pass

class Stage(StageBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DealBase(BaseModel):
    title: str
    value: float = 0.0
    status: str = "open"
    stage_id: Optional[int] = None
    contact_id: Optional[int] = None
    organization_id: Optional[int] = None

class DealCreate(DealBase):
    pass

class DealUpdate(DealBase):
    pass

class Deal(DealBase):
    id: int
    model_config = ConfigDict(from_attributes=True)