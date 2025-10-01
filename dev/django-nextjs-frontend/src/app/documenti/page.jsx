"use client"

import { useAuth } from "@/providers/authProvider";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import WaitlistForm from "../waitlists/forms";
import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { Container, Title, Text, Box } from '@mantine/core';

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
  const { data, error, isLoading } = useSWR(
    !auth.isLoading && auth.isAuthenticated ? WAITLIST_API_URL : null, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  // Usa il hook personalizzato per gestire l'autenticazione
  const authGuard = useAuthGuard({
    errors: [error]
  });



  // Mostra loading mentre l'auth si inizializza
  if (authGuard.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se non autenticato o redirect in corso, non mostrare nulla
  if (!authGuard.isAuthenticated || authGuard.redirectInProgress) {
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
      
    </Container>
  );
}
