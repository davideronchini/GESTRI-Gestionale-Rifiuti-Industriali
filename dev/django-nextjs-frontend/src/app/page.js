"use client"

import { useAuth } from "@/providers/authProvider";
import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { Container, Title, Text, Box, Group, Avatar, Menu, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconSettings, IconSun, IconMoon, IconBell, IconChevronLeft, IconChevronRight, IconCheck, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import AppLargeText from '@/components/ui/AppLargeText';
import AppNormalText from "@/components/ui/AppNormalText";
import AppPaper from '@/components/ui/AppPaper';
import CalendarDate from '@/components/ui/CalendarDate';
import AttivitaCard from '@/components/ui/AttivitaCard';
import DocumentoCard from '@/components/ui/DocumentoCard';
import MezzoCard from '@/components/ui/MezzoCard';
import { DJANGO_MEDIA_URL } from '@/config/config';

const ATTIVITA_API_URL = '/api/attivita/';
const MEZZO_API_URL = '/api/mezzi/';
const DOCUMENTO_API_URL = '/api/documenti/';

const fetcher = async url =>{
  const res = await fetch(url)

  if (!res.ok){
    const error = new Error('An error occurred while fetching the data.');
    // Try to parse error response, but handle cases where it might not be JSON
    try {
      error.info = await res.json();
    } catch {
      error.info = { message: 'Unknown error occurred' };
    }
    error.status = res.status;
    throw error;
  }

  const responseData = await res.json();
  // The Next.js API route wraps the data in a { data } object
  return responseData.data || responseData;
}

export default function Home() {
  const auth = useAuth();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  // responsive stacking: use media query to detect when available width is small
  // choose breakpoint so each column has reasonable minimum space before stacking
  const isStacked = useMediaQuery('(max-width:1200px)');
  // Selected activity state (id) - hoisted to top-level to respect Hooks rules
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  
  // Stati per la gestione del calendario
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  
  // Timestamp utilizzabile per le API
  const [selectedTimestamp, setSelectedTimestamp] = useState(() => {
    const now = new Date();
    return Math.floor(now.getTime() / 1000);
  });

  // Funzioni utility per il calendario
  const getMonthName = (month) => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return months[month];
  };

  const getDayName = (day) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return days[day];
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const today = new Date();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = getDayName(date.getDay());
      days.push({
        day: i,
        dayOfWeek,
        date,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    return days;
  };

  const handleDateClick = () => {
    setTempMonth(selectedDate.getMonth());
    setTempYear(selectedDate.getFullYear());
    setShowDatePicker(!showDatePicker);
  };

  const handleMonthChange = (increment) => {
    const newMonth = tempMonth + increment;
    if (newMonth < 0) {
      setTempMonth(11);
      setTempYear(tempYear - 1);
    } else if (newMonth > 11) {
      setTempMonth(0);
      setTempYear(tempYear + 1);
    } else {
      setTempMonth(newMonth);
    }
  };

  const handleYearChange = (increment) => {
    setTempYear(tempYear + increment);
  };

  const confirmDateSelection = () => {
    const newDate = new Date(tempYear, tempMonth, 1);
    setSelectedDate(newDate);
    setSelectedDayIndex(0);
    setShowDatePicker(false);
    
    // Aggiorna il timestamp per il primo giorno del mese selezionato
    const timestamp = Math.floor(newDate.getTime() / 1000);
    setSelectedTimestamp(timestamp);
  };

  const handleDaySelect = (index) => {
    setSelectedDayIndex(index);
    
    // Calcola il timestamp per il giorno selezionato
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = index + 1;
    const selectedDayDate = new Date(year, month, day);
    const timestamp = Math.floor(selectedDayDate.getTime() / 1000);
    
    setSelectedTimestamp(timestamp);
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleThemeToggle = () => {
    toggleColorScheme();
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      router.push('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  // Gestisci errori 401 per tutte le API con un ref per evitare loop
  const hasHandled401 = useRef(false);
  
  // SWR condizionato: esegue solo se l'auth è inizializzato e l'utente è autenticato
  const shouldFetch = !auth.isLoading && auth.isAuthenticated;
  // Rimosso SWR per ATTIVITA_API_URL che non serve

  // Funzione per convertire timestamp in formato YYYY-MM-DD
  const formatDateForAPI = (timestamp) => {
    const date = new Date(timestamp * 1000);
    // Usa metodi locali invece di toISOString() per evitare problemi di fuso orario
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // SWR per le attività basate sulla data selezionata
  const formattedDate = formatDateForAPI(selectedTimestamp);
  const attivitaAPIUrl = shouldFetch ? `${ATTIVITA_API_URL}/by-date/${formattedDate}` : null;
  
  const { 
    data: attivitaData, 
    error: attivitaError, 
    isLoading: attivitaLoading 
  } = useSWR(
    attivitaAPIUrl, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      // Forza refresh quando cambia l'URL
      dedupingInterval: 0,
      focusThrottleInterval: 0
    }
  );

  // SWR per i mezzi in manutenzione
  const mezziManutenzioneAPIUrl = shouldFetch ? `${MEZZO_API_URL}by-stato/MANUTENZIONE` : null;
  
  const { 
    data: mezziManutenzioneData, 
    error: mezziManutenzioneError, 
    isLoading: mezziManutenzioneLoading 
  } = useSWR(
    mezziManutenzioneAPIUrl, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      dedupingInterval: 0,
      focusThrottleInterval: 0
    }
  );

  // SWR per i documenti dell'attività selezionata
  const documentiAPIUrl = shouldFetch && selectedActivityId ? `${ATTIVITA_API_URL}${selectedActivityId}/documento` : null;
  
  const { 
    data: documentiData, 
    error: documentiError, 
    isLoading: documentiLoading 
  } = useSWR(
    documentiAPIUrl, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      dedupingInterval: 0,
      focusThrottleInterval: 0
    }
  );

  // Normalize document data: backend may return a single object or an array
  const normalizedDocumento = (() => {
    if (!documentiData) return null;
    if (Array.isArray(documentiData)) return documentiData.length > 0 ? documentiData[0] : null;
    // assume it's a single object
    return documentiData;
  })();

  useEffect(()=>{
    console.log('Home page useEffect - isLoading:', auth.isLoading, 'isAuthenticated:', auth.isAuthenticated);
    
    // Evita redirect se l'auth non è ancora inizializzato
    if (auth.isLoading) return;
    
    // Se l'utente non è autenticato, reindirizza al login
    if (!auth.isAuthenticated && auth.loginRequiredRedirect) {
      console.log('User not authenticated, calling loginRequiredRedirect');
      auth.loginRequiredRedirect();
      return;
    }
  }, [auth.isLoading, auth.isAuthenticated])

  // Gestisci errori 401 per tutte le API - usa un approccio più semplice
  const lastAuthState = useRef({ isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading });
  
  useEffect(() => {
    // Controlla 401 su tutte le API solo se c'è stato un cambiamento nello stato auth
    const hasAttivita401Error = attivitaError?.status === 401;
    const hasMezzi401Error = mezziManutenzioneError?.status === 401;
    const hasDocumenti401Error = documentiError?.status === 401;
    const hasAny401Error = hasAttivita401Error || hasMezzi401Error || hasDocumenti401Error;
    
    // Controlla se lo stato auth è cambiato
    const authStateChanged = 
      lastAuthState.current.isAuthenticated !== auth.isAuthenticated ||
      lastAuthState.current.isLoading !== auth.isLoading;
    
    if (hasAny401Error && !auth.isLoading && auth.isAuthenticated) {
      console.log('401 error detected from APIs, calling loginRequiredRedirect');
      auth.loginRequiredRedirect();
    }
    
    // Aggiorna lo stato precedente
    lastAuthState.current = { isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading };
    
  }, [attivitaError?.status, mezziManutenzioneError?.status, documentiError?.status, auth.isLoading, auth.isAuthenticated, auth.loginRequiredRedirect])

  // Effect per monitorare il timestamp per le API
  useEffect(() => {
    console.log('📅 Timestamp aggiornato per API:', selectedTimestamp);
  }, [selectedTimestamp]);

  // Funzione per trasformare i dati API in formato compatibile con AttivitaCard
  const transformAttivitaData = (rawData) => {
    
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }
    
    const filtered = rawData.filter((attivita) => {
      const isValid = attivita && attivita.id && attivita.titolo && attivita.titolo.trim() !== '';
      return isValid;
    });
    
    console.log('🔄 Attività filtrate:', filtered.length, 'su', rawData.length);
    
    const transformed = filtered.map((attivita) => {
      // Estrai l'orario dalla data ISO
      const date = new Date(attivita.data);
      const orario = date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Calcola la durata o usa un valore di default se null
      const durata = attivita.durata ? `${attivita.durata} min.` : '--';

      // Per ora usiamo operatori di placeholder fino a quando non avremo i dati degli operatori
      const operatori = 'Operatori da assegnare';

      return {
        id: attivita.id,
        orario,
        durata,
        titolo: attivita.titolo,
        operatori,
        // Aggiungi altri campi se necessari
        statoAttivita: attivita.statoAttivita,
        luogo: attivita.luogo,
        descrizione: attivita.descrizione
      };
    });
    
    console.log('🔄 Attività trasformate:', transformed);
    return transformed;
  };

  // Trasforma i dati delle attività
  const transformedAttivita = transformAttivitaData(attivitaData);

  // Se la lista delle attività cambia e l'attività selezionata non è più presente,
  // resettare la selezione per evitare che il documento precedente rimanga visibile.
  useEffect(() => {
    if (!transformedAttivita || transformedAttivita.length === 0) {
      // nessuna attività per la data selezionata
      setSelectedActivityId(null);
      return;
    }

    // Se c'è una selezione ma non esiste più nella lista aggiornata, deseleziona
    if (selectedActivityId && !transformedAttivita.find(a => a.id === selectedActivityId)) {
      setSelectedActivityId(null);
    }
  }, [transformedAttivita, selectedActivityId]);

  // Mostra loading mentre l'auth si inizializza
  if (auth.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se non autenticato, non mostrare nulla (il redirect è in corso)
  if (!auth.isAuthenticated) {
    return null;
  }

  if (attivitaError && attivitaError.status !== 401) {
    // Gestisci errori non 401 (500, 404, rete, ecc.)
    const errorMessage = attivitaError.status === 500 ? 'Errore del server' :
                        attivitaError.status === 404 ? 'Risorsa non trovata' :
                        attivitaError.status === 0 ? 'Errore di connessione' :
                        'Errore nel caricamento dei dati';
    
    return (
      <Container size="lg">
        <Box style={{marginTop: '24px', textAlign: 'center'}}>
          <AppNormalText style={{color: theme.colors.red[6]}}>
            {errorMessage}
          </AppNormalText>
          <AppNormalText style={{marginTop: '10px', color: theme.colors.gray[6]}}>
            Riprova più tardi o contatta il supporto se il problema persiste.
          </AppNormalText>
        </Box>
      </Container>
    );
  }

  if (mezziManutenzioneError && mezziManutenzioneError.status !== 401) {
    // Gestisci errori non 401 per i mezzi (500, 404, rete, ecc.)
    const errorMessage = mezziManutenzioneError.status === 500 ? 'Errore del server' :
                        mezziManutenzioneError.status === 404 ? 'Risorsa non trovata' :
                        mezziManutenzioneError.status === 0 ? 'Errore di connessione' :
                        'Errore nel caricamento dei mezzi';
    
    return (
      <Container size="lg">
        <Box style={{marginTop: '24px', textAlign: 'center'}}>
          <AppNormalText style={{color: theme.colors.red[6]}}>
            {errorMessage}
          </AppNormalText>
          <AppNormalText style={{marginTop: '10px', color: theme.colors.gray[6]}}>
            Riprova più tardi o contatta il supporto se il problema persiste.
          </AppNormalText>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="lg">
      {/* Header con titolo e profilo */}
      <Box style={{marginTop: '24px'}}>
        <Group justify="space-between" align="center">
          <Group justify="start" align="baseline">
            <AppLargeText order={1}>
              Home
            </AppLargeText>
            <AppNormalText 
              order={1} 
              style={{
                marginLeft:'20px', 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease'
              }}
              onClick={handleDateClick}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              {getMonthName(selectedDate.getMonth())}, {selectedDate.getFullYear()}
            </AppNormalText>
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
                    {auth.email ? auth.email.charAt(0).toUpperCase() : 'U'}
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
        </Box>

      {/* Date Picker Popup */}
      {showDatePicker && (
        <Box style={{
          position: 'relative',
          zIndex: 10
        }}>
          <Box style={{
            position: 'absolute',
            top: '10px',
            left: '20px',
            backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            minWidth: '280px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
            {/* Header del picker */}
            <Group justify="space-between" align="center" mb="md">
              <AppNormalText style={{ fontWeight: '600' }}>
                Seleziona Data
              </AppNormalText>
              <IconX 
                size={20} 
                style={{ 
                  cursor: 'pointer',
                  color: colorScheme === 'dark' ? theme.other.components.appIcon.dark.color : theme.other.components.appIcon.light.color
                }}
                onClick={() => setShowDatePicker(false)}
              />
            </Group>

            {/* Selettore Mese */}
            <Group justify="space-between" align="center" mb="md">
              <IconChevronLeft 
                size={20} 
                style={{ 
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={() => handleMonthChange(-1)}
              />
              <AppNormalText style={{ 
                fontWeight: '500', 
                minWidth: '80px', 
                textAlign: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}>
                {getMonthName(tempMonth)}
              </AppNormalText>
              <IconChevronRight 
                size={20} 
                style={{ 
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={() => handleMonthChange(1)}
              />
            </Group>

            {/* Selettore Anno */}
            <Group justify="space-between" align="center" mb="md">
              <IconChevronLeft 
                size={20} 
                style={{ 
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={() => handleYearChange(-1)}
              />
              <AppNormalText style={{ 
                fontWeight: '500', 
                minWidth: '80px', 
                textAlign: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}>
                {tempYear}
              </AppNormalText>
              <IconChevronRight 
                size={20} 
                style={{ 
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={() => handleYearChange(1)}
              />
            </Group>

            {/* Pulsante Conferma */}
            <Group justify="center" mt="md">
              <Box
                style={{
                  backgroundColor: theme.other.components.appSubmitButton.light.bg,
                  color: theme.other.components.appSubmitButton.light.color,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={confirmDateSelection}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.other.components.appSubmitButton.light.hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = theme.other.components.appSubmitButton.light.bg;
                }}
              >
                <IconCheck size={16} />
                Conferma
              </Box>
            </Group>
          </Box>
        </Box>
      )}

      {/* Lista orizzontale scorrevole dei giorni */}
      <Box style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Box
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '7px',
            padding: '7px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {generateCalendarDays().map((dayInfo, index) => (
            <CalendarDate
              key={`${dayInfo.day}-${selectedDate.getMonth()}`}
              day={dayInfo.day}
              dayOfWeek={dayInfo.dayOfWeek}
              isSelected={index === selectedDayIndex}
              onClick={() => handleDaySelect(index)}
              style={{
                flexShrink: 0,
                minWidth: '50px',
                marginTop: '8px'
              }}
            />
          ))}
        </Box>
      </Box>

  {/* Row: activities list + documento preview (becomes stacked on small screens) */}
  <Box style={{ display: 'flex', gap: '24px', marginTop: '35px', flexWrap: isStacked ? 'wrap' : 'nowrap', alignItems: 'stretch', marginBottom: isStacked ? '75px' : '40px' }}>
  {/* Left column: Activities */}
  <Box style={{ flex: isStacked ? '1 1 100%' : '1 1 60%', minWidth: isStacked ? '100%' : '300px', overflow: 'hidden' }}>
          <AppLargeText style={{fontSize: '18px' }}>
            Attività
          </AppLargeText>
          <Box style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '8px', marginTop: '20px'}}>
            {attivitaLoading ? (
              <AppNormalText style={{ padding: '20px', textAlign: 'center' }}>
                Caricamento attività...
              </AppNormalText>
            ) : attivitaError ? (
              <AppNormalText style={{ padding: '20px', textAlign: 'center', color: theme.colors.red[6] }}>
                Errore nel caricamento delle attività
              </AppNormalText>
            ) : transformedAttivita.length === 0 ? (
              <AppNormalText style={{ padding: '20px', textAlign: 'left', color: theme.colors.gray[6] }}>
                Nessuna attività programmata per questa data
              </AppNormalText>
            ) : (
              transformedAttivita.map((a) => (
                <AttivitaCard
                  key={a.id}
                  id={a.id}
                  orario={a.orario}
                  durata={a.durata}
                  titolo={a.titolo}
                  operatori={a.operatori}
                  isSelected={a.id === selectedActivityId}
                  onClick={() => setSelectedActivityId(prev => prev === a.id ? null : a.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                />
              ))
            )}
          </Box>
        </Box>

        {/* Vertical divider - hide when stacked */}
        {!isStacked && (
          <Box style={{ width: '1px', marginLeft: '-15px', backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '1px'}} />
        )}

    {/* Right column: Documento */}
  <Box style={{ flex: isStacked ? '1 1 100%' : '1 1 40%', minWidth: isStacked ? '100%' : '240px', height: '240px'}}>
          <AppLargeText style={{ marginBottom: '12px', fontSize: '18px' }}>
            Documento
          </AppLargeText>
          {selectedActivityId ? (
            documentiLoading ? (
              <AppPaper style={{ marginTop: '20px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', background: "#1C1E1E" }}>
                <AppNormalText style={{ fontSize: 14, color: theme.colors.gray[6] }}>
                  Caricamento documento...
                </AppNormalText>
              </AppPaper>
            ) : documentiError && documentiError.status !== 401 ? (
              <AppPaper style={{ marginTop: '20px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', background: "#1C1E1E" }}>
                <AppNormalText style={{ fontSize: 14, color: theme.colors.gray[6] }}>
                  Nessun documento associato
                </AppNormalText>
              </AppPaper>
            ) : !(normalizedDocumento && typeof normalizedDocumento === 'object') ? (
              <AppPaper style={{ marginTop: '20px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', background: "#1C1E1E" }}>
                <AppNormalText style={{ fontSize: 14, color: theme.colors.red[6] }}>
                  Errore nel caricamento del documento
                </AppNormalText>
              </AppPaper>
            ) : (
              <DocumentoCard
                previewSrc={normalizedDocumento?.file ? `${DJANGO_MEDIA_URL}${normalizedDocumento.file}` : "/images/FIR-preview.png"}
                title={normalizedDocumento?.tipoDocumento || "Documento"}
                subtitle={normalizedDocumento?.operatore_nome || "Operatore non specificato"}
                documentId={normalizedDocumento?.id}
                onOpen={() => { if (normalizedDocumento.id) router.push(`/documenti/${normalizedDocumento.id}`); }}
                style={{ marginTop: '20px' }}
              />
            )
          ) : (
            <AppPaper style={{ marginTop: '20px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', background: "#1C1E1E" }}>
              <AppNormalText style={{ fontSize: 14, color: theme.colors.gray[6] }}>
                Nessuna attività selezionata
              </AppNormalText>
            </AppPaper>
          )}
        </Box>
      </Box>

    <AppLargeText style={{fontSize: '18px' }}>
      Mezzi in manutenzione
    </AppLargeText>

    {/* Lista orizzontale mezzi */}
    <Box style={{ marginTop: '12px', marginBottom: '30px' }}>
      <Box style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '8px 0' }}>
        {mezziManutenzioneLoading ? (
          <AppNormalText style={{ padding: '20px', textAlign: 'center' }}>
            Caricamento mezzi...
          </AppNormalText>
        ) : mezziManutenzioneError ? (
          <AppNormalText style={{ padding: '20px', textAlign: 'center', color: theme.colors.red[6] }}>
            Errore nel caricamento dei mezzi
          </AppNormalText>
        ) : !mezziManutenzioneData || mezziManutenzioneData.length === 0 ? (
          <AppNormalText style={{ padding: '20px', textAlign: 'left', color: theme.colors.gray[6] }}>
            Nessun mezzo in manutenzione
          </AppNormalText>
        ) : (
          mezziManutenzioneData.map((m) => (
            <Box key={m.id} style={{ minWidth: '320px', flex: '0 0 auto' }}>
              <MezzoCard
                id={m.id}
                stato={m.statoMezzo}
                previewSrc={m.immagine ? `${DJANGO_MEDIA_URL}${m.immagine}` : "/images/login-bg.png"}
                onView={() => { if (m.id) router.push(`/mezzi/${m.id}`); }}
              />
            </Box>
          ))
        )}
      </Box>
    </Box>

    </Container>
  );
}
