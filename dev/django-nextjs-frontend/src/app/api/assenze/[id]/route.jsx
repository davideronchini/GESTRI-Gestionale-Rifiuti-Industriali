import { NextResponse } from "next/server"
import ApiProxy from "../../proxy"
import { DJANGO_API_ENDPOINT } from "@/config/config"

const DJANGO_API_ASSENZA_URL = `${DJANGO_API_ENDPOINT}/assenze/`

export async function GET(request, { params }) {
  try {
    const id = params?.id
    if (!id || isNaN(Number(id))) return NextResponse.json({ error: 'Missing assenza id in URL' }, { status: 400 })
  const targetUrl = `${DJANGO_API_ASSENZA_URL}${id}`
    const { data, status } = await ApiProxy.get(targetUrl, true)
    if (status >= 400) {
      console.error('Assenza GET(id) error response:', { status, data })
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }
    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Assenza GET(id) route error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params?.id
    if (!id || isNaN(Number(id))) return NextResponse.json({ error: 'Missing assenza id in URL' }, { status: 400 })
    const requestData = await request.json()
  const targetUrl = `${DJANGO_API_ASSENZA_URL}${id}`
    // forward to Django via ApiProxy
    const { data, status } = await ApiProxy.put(targetUrl, requestData, true)
    if (status >= 400) {
      console.error('Assenza PUT(id) error response:', { status, data })
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }
    return NextResponse.json(data, { status: status })
  } catch (error) {
    console.error('Assenza PUT(id) route error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params?.id
    if (!id || isNaN(Number(id))) return NextResponse.json({ error: 'Missing assenza id in URL' }, { status: 400 })
  const targetUrl = `${DJANGO_API_ASSENZA_URL}${id}`
    const { data, status } = await ApiProxy.delete(targetUrl, true)
    if (status >= 400) {
      console.error('Assenza DELETE(id) error response:', { status, data })
      return NextResponse.json(data || { error: 'Server error' }, { status: status })
    }
    return NextResponse.json(data || { success: true }, { status: status })
  } catch (error) {
    console.error('Assenza DELETE(id) route error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
