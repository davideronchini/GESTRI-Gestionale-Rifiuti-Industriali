import { NextResponse } from "next/server"
import { DJANGO_API_ENDPOINT } from "@/config/config"
import ApiProxy from "@/app/api/proxy"
import { useAuth } from "@/providers/authProvider";

export async function GET(request, { params }) {
  const { date } = params
  
  console.log(`[API] Fetching activities for date: ${date}`)
  
  // Validate date format (YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.log(`[API] Invalid date format: ${date}`)
    return NextResponse.json(
      { error: "Invalid date format. Expected YYYY-MM-DD" }, 
      { status: 400 }
    )
  }

  const endpoint = `${DJANGO_API_ENDPOINT}/attivita/by-date/${date}`
  console.log(`[API] Calling Django URL: ${endpoint}`)
  
  const { data, status } = await ApiProxy.get(endpoint, true)
  console.log(`[API] Django response status: ${status}, data:`, data)

  // If unauthorized, return JSON 401 - redirect handled client-side
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Handle empty results as success (not error)
  if (status === 404 || !data || (Array.isArray(data) && data.length === 0)) {
    console.log(`[API] No activities found for date ${date}, returning empty array`)
    return NextResponse.json({ data: [] }, { status: 200 })
  }

  // Return the response in the same format as other routes
  return NextResponse.json({ data }, { status: status })
}
