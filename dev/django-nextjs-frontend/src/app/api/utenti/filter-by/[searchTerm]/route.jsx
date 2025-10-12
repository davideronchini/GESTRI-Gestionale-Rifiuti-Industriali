import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_UTENTI_URL = `${DJANGO_API_ENDPOINT}/utenti/`

export async function POST(request, { params }) {
  try {
    const { searchTerm } = await params
    const decodedTerm = decodeURIComponent(searchTerm)
    const requestData = await request.json()
    
    const url = `${DJANGO_API_UTENTI_URL}filter-by/${encodeURIComponent(decodedTerm)}`
    const { data, status } = await ApiProxy.post(url, requestData, true)

    if (status >= 400) {
      console.error('Utenti filter error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json({ data }, { status: status })
  } catch (error) {
    console.error('Utenti filter route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

