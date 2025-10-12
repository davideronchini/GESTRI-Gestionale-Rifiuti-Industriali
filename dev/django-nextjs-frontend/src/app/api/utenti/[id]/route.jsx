import { NextResponse } from "next/server"
import { DJANGO_API_ENDPOINT } from "@/config/config"
import ApiProxy from "../../proxy"

const DJANGO_API_UTENTI_URL = `${DJANGO_API_ENDPOINT}/utenti/`

export async function DELETE(request, { params }){
  const id = params.id
  const endpoint = `${DJANGO_API_UTENTI_URL}${id}`

  // Use ApiProxy to include Authorization header
  const headers = await ApiProxy.getHeaders(true)

  const requestOption = {
    method: 'DELETE',
    headers: headers,
  }

  const { data, status } = await ApiProxy.handleFetch(endpoint, requestOption)

  return NextResponse.json(data, { status: status })
}

export async function GET(request, { params } ) {
  const endpoint = params?.id ? `${DJANGO_API_UTENTI_URL}${params.id}` : null;

  if (!endpoint) return NextResponse.json({ error: "ID parameter is required" }, { status: 400 }); 

  const {data, status} = await ApiProxy.get(endpoint, true);

  // Some backend routes return the payload directly, others wrap it in { data: ... }.
  // Normalize so frontend always receives the actual resource object.
  const payload = (data && typeof data === 'object' && 'data' in data) ? data.data : data;

  return NextResponse.json(payload, {status: status});
}

export async function PUT(request, { params }) {
  const id = params.id
  const endpoint = `${DJANGO_API_UTENTI_URL}${id}`

  try {
    // Debug: log incoming request method and id
    try {
      console.log('[API /api/utenti/[id] PUT] called for id=', id)
      console.log('[API /api/utenti/[id] PUT] headers=', JSON.stringify(Object.fromEntries(request.headers.entries())))
    } catch (e) {
      // ignore logging errors
    }

    const body = await request.json()
    console.log('[API /api/utenti/[id] PUT] body=', JSON.stringify(body))

    // Use ApiProxy to include Authorization header
    const headers = await ApiProxy.getHeaders(true)
    headers['Content-Type'] = 'application/json'

    const requestOption = {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body)
    }

    const { data, status } = await ApiProxy.handleFetch(endpoint, requestOption)

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Error updating utente:', error)
    // Return the error message back so the client can see details during debugging
    return NextResponse.json({ error: 'Failed to update user', detail: String(error) }, { status: 500 })
  }
}

