from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

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

    organization = relationship("Organization", back_populates="contacts")
    deals = relationship("Deal", back_populates="contact")

class Stage(Base):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    order = Column(Integer, index=True)

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

    stage = relationship("Stage", back_populates="deals")
    contact = relationship("Contact", back_populates="deals")
    organization = relationship("Organization", back_populates="deals")