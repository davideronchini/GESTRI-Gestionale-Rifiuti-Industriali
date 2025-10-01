import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_ATTIVITA_URL = `${DJANGO_API_ENDPOINT}/attivita/`

// GET per compatibilità - ora usa il nuovo endpoint di ricerca
export async function GET(request, { params }){
  try {
    const value = params?.value || ''
    // Non serve più convertire _empty_, usiamo direttamente il valore
    // Usa l'endpoint di ricerca generale per compatibilità
    const endpoint = `${DJANGO_API_ATTIVITA_URL}cerca/${encodeURIComponent(value)}`
    const { data, status } = await ApiProxy.get(endpoint, true)

    if (status >= 400) {
      console.error('Filter GET error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json({data}, {status: status})
  } catch (error) {
    console.error('Filter GET route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}

// Nuovo endpoint POST per filtri multipli
export async function POST(request, { params }){
  try {
    const value = params?.value || ''
    // Non serve più convertire _empty_, usiamo direttamente il valore
    
    // Leggi il body della richiesta
    const body = await request.json()
    const { filters = [] } = body
    
    const endpoint = `${DJANGO_API_ATTIVITA_URL}filter-by/${encodeURIComponent(value)}`
    
    // Invia i filtri nel body della richiesta POST al Django
    const { data, status } = await ApiProxy.post(endpoint, { filters }, true)

    if (status >= 400) {
      console.error('Filter POST error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json({data}, {status: status})
  } catch (error) {
    console.error('Errore nella route POST filter-by:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    )
  }
}
