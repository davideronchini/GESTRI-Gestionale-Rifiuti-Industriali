import { NextResponse } from "next/server";
import { DJANGO_API_ENDPOINT } from "@/config/config";
import ApiProxy from "../../proxy";

const DJANGO_API_RIMORCHIO_URL = `${DJANGO_API_ENDPOINT}/rimorchi/`;

export async function GET(request, { params }) {
  const endpoint = params?.id ? `${DJANGO_API_RIMORCHIO_URL}${params.id}` : null;

  if (!endpoint) return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });

  const { data, status } = await ApiProxy.get(endpoint, true);

  return NextResponse.json(data, { status: status });
}

export async function PUT(request, { params }) {
  const id = params.id;
  const endpoint = `${DJANGO_API_RIMORCHIO_URL}${id}`;

  try {
    const body = await request.json();

    console.log('[Rimorchio API] PUT request for ID:', id);
    console.log('[Rimorchio API] Payload:', JSON.stringify(body, null, 2));

    // Use ApiProxy to include Authorization header
    const headers = await ApiProxy.getHeaders(true);
    headers['Content-Type'] = 'application/json';

    const requestOption = {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body)
    };

    const { data, status } = await ApiProxy.handleFetch(endpoint, requestOption);

    console.log('[Rimorchio API] Django response status:', status);

    if (status !== 200) {
      console.error('[Rimorchio API] Django error:', data);
    } else {
      console.log('[Rimorchio API] Django response data:', data);
    }

    return NextResponse.json(data, { status: status });
  } catch (error) {
    console.error('[Rimorchio API] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to update rimorchio' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const id = params.id;
  const endpoint = `${DJANGO_API_RIMORCHIO_URL}${id}`;

  // Use ApiProxy to include Authorization header
  const headers = await ApiProxy.getHeaders(true);

  const requestOption = {
    method: 'DELETE',
    headers: headers,
  };

  const { data, status } = await ApiProxy.handleFetch(endpoint, requestOption);

  return NextResponse.json(data, { status: status });
}
