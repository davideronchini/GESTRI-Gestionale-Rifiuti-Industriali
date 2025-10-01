import { NextResponse } from "next/server"
import { DJANGO_API_ENDPOINT } from "@/config/config"
import ApiProxy from "../../proxy";

const DJANGO_API_ATTIVITA_BASE = `${DJANGO_API_ENDPOINT}/attivita/`

export async function DELETE(request, { params }){
  const id = params.id
  const endpoint = `${DJANGO_API_ATTIVITA_BASE}${id}`

  // Use ApiProxy to include Authorization header
  const headers = await ApiProxy.getHeaders(true)

  const requestOption = {
    method: 'DELETE',
    headers: headers,
  }

  const { data, status } = await ApiProxy.handleFetch(endpoint, requestOption)

  return NextResponse.json(data, { status: status })
}

const DJANGO_API_ATTIVITA_URL = `${DJANGO_API_ENDPOINT}/attivita/`

export async function GET(request, { params } ) {
  const endpoint = params?.id ? `${DJANGO_API_ATTIVITA_URL}${params.id}` : null;

  if (!endpoint) return NextResponse.json({ error: "ID parameter is required" }, { status: 400 }); 

  const {data, status} = await ApiProxy.get(endpoint, true);

  return NextResponse.json(data, {status: status});
}