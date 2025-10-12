import { NextResponse } from "next/server"
import ApiProxy from "../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_DOCUMENTI_URL = `${DJANGO_API_ENDPOINT}/documenti/`

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const url = `${DJANGO_API_DOCUMENTI_URL}${id}`
    const { data, status } = await ApiProxy.get(url, true)

    if (status >= 400) {
      console.error('Documento GET by ID error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Documento GET by ID route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const url = `${DJANGO_API_DOCUMENTI_URL}${id}`
    const { data, status } = await ApiProxy.delete(url, true)

    if (status >= 400) {
      console.error('Documento DELETE error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json(data || { success: true }, { status: status })
  } catch (error) {
    console.error('Documento DELETE route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    // Proxy the incoming request body to the backend PATCH endpoint.
    // Support both JSON and FormData: if the incoming request has JSON body,
    // forward it as JSON; if it's multipart/form-data (file uploads),
    // forward as FormData (ApiProxy.put/patch will detect FormData).
    const contentType = request.headers.get('content-type') || '';
    let requestData = null;

    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      // For multipart, read as form data
      requestData = await request.formData();
    } else {
      // Fallback: try to parse JSON, but allow empty body
      try { requestData = await request.json(); } catch (e) { requestData = null }
    }

    const url = `${DJANGO_API_DOCUMENTI_URL}${id}`
    const { data, status } = await ApiProxy.patch(url, requestData, true)

    if (status >= 400) {
      console.error('Documento PATCH error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Documento PATCH route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
