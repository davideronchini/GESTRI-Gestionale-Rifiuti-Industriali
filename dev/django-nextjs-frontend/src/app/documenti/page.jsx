"use client"

import { useAuth } from "@/providers/authProvider";
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
    console.log('Documenti page useEffect - isLoading:', auth.isLoading, 'isAuthenticated:', auth.isAuthenticated);
    
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
  const hasHandled401 = useRef(false);
  
  useEffect(() => {
    if (error?.status === 401 && !auth.isLoading && !hasHandled401.current) {
      console.log('401 error detected, redirecting to login');
      hasHandled401.current = true;
      auth.loginRequiredRedirect();
    }
    
    // Reset del flag quando non c'è più errore 401
    if (error?.status !== 401) {
      hasHandled401.current = false;
    }
  }, [error?.status, auth.isLoading])

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
      
    </Container>
  );
}
