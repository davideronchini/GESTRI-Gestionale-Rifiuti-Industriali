import { NextResponse } from "next/server"
import ApiProxy from "../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_MEZZI_RIMORCHI_URL = `${DJANGO_API_ENDPOINT}/mezzi-rimorchi/`

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const url = `${DJANGO_API_MEZZI_RIMORCHI_URL}${id}`
    const { data, status } = await ApiProxy.get(url, true)

    if (status >= 400) {
      console.error('Mezzo-rimorchio GET by ID error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Mezzo-rimorchio GET by ID route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const url = `${DJANGO_API_MEZZI_RIMORCHI_URL}${id}`
    const { data, status } = await ApiProxy.delete(url, true)

    if (status >= 400) {
      console.error('Mezzo-rimorchio DELETE error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json(data || { success: true }, { status: status })
  } catch (error) {
    console.error('Mezzo-rimorchio DELETE route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const requestData = await request.json()
    const url = `${DJANGO_API_MEZZI_RIMORCHI_URL}${id}`
    const { data, status } = await ApiProxy.put(url, requestData, true)

    if (status >= 400) {
      console.error('Mezzo-rimorchio PUT error response:', { status, data });
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }

    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Mezzo-rimorchio PUT route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
