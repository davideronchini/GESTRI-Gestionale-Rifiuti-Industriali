import { DJANGO_API_ENDPOINT } from '@/config/config';
import { NextResponse } from 'next/server';
import ApiProxy from '@/app/api/proxy';

const DJANGO_API_ATTIVITA_URL = `${DJANGO_API_ENDPOINT}/attivita/`;

export async function GET(request, { params }) {
  const endpoint = params?.id ? `${DJANGO_API_ATTIVITA_URL}${params.id}/documento` : null;

  if (!endpoint) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });

  const { data, status } = await ApiProxy.get(endpoint, true);

  return NextResponse.json(data, { status: status });
}