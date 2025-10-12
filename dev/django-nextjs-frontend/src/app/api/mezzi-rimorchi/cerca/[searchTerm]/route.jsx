import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_MEZZI_RIMORCHI_URL = `${DJANGO_API_ENDPOINT}/mezzi-rimorchi/`

export async function GET(request, { params }) {
  try {
    const { searchTerm } = await params
    const decodedSearchTerm = decodeURIComponent(searchTerm)
    
    // Se il termine di ricerca è vuoto o è solo spazi, restituisci tutti i mezzi-rimorchi
    if (!decodedSearchTerm || decodedSearchTerm.trim() === '' || decodedSearchTerm.trim() === ' ') {
      const { data, status } = await ApiProxy.get(DJANGO_API_MEZZI_RIMORCHI_URL, true)
      
      if (status >= 400) {
        console.error('Mezzi-rimorchi search (all) error response:', { status, data });
        return NextResponse.json(data || { error: 'Server error' }, { status: status })
      }
      
      return NextResponse.json({ data }, { status: status })
    }
    
    const url = `${DJANGO_API_MEZZI_RIMORCHI_URL}cerca/${encodeURIComponent(decodedSearchTerm)}`
    const { data, status } = await ApiProxy.get(url, true)

    if (status >= 400) {
      console.error('Mezzi-rimorchi search error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json({ data }, { status: status })
  } catch (error) {
    console.error('Mezzi-rimorchi search route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
