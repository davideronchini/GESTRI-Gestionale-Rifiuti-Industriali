from django import forms
from django.utils import timezone
from .models import WaitlistEntry

class WaitlistEntryCreateForm(forms.ModelForm):
  # email = forms.EmailField()
  class Meta:
    model = WaitlistEntry
    fields = ['email']

    def clean_email(self):
      email = self.cleaned.data.get('email')
      today = timezone.now().day
      queryset = WaitlistEntry.objects.filter(
        email = email,
        timestamp__day = today
      )
      if queryset.count() >= 1:
        raise forms.ValidationError("You have already signed up too many times today")
      # if email.endswith('@gmail.com'):
      #   raise forms.ValidationError("Gmail addresses are not allowed")
      return email