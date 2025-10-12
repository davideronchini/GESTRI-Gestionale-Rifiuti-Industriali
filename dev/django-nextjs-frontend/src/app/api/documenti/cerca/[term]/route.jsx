import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_DOCUMENTI_URL = `${DJANGO_API_ENDPOINT}/documenti/`

export async function GET(request, { params }) {
  try {
    const { term } = await params
    const decodedTerm = decodeURIComponent(term)
    
    // Se il termine di ricerca è vuoto o è solo spazi, restituisci tutti i documenti
    if (!decodedTerm || decodedTerm.trim() === '' || decodedTerm.trim() === ' ') {
      const { data, status } = await ApiProxy.get(DJANGO_API_DOCUMENTI_URL, true)
      
      if (status >= 400) {
        console.error('Documenti search (all) error response:', { status, data });
        return NextResponse.json(data || { error: 'Server error' }, { status: status })
      }
      
      return NextResponse.json({ data }, { status: status })
    }
    
    const url = `${DJANGO_API_DOCUMENTI_URL}cerca/${encodeURIComponent(decodedTerm)}`
    const { data, status } = await ApiProxy.get(url, true)

    if (status >= 400) {
      console.error('Documenti search error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json({ data }, { status: status })
  } catch (error) {
    console.error('Documenti search route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
