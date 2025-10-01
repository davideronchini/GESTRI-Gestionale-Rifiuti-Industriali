import { NextResponse } from "next/server"
import ApiProxy from "../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_WAITLISTS_URL = `${DJANGO_API_ENDPOINT}/waitlists/`

export async function GET(request){
  try {
    const {data, status} = await ApiProxy.get(DJANGO_API_WAITLISTS_URL, true)

    if (status >= 400) {
      console.error('Waitlists GET error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json({data}, {status: status})
  } catch (error) {
    console.error('Waitlists GET route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}

export async function POST(request) {
  try {
    const requestData = await request.json()
    const {data, status} = await ApiProxy.post(DJANGO_API_WAITLISTS_URL, requestData, true)

    if (status >= 400) {
      console.error('Waitlists POST error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Waitlists POST route error:', error);
    return NextResponse.json({error: 'Internal server error', details: error.message}, {status: 500})
  }
}