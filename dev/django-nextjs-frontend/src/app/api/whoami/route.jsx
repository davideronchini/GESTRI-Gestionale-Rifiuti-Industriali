import { NextResponse } from 'next/server'
import { DJANGO_API_ENDPOINT } from '@/config/config'
import ApiProxy from '../proxy'

// GET /api/whoami -> proxy to backend /whoami
export async function GET() {
  const endpoint = `${DJANGO_API_ENDPOINT}/whoami`
  const { data, status } = await ApiProxy.get(endpoint, true)
  return NextResponse.json(data, { status })
}
