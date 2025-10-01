import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_ATTIVITA_URL = `${DJANGO_API_ENDPOINT}/attivita/`

export async function GET(request, { params }){
  try {
    const term = params?.term || ''
    // Non serve più convertire _empty_, usiamo direttamente il termine
    const endpoint = `${DJANGO_API_ATTIVITA_URL}cerca/${encodeURIComponent(term)}`
    
    console.log('Search API route called with term:', term);
    console.log('Calling Django endpoint:', endpoint);
    
    const { data, status } = await ApiProxy.get(endpoint, true)
    
    console.log('Django response status:', status);
    console.log('Django response data:', JSON.stringify(data).substring(0, 200));

    // Se Django risponde con errore, restituisci l'errore con il corpo della risposta
    if (status >= 400) {
      console.error('Django error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    // Fix della sintassi: deve essere NextResponse.json(data, {status})
    return NextResponse.json(data, {status: status})
  } catch (error) {
    console.error('Search API route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}
