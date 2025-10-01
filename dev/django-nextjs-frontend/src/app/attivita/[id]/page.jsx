"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppTable from '@/components/ui/AppTable';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconTrash, IconUser, IconArrowNarrowLeft } from "@tabler/icons-react";
import { useRouter, useParams } from "next/navigation";
import AppInputField from '@/components/ui/AppInputField';
import MezzoCard from '@/components/ui/MezzoCard';
import UtenteCard from '@/components/ui/UtenteCard';

const fetcher = async url => {
  console.log('Fetching from URL:', url);
  
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
    }
  });

  console.log('Response status:', res.status);
  console.log('Response ok:', res.ok);

  if (!res.ok) {
    let errorInfo;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorInfo = await res.json();
      } else {
        // Se non è JSON, probabilmente è una risposta HTML di redirect
        const textResponse = await res.text();
        console.log('Non-JSON response:', textResponse.substring(0, 200));
        errorInfo = { message: 'Authentication required - please refresh the page' };
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      errorInfo = { message: 'Failed to parse error response' };
    }
    console.error('API Error Info:', errorInfo);
    
    // Se è un errore 401, forza il redirect al login
    if (res.status === 401) {
      console.log('401 error detected, forcing login redirect');
      window.location.href = '/login';
      return;
    }
    
    const error = new Error(`HTTP ${res.status}: ${errorInfo.message || 'An error occurred while fetching the data.'}`);
    error.info = errorInfo;
    error.status = res.status;
    throw error;
  }

  try {
    const responseData = await res.json();
    console.log('API Response:', responseData);
    return responseData;
  } catch (e) {
    console.error('Error parsing successful response:', e);
    const textResponse = await res.text();
    console.log('Response text:', textResponse.substring(0, 200));
    throw new Error('Invalid JSON response from server');
  }
}

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ?? 'sconosciuto';
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  // Responsive layout: le liste passano in verticale sotto i 1050px
  // Usiamo una media query esplicita per rispettare la richiesta
  const isMobile = useMediaQuery('(max-width: 1050px)', false, { getInitialValueInEffect: true });

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleThemeToggle = () => {
    toggleColorScheme();
  };

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { date: dateStr, time: timeStr };
  };

  const { data: attivita, error, isLoading } = useSWR(
    `/api/attivita/${id}`, 
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
    console.error('API Error:', error);
    return <div>Failed to load data from Django API: {error.message}</div>;
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Debug logging
  console.log('Attivita data:', attivita);

  return (
    <>
      {/* Deletion now happens immediately when the user clicks the delete action; no confirmation modal. */}

  <Container size="lg">
  {/* Header con titolo e profilo */}
    <Box style={{marginTop: '24px'}}>
      <Group justify="space-between" align="center">
                <Group justify="start" align="center">
                  <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
                  <AppLargeText order={1}>
                    Attività: ID#{id}
                  </AppLargeText>
                </Group>
                <Group>
                  <IconBell style={{ 
                    width: '25px', 
                    height: '25px', 
                    color: colorScheme === 'dark' 
                      ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                      : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)'), 
                    marginLeft: '10px', 
                    strokeWidth: '1.7' 
                  }} />
                  <Menu shadow="md" width={200} position="bottom-end">
                                  <Menu.Target>
                                    <Avatar color="blue" radius="xl" size={45} style={{ cursor: 'pointer' }}>
                                      {authGuard.email ? authGuard.email.charAt(0).toUpperCase() : 'U'}
                                    </Avatar>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Label>Account</Menu.Label>
                                    <Menu.Item 
                                      leftSection={<IconUser size={14} />}
                                      onClick={handleProfile}
                                    >
                                      Profilo
                                    </Menu.Item>
                                    <Menu.Item 
                                      leftSection={<IconSettings size={14} />}
                                      onClick={handleSettings}
                                    >
                                      Impostazioni
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item 
                                      leftSection={colorScheme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
                                      onClick={handleThemeToggle}
                                    >
                                      {colorScheme === 'dark' ? 'Tema Chiaro' : 'Tema Scuro'}
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                  </Group>
                </Group>

              {/* Example input field placed near the header */}
              {/* Allow inputs/description/lists to use the Container width so they match the header/profile image */}
              <div style={{ width: '100%' }}>
                  {/* Two input fields side-by-side, each half width */}
                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        id="attivita-titolo" 
                        label="Titolo" 
                        placeholder={attivita?.titolo || '--'} 
                        value="" 
                        editable={false}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        id="attivita-cer" 
                        label="Codice CER" 
                        placeholder={attivita?.codiceCer || 'XX XX XX'} 
                        value="" 
                        editable={false}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        id="attivita-data" 
                        label="Data" 
                        placeholder={formatDateTime(attivita?.data).date || 'dd/MM/YYYY'} 
                        value="" 
                        editable={false}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        id="attivita-orario" 
                        label="Orario" 
                        placeholder={formatDateTime(attivita?.data).time || '--'} 
                        value="" 
                        editable={false}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        id="attivita-luogo" 
                        label="Luogo" 
                        placeholder={attivita?.luogo || '--'} 
                        value="" 
                        editable={false}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        id="attivita-stato" 
                        label="Stato" 
                        placeholder={attivita?.statoAttivita || '--'} 
                        value="" 
                        editable={false}
                      />
                    </div>
                  </div>

                  <AppLargeText style={{marginTop: '80px', fontSize: '18px', fontWeight: '600',}}>Descrizione</AppLargeText>
                  <div style={{ display: 'flex', width: '100%', marginTop: '10px' }}>
                    
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <AppInputField
                          id="attivita-descrizione"
                          label="Descrizione"
                          placeholder={attivita?.descrizione || 'Nessuna descrizione'}
                          hideFloatingLabel={true}
                          placeholderLeft={true}
                          value=""
                          editable={false}
                        />
                    </div>
                  </div>
                  {/* Two-column section with vertical divider: Mezzo associato | Operatori associati */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '32px' : '12px', 
                    marginTop: '40px', 
                    width: '100%', 
                    alignItems: 'flex-start', 
                    justifyContent: 'flex-start',
                    overflow: 'hidden' // Previene overflow orizzontale
                  }}>
                    {/* Colonna Mezzo associato - responsive */}
                    <div style={{ 
                      flex: isMobile ? 'none' : '1', 
                      width: isMobile ? '100%' : 'auto',
                      minWidth: isMobile ? 'auto' : '350px',
                      boxSizing: 'border-box',
                      overflow: 'hidden' // Previene overflow delle carte
                    }}>
                      <AppLargeText style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Mezzo associato</AppLargeText>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
                        {attivita?.mezzo_rimorchio ? (
                          <MezzoCard 
                            id={attivita.mezzo_rimorchio.mezzo.id} 
                            previewSrc={attivita.mezzo_rimorchio.mezzo.immagine || "/images/login-bg.png"} 
                            stato={attivita.mezzo_rimorchio.mezzo.statoMezzo}
                            targa={attivita.mezzo_rimorchio.mezzo.targa}
                            rimorchio={`${attivita.mezzo_rimorchio.rimorchio.nome} (${attivita.mezzo_rimorchio.rimorchio.tipoRimorchio})`}
                            onView={() => router.push(`/mezzi/${attivita.mezzo_rimorchio.mezzo.id}`)} 
                          />
                        ) : (
                          <div style={{ 
                            padding: '20px', 
                            textAlign: 'center', 
                            color: '#999',
                            fontStyle: 'italic'
                          }}>
                            Nessun mezzo associato
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vertical divider - visibile solo quando il layout è orizzontale */}
                    {!isMobile && (
                      <div style={{ 
                        width: '1px', 
                        background: 'rgba(255,255,255,0.06)', 
                        alignSelf: 'stretch',
                        flexShrink: 0 // Non deve ridursi
                      }} />
                    )}

                    {/* Colonna Operatori associati - responsive */}
                    <div style={{ 
                      flex: isMobile ? 'none' : '1', 
                      width: isMobile ? '100%' : 'auto',
                      minWidth: isMobile ? 'auto' : '350px',
                      boxSizing: 'border-box',
                      overflow: 'hidden' // Previene overflow delle carte
                    }}>
                      <AppLargeText style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Operatori associati</AppLargeText>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
                        {attivita?.operatori_assegnati && attivita.operatori_assegnati.length > 0 ? (
                          attivita.operatori_assegnati.map((operatore) => (
                            <UtenteCard 
                              key={operatore.id}
                              id={operatore.id} 
                              nome={`${operatore.nome || ''} ${operatore.cognome || ''}`.trim() || operatore.email} 
                              email={operatore.email}
                              onView={() => router.push(`/utenti/${operatore.id}`)} 
                            />
                          ))
                        ) : (
                          <div style={{ 
                            padding: '20px', 
                            textAlign: 'center', 
                            color: '#999',
                            fontStyle: 'italic'
                          }}>
                            Nessun operatore assegnato
                          </div>
                        )}
                      </div>
                    </div>
          </div>
        </div>
  </Box>
  </Container>
    </>
  );
}
