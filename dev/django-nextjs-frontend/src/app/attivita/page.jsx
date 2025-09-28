"use client"

import { useAuth } from "@/providers/authProvider";
import WaitlistForm from "../waitlists/forms";
import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { Container, Title, Text, Box } from '@mantine/core';
import AppTable from '@/components/ui/AppTable';

const fetcher = async url =>{
  const res = await fetch(url)

  if (!res.ok){
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
}

const WAITLIST_API_URL = '/api/waitlists/'

export default function Page() {
  const auth = useAuth();

  // SWR condizionato: esegue solo se l'auth è inizializzato e l'utente è autenticato
  const shouldFetch = !auth.isLoading && auth.isAuthenticated;
  const swrKey = shouldFetch ? WAITLIST_API_URL : null;
  
  const { data, error, isLoading } = useSWR(
    swrKey, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  useEffect(()=>{
    console.log('Attivita page useEffect - isLoading:', auth.isLoading, 'isAuthenticated:', auth.isAuthenticated);
    
    // Evita redirect se l'auth non è ancora inizializzato
    if (auth.isLoading) return;
    
    // Se l'utente non è autenticato, reindirizza al login
    if (!auth.isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      auth.loginRequiredRedirect();
      return;
    }
  }, [auth.isLoading, auth.isAuthenticated])

  // Gestisci errori 401 con un ref per evitare loop
  // Gestisci errori 401 con una logica coerente a quella della Home
  // - tiene traccia dello stato auth precedente
  // - usa un flag per evitare redirect ripetuti
  const lastAuthState = useRef({ isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading });
  const hasHandled401 = useRef(false);

  useEffect(() => {
    const is401 = error?.status === 401;

    if (is401 && !auth.isLoading && auth.isAuthenticated && !hasHandled401.current) {
      console.log('401 error detected in Attivita page, calling loginRequiredRedirect');
      hasHandled401.current = true;
      auth.loginRequiredRedirect();
    }

    // Reset del flag quando non c'è più errore 401
    if (!is401) {
      hasHandled401.current = false;
    }

    // Aggiorna lo stato precedente
    lastAuthState.current = { isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading };
  }, [error?.status, auth.isLoading, auth.isAuthenticated, auth.loginRequiredRedirect]);

  // Mostra loading mentre l'auth si inizializza
  if (auth.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se non autenticato, non mostrare nulla (il redirect è in corso)
  if (!auth.isAuthenticated) {
    return null;
  }

  if (error && error.status !== 401) {
    return <div>Failed to load data from Django API</div>;
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      {/* Example table - replace with real data when available */}
      <Box style={{ marginTop: 12 }}>
        <AppTable
          columns={[
            { key: 'id', title: 'ID' },
            { key: 'titolo', title: 'Titolo' },
            { key: 'data', title: 'Data' },
            { key: 'stato', title: 'Stato' },
          ]}
          data={
            data && Array.isArray(data) ? data.map(d => ({
              id: d.id ?? '-',
              titolo: d.titolo ?? '-',
              data: d.data ?? '-',
              stato: d.statoAttivita ?? '-',
            })) : [
              { id: '1', titolo: 'Esempio Attività', data: '2025-09-28', stato: 'Pianificata' }
            ]
          }
        />
      </Box>
    </Container>
  );
}
