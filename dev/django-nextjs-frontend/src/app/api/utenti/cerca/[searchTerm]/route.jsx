import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_UTENTI_URL = `${DJANGO_API_ENDPOINT}/utenti/`

export async function GET(request, { params }) {
  try {
    const { searchTerm } = await params
    const decodedTerm = decodeURIComponent(searchTerm)
    
    // Se il termine di ricerca è vuoto o è solo spazi, restituisci tutti gli utenti
    if (!decodedTerm || decodedTerm.trim() === '' || decodedTerm.trim() === ' ') {
      const { data, status } = await ApiProxy.get(DJANGO_API_UTENTI_URL, true)
      
      if (status >= 400) {
        console.error('Utenti search (all) error response:', { status, data });
        return NextResponse.json(data || { error: 'Server error' }, { status: status })
      }
      
      return NextResponse.json({ data }, { status: status })
    }
    
    const url = `${DJANGO_API_UTENTI_URL}cerca/${encodeURIComponent(decodedTerm)}`
    const { data, status } = await ApiProxy.get(url, true)

    if (status >= 400) {
      console.error('Utenti search error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json({ data }, { status: status })
  } catch (error) {
    console.error('Utenti search route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

