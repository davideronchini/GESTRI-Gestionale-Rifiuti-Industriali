import { NextResponse } from "next/server"
import ApiProxy from "../../../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

export async function GET(request, { params }){
  try {
    const { id } = params
    const targetUrl = `${DJANGO_API_ENDPOINT}/assenze/operatore/${id}/`

    const { data, status } = await ApiProxy.get(targetUrl, true)

    if (status >= 400) {
      console.error('Assenze disponibili GET error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Assenze disponibili route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}
