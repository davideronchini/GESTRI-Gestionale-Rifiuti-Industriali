"use client"

import { useAuth } from "@/providers/authProvider";
import { useEffect } from "react";
import useSWR from "swr";

const fetcher = async (url) => {
  const res = await fetch(url, {
    // importante: invia i cookie di sessione Django
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    try {
      error.info = await res.json();
    } catch {
      error.info = null;
    }
    error.status = res.status;
    throw error;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
};

const WAITLIST_API_URL = '/api/waitlists/'

export default function Page() {
  const auth = useAuth();

  // chiave SWR separata per stato auth, per evitare riuso del 401 dopo il login
  const swrKey = `${WAITLIST_API_URL}::auth:${auth?.isAuthenticated ? '1' : '0'}`;
  const { data, error, isLoading } = useSWR(swrKey, () => fetcher(WAITLIST_API_URL), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  useEffect(() => {
    if (error?.status === 401) {
      auth.loginRequiredRedirect();
    }
  }, [auth, error]);

  if (error && error.status !== 401) {
    console.log("Error", error);
    return <div>Failed to load data from Django API</div>
  }
  if (isLoading) return <div>Loading...</div>

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        {JSON.stringify(data)}
      </div>
    </main>
  );
}