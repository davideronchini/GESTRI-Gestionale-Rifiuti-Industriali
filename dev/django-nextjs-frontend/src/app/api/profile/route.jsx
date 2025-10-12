import { NextResponse } from 'next/server'
import { DJANGO_API_ENDPOINT } from '@/config/config'
import ApiProxy from '../proxy'

// GET /api/profile -> proxy to backend /profile full detail
export async function GET() {
  const endpoint = `${DJANGO_API_ENDPOINT}/profile`
  const { data, status } = await ApiProxy.get(endpoint, true)
  return NextResponse.json(data, { status })
}

// PUT /api/profile -> proxy to backend /profile update
export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const payload = {
      email: body.email,
      nome: body.nome,
      cognome: body.cognome,
      dataDiNascita: body.dataDiNascita || body.dataNascita,
      luogoDiNascita: body.luogoDiNascita || body.luogoNascita,
      residenza: body.residenza,
      ruolo: body.ruolo,
    }
    const endpoint = `${DJANGO_API_ENDPOINT}/profile`
    const { data, status } = await ApiProxy.put(endpoint, payload, true)
    return NextResponse.json(data, { status })
  } catch (error) {
    return NextResponse.json({ detail: String(error) }, { status: 500 })
  }
}

// DELETE /api/profile -> proxy to backend /profile delete
export async function DELETE() {
  const endpoint = `${DJANGO_API_ENDPOINT}/profile`
  const { data, status } = await ApiProxy.delete(endpoint, true)
  return NextResponse.json(data, { status })
}
