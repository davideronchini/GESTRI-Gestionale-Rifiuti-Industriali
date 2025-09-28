"use server"
import { DJANGO_API_ENDPOINT } from "@/config/config"
import { setToken, setRefreshToken} from "@/utils/auth"
import { NextResponse } from "next/server"

const DJANGO_API_LOGIN_URL = `${DJANGO_API_ENDPOINT}/utenti/login`

export async function POST(request) {
  try {
    // Safely read request body
    const requestData = await request.json().catch(() => ({}))
    const jsonData = JSON.stringify(requestData);

    const requestOption = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
    }

    const upstreamResponse = await fetch(DJANGO_API_LOGIN_URL, requestOption);

    // Safely parse upstream response (may be empty or non-JSON)
    const rawText = await upstreamResponse.text().catch(() => '');
    let responseData = {};
    if (rawText) {
      try {
        responseData = JSON.parse(rawText);
      } catch {
        responseData = { detail: rawText };
      }
    }

    if (upstreamResponse.ok) {
      console.log("Logged in successfully");

      const { email, access, refresh } = responseData || {};

      // Set tokens only if present
      if (access) setToken(access)
      if (refresh) setRefreshToken(refresh)

      return NextResponse.json(
        { loggedIn: true, email: email ?? requestData?.email ?? null },
        { status: 200 }
      );
    }

    // Forward meaningful error with consistent JSON shape
    return NextResponse.json(
      { loggedIn: false, ...responseData },
      { status: upstreamResponse.status || 400 }
    );
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { loggedIn: false, error: 'Login failed due to a server error' },
      { status: 500 }
    );
  }
}