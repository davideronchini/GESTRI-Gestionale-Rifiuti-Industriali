import { NextResponse } from "next/server"
import { DJANGO_API_ENDPOINT } from "@/config/config"
import ApiProxy from "@/app/api/proxy"

export async function GET(request, { params }) {
  const { stato } = params
  
  console.log(`[API] Fetching vehicles for status: ${stato}`)
  
  // Validate status values
  const validStates = ['DISPONIBILE', 'OCCUPATO', 'MANUTENZIONE']
  if (!stato || !validStates.includes(stato.toUpperCase())) {
    console.log(`[API] Invalid status: ${stato}`)
    return NextResponse.json(
      { error: `Invalid status. Expected one of: ${validStates.join(', ')}` }, 
      { status: 400 }
    )
  }

  const endpoint = `${DJANGO_API_ENDPOINT}/mezzi/by-stato/${stato.toUpperCase()}`
  console.log(`[API] Calling Django URL: ${endpoint}`)
  
  const { data, status } = await ApiProxy.get(endpoint, true)
  console.log(`[API] Django response status: ${status}, data:`, data)

  // If unauthorized, return JSON 401 - redirect handled client-side
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Handle empty results as success (not error)
  if (status === 404 || !data || (Array.isArray(data) && data.length === 0)) {
    console.log(`[API] No vehicles found for status ${stato}, returning empty array`)
    return NextResponse.json({ data: [] }, { status: 200 })
  }

  // Return the response in the same format as other routes
  return NextResponse.json({ data }, { status: status })
}