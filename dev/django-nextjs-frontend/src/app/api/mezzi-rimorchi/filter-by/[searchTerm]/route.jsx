import { NextResponse } from "next/server"
import ApiProxy from "../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_MEZZI_RIMORCHI_URL = `${DJANGO_API_ENDPOINT}/mezzi-rimorchi/`

export async function POST(request, { params }) {
  try {
    const { searchTerm } = await params
    const decodedSearchTerm = decodeURIComponent(searchTerm)
    const requestData = await request.json()
    
    const url = `${DJANGO_API_MEZZI_RIMORCHI_URL}filter-by/${encodeURIComponent(decodedSearchTerm)}`
    const { data, status } = await ApiProxy.post(url, requestData, true)

    if (status >= 400) {
      console.error('Mezzi-rimorchi filter error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json({ data }, { status: status })
  } catch (error) {
    console.error('Mezzi-rimorchi filter route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
