"use client"

import React from "react"
import fetcher from "@/utils/fetcher";
import useSWR from "swr";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function Page({ params }) {
  const resolvedParams = React.use(params)
  const lookupId = resolvedParams ? resolvedParams.id : 0

  const { data, error, isLoading } = useSWR(`/api/waitlists/${lookupId}`, () => fetcher(`/api/waitlists/${lookupId}`), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Usa il nuovo hook per gestire l'autenticazione in modo unificato
  const authGuard = useAuthGuard({ errors: [error] });

  // Mostra loading mentre l'auth si inizializza
  if (authGuard.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se non autenticato, non mostrare nulla (il redirect è in corso)
  if (!authGuard.isAuthenticated) {
    return null;
  }

  if (error && error.status !== 401) {
    return <div>Failed to load data from Django API</div>;
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>
    <div>Waitlist ID: {resolvedParams?.id}</div>

     <div>Data: {JSON.stringify(data)}</div>
  </div>;
}