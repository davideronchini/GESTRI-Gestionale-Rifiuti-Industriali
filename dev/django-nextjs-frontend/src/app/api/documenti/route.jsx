import { NextResponse } from "next/server"
import ApiProxy from "../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_DOCUMENTI_URL = `${DJANGO_API_ENDPOINT}/documenti/`

export async function GET(request){
  try {
    const {data, status} = await ApiProxy.get(DJANGO_API_DOCUMENTI_URL, true)

    if (status >= 400) {
      console.error('Documenti GET error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json({data}, {status: status})
  } catch (error) {
    console.error('Documenti GET route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}

export async function POST(request) {
  try {
    const requestData = await request.json()
    const {data, status} = await ApiProxy.post(DJANGO_API_DOCUMENTI_URL, requestData, true)

    if (status >= 400) {
      console.error('Documenti POST error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Documenti POST route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}
