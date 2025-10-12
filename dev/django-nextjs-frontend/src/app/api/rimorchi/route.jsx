import { NextResponse } from "next/server";
import { DJANGO_API_ENDPOINT } from "@/config/config";
import ApiProxy from "../proxy";

const DJANGO_API_RIMORCHIO_URL = `${DJANGO_API_ENDPOINT}/rimorchi/`;

export async function GET(request) {
  try {
    const url = `${DJANGO_API_RIMORCHIO_URL}`;
    const { data, status } = await ApiProxy.get(url, true);
    
    if (status !== 200) {
      console.error('Rimorchi GET error response:', { status, data });
      return NextResponse.json(data || { error: 'Failed to fetch rimorchi' }, { status });
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Rimorchi GET route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const requestData = await request.json();
    const url = `${DJANGO_API_RIMORCHIO_URL}`;
    const { data, status } = await ApiProxy.post(url, requestData, true);
    
    if (status !== 200 && status !== 201) {
      console.error('Rimorchio POST error response:', { status, data });
      return NextResponse.json(data || { error: 'Failed to create rimorchio' }, { status });
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Rimorchio POST route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
