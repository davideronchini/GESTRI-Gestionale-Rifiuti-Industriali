from typing import List
from ninja import Router
import json

from django.shortcuts import get_object_or_404

from ninja_jwt.authentication import JWTAuth

import helpers

from .forms import WaitlistEntryCreateForm
from .models import WaitlistEntry
from .schemas import WaitlistEntryListSchema, WaitlistEntryDetailSchema, WaitlistEntryCreateSchema, ErrorWaitlistEntryCreateSchema

router = Router()

@router.get("", response=List[WaitlistEntryListSchema], auth=helpers.api_auth_any_authenticated)
def list_waitlist_entries(request):
  qs = WaitlistEntry.objects.filter(user=request.user) #queryset
  return qs

@router.post("", 
  response={
    201: WaitlistEntryCreateSchema,
    400: ErrorWaitlistEntryCreateSchema
  },
  auth=helpers.api_auth_user_or_anon)
def create_waitlist_entry(request, data: WaitlistEntryCreateSchema):
  form = WaitlistEntryCreateForm(data.dict())
  if not form.is_valid():
    # cleaned_data = form.cleaned_data
    # obj = WaitlistEntry(**cleaned_data.dict())
    form_errors = json.loads(form.errors.as_json())
    return 400, form_errors
  obj = form.save(commit=False)
  
  if request.user.is_authenticated:
    # obj.user_id = request.user.id
    obj.user = request.user
  obj.save()
  return 201, obj

@router.get("{entry_id}", response=WaitlistEntryDetailSchema, auth=helpers.api_auth_any_authenticated)
def get_waitlist_entry(request, entry_id: int):
  obj = get_object_or_404(WaitlistEntry, id=entry_id, user=request.user)
  return obj