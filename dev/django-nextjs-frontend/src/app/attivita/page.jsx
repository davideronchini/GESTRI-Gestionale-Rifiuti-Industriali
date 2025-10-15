"use client"

import { useAuth } from "@/providers/authProvider";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useEffect, useState, useRef, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import AppTable from '@/components/ui/AppTable';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconTrash, IconUser, IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const fetcher = async url =>{
  const res = await fetch(url, { credentials: 'include' })

  if (!res.ok){
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  const responseData = await res.json();
  // Some backend endpoints return { data: ... } while others return raw values
  return responseData.data || responseData;
}

const ATTIVITA_API_URL = '/api/attivita/'
const ATTIVITA_BASE = ATTIVITA_API_URL.replace(/\/+$/, '')

export default function Page() {
  const auth = useAuth();
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleThemeToggle = () => {
    toggleColorScheme();
  };

  // Funzione per eliminare un'attività
  // Funzione per eliminare un'attività immediatamente (nessuna conferma)
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDeleteAttivita = async (row) => {
    if (!row || !row.id) return;
    const id = row.id;
    // optional: prompt via browser confirm if you ever want to keep a quick check
    // if (!confirm(`Eliminare attività ${id}?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/attivita/${id}`, { method: 'DELETE' });

      if (response.ok) {
        // show a small feedback using Mantine notifications
        showNotification({ title: 'Eliminazione', message: 'Attività eliminata con successo', color: 'green' });
        // invalidate SWR cache for attivita list (use the same key used by useSWR)
        try { mutate(ATTIVITA_BASE); } catch (e) { /* ignore */ }
      } else {
        let errMsg = 'Errore durante l\'eliminazione dell\'attività';
        try {
          const errBody = await response.json();
          if (errBody && errBody.error) errMsg = errBody.error;
        } catch (e) {
          // ignore
        }
        showNotification({ title: 'Errore', message: errMsg, color: 'red' });
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      showNotification({ title: 'Errore', message: 'Errore durante l\'eliminazione dell\'attività', color: 'red' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Funzione per aggiungere una nuova attività
  const handleAddAttivita = () => {
    router.push('/attivita/crea');
  };

  // Funzione per filtrare le attività
  const handleFilterAttivita = () => {
    console.log('Filtra attività');
    // TODO: Implementare la logica per filtrare attività
  };

  // Funzione per cercare nelle attività
  const handleSearchAttivita = (searchTerm) => {
    console.log('Cerca attività:', searchTerm);
    // TODO: Implementare la logica per cercare attività
  };

  // Only fetch when user is authenticated. Prevents repeated 401s during auth transitions.
  const { data, error, isLoading } = useSWR(
    auth.isAuthenticated ? ATTIVITA_BASE : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
    }
  );

  // Local state for table data so we can replace it with filtered results
  const [tableData, setTableData] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]); // array di col.key per filtri multipli

  // Usa il hook personalizzato per gestire l'autenticazione
  const authGuard = useAuthGuard({
    errors: [error]
  });

  // Keep local tableData in sync with the initial fetch
  useEffect(() => {
    if (data && Array.isArray(data)) {
      setTableData(data);
    }
  }, [data]);

  // If user becomes unauthenticated, clear the attivita SWR cache immediately to avoid showing
  // data belonging to the previous user until a full refresh occurs.
  useEffect(() => {
    if (!auth.isAuthenticated) {
      try { 
        // clear main key and any common variants
        mutate(ATTIVITA_BASE, null, { revalidate: false });
        mutate(`${ATTIVITA_BASE}/by-date/`, null, { revalidate: false });
      } catch (e) { /* ignore */ }
      setTableData([]);
    }
  }, [auth.isAuthenticated]);

  // Proactively revalidate when component mounts to ensure we have fresh data
  useEffect(() => {
    try {
      mutate(`${ATTIVITA_BASE}/by-date/`, null, { revalidate: true }).catch(() => {});
    } catch (e) { /* ignore */ }
  }, []);

  // Effetto separato per gestire i filtri e i dati
  useEffect(() => {
    // se non ci sono filtri attivi, mostra tutti i dati
    if (!activeFilters || activeFilters.length === 0) {
      if (data && Array.isArray(data)) {
        setTableData(data);
      }
    }
  }, [activeFilters, data]);

  // Stato per tracciare il termine di ricerca corrente
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  // Memoizza la funzione onFilterChange per evitare loop infiniti
  const handleFilterChange = useCallback((selectedFilters) => {
    // ricevi direttamente l'array dei filtri selezionati da AppTable
    const filters = selectedFilters || [];
    
    console.log('Filter changed, updating activeFilters to:', filters);
    
    // Aggiorna i filtri attivi PRIMA di chiamare la ricerca
    setActiveFilters(filters);
    
    // Quando i filtri cambiano, rilancia sempre la ricerca per applicare i nuovi filtri
    // Se c'è un termine di ricerca, lo mantiene; altrimenti usa termine vuoto
    const termToUse = (currentSearchTerm && currentSearchTerm !== 'Cerca...') ? currentSearchTerm : '';
    
    console.log('Filter changed, re-triggering search with filters:', filters, 'and term:', termToUse);
    
    // Chiamiamo la ricerca direttamente con i nuovi filtri
    performSearch(termToUse, filters);
  }, [currentSearchTerm]); // dipende solo dal termine di ricerca corrente

  // Funzione che esegue la ricerca con i parametri specificati
  const performSearch = async (term, filters) => {
    if (!auth.isAuthenticated) {
      console.log('performSearch skipped: user not authenticated');
      return;
    }
    try {
      // Normalizza il termine di ricerca: stringa vuota se non valido o placeholder
      const searchTerm = (!term || term === 'Cerca...' || term.trim() === '') ? '' : term.trim();
      console.log('performSearch - term:', term, 'normalized searchTerm:', searchTerm, 'filters:', filters);
      let res;
      
      // Determina se ci sono filtri attivi
      const hasActiveFilters = filters && Array.isArray(filters) && filters.length > 0;
      
      if (hasActiveFilters) {
        // Se ci sono filtri attivi, usa l'endpoint dei filtri multipli
        const termForUrl = searchTerm || ' ';
        const endpoint = `/api/attivita/filter-by/${encodeURIComponent(termForUrl)}`;
        console.log('Calling FILTER endpoint with filters:', filters, 'and term:', searchTerm);
        
        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: filters
          })
        });
      } else {
        // Se non ci sono filtri attivi o tutti sono deselezionati, usa l'endpoint di ricerca semplice
        const termForUrl = searchTerm || ' ';
        const endpoint = `/api/attivita/cerca/${encodeURIComponent(termForUrl)}`;
        console.log('Calling SEARCH endpoint (no filters active), term:', searchTerm);
        res = await fetch(endpoint);
      }
      console.log('Search response status:', res.status, 'ok:', res.ok);
      console.log('Search response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        // Se è un errore 401, sarà gestito automaticamente dal useAuthGuard
        if (res.status === 401) {
          console.log('401 error in search, will be handled by useAuthGuard');
          return;
        }
        
        let errorMessage = 'Errore nella ricerca';
        try {
          const errorJson = await res.json();
          //console.error('Search error response:', errorJson);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        showNotification({ 
          title: 'Errore', 
          message: `${errorMessage} (Status: ${res.status})`, 
          color: 'red' 
        });
        return;
      }
      
      const json = await res.json();
      console.log('Search response data:', json);
      setTableData(json.data || json);
    } catch (e) {
      console.error('Errore cerca:', e);
      showNotification({ 
        title: 'Errore', 
        message: `Errore di connessione nella ricerca: ${e.message}`, 
        color: 'red' 
      });
    }
  };

  // Funzione wrapper che aggiorna il termine corrente e chiama performSearch
  const callCerca = async (term) => {
    const normalizedTerm = term || ''; // assicurati che sia sempre una stringa
    console.log('callCerca called with term:', term, 'normalized:', normalizedTerm, 'activeFilters:', activeFilters);
    setCurrentSearchTerm(normalizedTerm); // traccia il termine di ricerca corrente
    await performSearch(normalizedTerm, activeFilters);
  };

  // Rimossa callFilterBy - la logica è ora integrata in callCerca



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
    <>
      {/* Deletion now happens immediately when the user clicks the delete action; no confirmation modal. */}

      <Container size="lg">
      {/* Header con titolo e profilo */}
            <Box style={{marginTop: '24px'}}>
              <Group justify="space-between" align="center">
                <Group justify="start" align="baseline">
                  <AppLargeText order={1}>
                    Attività
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
                                      rightSection={<IconLock size={14} />}
                                      onClick={() => showNotification({ title: 'Funzione bloccata', message: 'Questa funzione non è disponibile', color: 'yellow' })}
                                      style={{ cursor: 'not-allowed', opacity: 0.6 }}
                                    >
                                      Impostazioni
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item 
                                      leftSection={<IconSun size={14} />}
                                      rightSection={<IconLock size={14} />}
                                      onClick={() => showNotification({ title: 'Funzione bloccata', message: 'Questa funzione non è disponibile', color: 'yellow' })}
                                      style={{ cursor: 'not-allowed', opacity: 0.6 }}
                                    >
                                      Tema Chiaro
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                  </Group>
                </Group>
              </Box>
      {/* Example table - replace with real data when available */}
      <Box style={{ marginTop: 25 }}>
        <AppTable
          title="Tutte le attività"
          onHoverLineClick={(row) =>  router.push(`/attivita/${row?.id}`)}
          onAddClick={handleAddAttivita}
          onFilterClick={handleFilterAttivita}
          onFilterChange={handleFilterChange}
          onSearch={(searchTerm) => {
            // Usa sempre callCerca che ha la logica per decidere quale endpoint chiamare
            console.log('Search triggered with term:', searchTerm, 'active filters:', activeFilters);
            callCerca(searchTerm);
          }}
          columns={[
            { key: 'id', title: 'ID' },
            { key: 'titolo', title: 'Titolo' },
            { key: 'luogo', title: 'Luogo' },
            { key: 'data', title: 'Data' },
            { key: 'stato', title: 'Stato' },
            { key: 'codiceCer', title: 'Codice CER' },
            { key: 'icona', title: '' },
          ]}
          data={
            tableData && Array.isArray(tableData) ? tableData.map(d => ({
              id: d.id ?? '-',
              titolo: d.titolo ?? d.tipo ?? 'Attività',
              tipo: d.titolo ?? d.tipo ?? 'Attività',
              luogo: d.luogo ?? '-',
              data: d.data ? new Date(d.data).toLocaleDateString('it-IT') : '-',
              stato: d.statoAttivita ?? '-',
              codiceCer: d.codiceCer ?? '-',
              icona: IconTrash,
            })) : [
              { id: '1', tipo: 'Ritiro Legname', luogo: 'Ortona', data: '25/09/2025', stato: 'PIANIFICATA', codiceCer: '01.01.01', icona: IconTrash },
              { id: '2', tipo: 'Ritiro Legname', luogo: 'Ortona', data: '25/09/2025', stato: 'TERMINATA', codiceCer: '01.01.01', icona: IconTrash },
              { id: '113', tipo: 'Ritiro Legname', luogo: 'Ortona', data: '25/09/2025', stato: 'INIZIATA', codiceCer: '01.01.01', icona: IconTrash },
            ]
          }
          iconActions={[
            {
              label: 'Elimina attività',
              action: requestDeleteAttivita,
              icon: IconTrash
            }
          ]}
          style={{background: 'rgba(36, 38, 39, 0.3)'}}
        />
      </Box>
    </Container>
    </>
  );
}
