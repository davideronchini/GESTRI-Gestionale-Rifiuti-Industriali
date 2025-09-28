from typing import List, Any
from datetime import datetime
from ninja import Schema
from pydantic import EmailStr

class WaitlistEntryCreateSchema(Schema):
  # Create -> Data
  # WaitlistEntryIn
  email: EmailStr



class WaitlistEntryListSchema(Schema):
  # List -> Data
  # WaitlistEntryOut
  id: int
  email: EmailStr


class ErrorWaitlistEntryCreateSchema(Schema):
  # Error -> Data
  # WaitlistEntryErrorOut
  email: list[Any]
  # non_field_errors: list[dict] = []


class WaitlistEntryDetailSchema(Schema):
  # Get -> Data
  # WaitlistEntryOut
  id: int
  email: EmailStr
  updated: datetime
  timestamp: datetime