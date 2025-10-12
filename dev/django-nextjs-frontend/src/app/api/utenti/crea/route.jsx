import { NextResponse } from "next/server"
import ApiProxy from "../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

// Dedicated route for user creation
const DJANGO_API_UTENTI_URL = `${DJANGO_API_ENDPOINT}/utenti/`

export async function POST(request) {
  try {
    const body = await request.json()

    // Minimal validation and normalization (copied from /api/utenti POST)
    const errors = {}
    const cleaned = {}

    const trimOrNull = (v) => {
      if (v === null || v === undefined) return null
      const s = String(v).trim()
      return s.length ? s : null
    }
    const toIsoDate = (v) => {
      if (!v) return null
      const s = String(v)
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s // already ISO
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) // dd/MM/YYYY
      if (m) return `${m[3]}-${m[2]}-${m[1]}`
      return null
    }

    // email obbligatoria
    const email = trimOrNull(body?.email)
    if (!email) {
      errors.email = ['Email obbligatoria']
    } else {
      cleaned.email = email
    }

    // password obbligatoria
    const password = trimOrNull(body?.password)
    if (!password) {
      errors.password = ['Password obbligatoria']
    } else {
      cleaned.password = password
    }

    // normalizza ruolo
    const validRuoli = ['CLIENTE', 'OPERATORE', 'STAFF']
    const ruolo = (body?.ruolo || 'CLIENTE').toString().toUpperCase()
    cleaned.ruolo = validRuoli.includes(ruolo) ? ruolo : 'CLIENTE'

    // opzionali
    cleaned.nome = trimOrNull(body?.nome)
    cleaned.cognome = trimOrNull(body?.cognome)
    cleaned.luogoDiNascita = trimOrNull(body?.luogoDiNascita)
    cleaned.residenza = trimOrNull(body?.residenza)
    cleaned.dataDiNascita = toIsoDate(body?.dataDiNascita)

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: 'Validazione fallita', details: errors }, { status: 400 })
    }

    const { data, status } = await ApiProxy.post(DJANGO_API_UTENTI_URL, cleaned, true)

    if (status >= 400) {
      console.error('Utenti CREA POST error response:', { status, data })
      return NextResponse.json(data || { error: 'Server error' }, { status })
    }

    return NextResponse.json(data, { status })
  } catch (error) {
    console.error('Utenti CREA POST route error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
