"use client"

import React, { useEffect } from "react"
import fetcher from "@/utils/fetcher";
import useSWR from "swr";
import { useAuth } from "@/providers/authProvider";

export default function Page({ params }) {
  const resolvedParams = React.use(params)
  const lookupId = resolvedParams ? resolvedParams.id : 0

  const auth = useAuth();

  const swrKey = `${`/api/waitlists/${lookupId}`}::auth:${auth?.isAuthenticated ? '1' : '0'}`;
  const { data, error, isLoading } = useSWR(swrKey, () => fetcher(`/api/waitlists/${lookupId}`), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  useEffect(()=>{
    if (error?.status === 401){
      // redirect to login page
      auth.loginRequiredRedirect();
    }
  }, [error?.status])

  if (error) return <div>Failed to load data from Django API</div>
  if (isLoading) return <div>Loading...</div>

  return <div>
    <div>Waitlist ID: {resolvedParams?.id}</div>

     <div>Data: {JSON.stringify(data)}</div>
  </div>;
}