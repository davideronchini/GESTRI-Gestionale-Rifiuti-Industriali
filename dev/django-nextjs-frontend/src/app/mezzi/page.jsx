"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import WaitlistForm from "../waitlists/forms";
import { useState } from "react";
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
  const { data, error, isLoading } = useSWR(
    WAITLIST_API_URL, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

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

  return (
    <Container>
      
    </Container>
  );
}
