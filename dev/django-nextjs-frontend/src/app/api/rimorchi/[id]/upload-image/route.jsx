import { NextResponse } from "next/server"
import { DJANGO_API_ENDPOINT } from "@/config/config"
import { getToken } from "@/utils/auth"

const DJANGO_API_RIMORCHI_URL = `${DJANGO_API_ENDPOINT}/rimorchi/`

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const url = `${DJANGO_API_RIMORCHI_URL}${id}/upload-image`

    // Prepara gli headers con il token di autenticazione
    const headers = {}
    const authToken = getToken()
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: headers,
      body: formData
    })

    const data = await res.json()

    if (res.status >= 400) {
      console.error('Rimorchio upload image error response:', { status: res.status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: res.status })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Rimorchio upload image route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
