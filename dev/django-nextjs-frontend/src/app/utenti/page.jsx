"use client"

import { useAuth } from "@/providers/authProvider";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useEffect, useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import AppTable from '@/components/ui/AppTable';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconTrash, IconUser, IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";

const fetcher = async url =>{
  const res = await fetch(url)

  if (!res.ok){
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  const responseData = await res.json();
  return responseData.data || responseData;
}

const UTENTI_API_URL = '/api/utenti/'

// Funzione per determinare il colore dello stato utente
const getUtenteStatusColor = (stato) => {
  const statoUpper = String(stato).toUpperCase();
  
  if (statoUpper === 'ASSENTE' || statoUpper === 'OCCUPATO') {
    return '#E29D14'; // arancione/giallo
  } else if (statoUpper === 'DISPONIBILE') {
    return '#17BC6A'; // verde
  }
  
  return '#ADB5BD'; // grigio di default
};

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

  // Funzione per eliminare un utente
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDeleteUtente = async (row) => {
    if (!row || !row.id) return;
    const id = row.id;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/utenti/${id}`, { method: 'DELETE' });

      if (response.ok) {
        showNotification({ title: 'Eliminazione', message: 'Utente eliminato con successo', color: 'green' });
        try { mutate(UTENTI_API_URL); } catch (e) { /* ignore */ }
      } else {
        let errMsg = 'Errore durante l\'eliminazione dell\'utente';
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
      showNotification({ title: 'Errore', message: 'Errore durante l\'eliminazione dell\'utente', color: 'red' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Funzione per aggiungere un nuovo utente
  const handleAddUtente = () => {
    router.push('/utenti/crea');
  };

  // Funzione per filtrare gli utenti
  const handleFilterUtente = () => {
    console.log('Filtra utenti');
    // TODO: Implementare la logica per filtrare utenti
  };

  // Only fetch when user is authenticated. Prevents repeated 401s during auth transitions.
  const { data, error, isLoading } = useSWR(
    auth.isAuthenticated ? UTENTI_API_URL : null,
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
  const [activeFilters, setActiveFilters] = useState([]);

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

  // Effetto separato per gestire i filtri e i dati
  useEffect(() => {
    if (!activeFilters || activeFilters.length === 0) {
      if (data && Array.isArray(data)) {
        setTableData(data);
      }
    }
  }, [activeFilters, data]);

  // Stato per tracciare il termine di ricerca corrente
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  // Memoizza la funzione onFilterChange
  const handleFilterChange = useCallback((selectedFilters) => {
    const filters = selectedFilters || [];
    
    console.log('Filter changed, updating activeFilters to:', filters);
    
    setActiveFilters(filters);
    
    const termToUse = (currentSearchTerm && currentSearchTerm !== 'Cerca...') ? currentSearchTerm : '';
    
    console.log('Filter changed, re-triggering search with filters:', filters, 'and term:', termToUse);
    
    performSearch(termToUse, filters);
  }, [currentSearchTerm]);

  // Funzione che esegue la ricerca
  const performSearch = async (term, filters) => {
    if (!auth.isAuthenticated) {
      console.log('performSearch skipped: user not authenticated');
      return;
    }
    try {
      const searchTerm = (!term || term === 'Cerca...' || term.trim() === '') ? '' : term.trim();
      console.log('performSearch - term:', term, 'normalized searchTerm:', searchTerm, 'filters:', filters);
      let res;
      
      const hasActiveFilters = filters && Array.isArray(filters) && filters.length > 0;
      
      if (hasActiveFilters) {
        const termForUrl = searchTerm || ' ';
        const endpoint = `/api/utenti/filter-by/${encodeURIComponent(termForUrl)}`;
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
        const termForUrl = searchTerm || ' ';
        const endpoint = `/api/utenti/cerca/${encodeURIComponent(termForUrl)}`;
        console.log('Calling SEARCH endpoint (no filters active), term:', searchTerm);
        res = await fetch(endpoint);
      }
      console.log('Search response status:', res.status, 'ok:', res.ok);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('401 error in search, will be handled by useAuthGuard');
          return;
        }
        
        let errorMessage = 'Errore nella ricerca';
        try {
          const errorJson = await res.json();
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
    const normalizedTerm = term || '';
    console.log('callCerca called with term:', term, 'normalized:', normalizedTerm, 'activeFilters:', activeFilters);
    setCurrentSearchTerm(normalizedTerm);
    await performSearch(normalizedTerm, activeFilters);
  };

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
    <RequireRole allowedRoles={['STAFF']} fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
      <Container size="lg">
        {/* Header con titolo e profilo */}
        <Box style={{marginTop: '24px'}}>
          <Group justify="space-between" align="center">
            <Group justify="start" align="baseline">
              <AppLargeText order={1}>
                Utenti
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

        {/* Tabella utenti */}
        <Box style={{ marginTop: 25 }}>
          <AppTable
            title="Tutti gli utenti"
            onHoverLineClick={(row) => router.push(`/utenti/${row?.id}`)}
            onAddClick={handleAddUtente}
            onFilterClick={handleFilterUtente}
            onFilterChange={handleFilterChange}
            onSearch={(searchTerm) => {
              console.log('Search triggered with term:', searchTerm, 'active filters:', activeFilters);
              callCerca(searchTerm);
            }}
            getStatusColor={getUtenteStatusColor}
            columns={[
              { key: 'id', title: 'ID' },
              { key: 'nome', title: 'Nome' },
              { key: 'cognome', title: 'Cognome' },
              { key: 'ruolo', title: 'Ruolo' },
              { key: 'stato', title: 'Stato' },
              { key: 'email', title: 'Email' },
              { key: 'icona', title: '' },
            ]}
            data={
              tableData && Array.isArray(tableData) ? tableData.map(u => ({
                id: u.id ?? '-',
                nome: u.nome ?? '-',
                cognome: u.cognome ?? '-',
                ruolo: u.ruolo ?? '-',
                stato: u.stato ?? 'DISPONIBILE',
                email: u.email ?? '-',
                icona: IconTrash,
              })) : []
            }
            iconActions={[
              {
                label: 'Elimina utente',
                action: requestDeleteUtente,
                icon: IconTrash
              }
            ]}
            style={{background: 'rgba(36, 38, 39, 0.3)'}}
          />
        </Box>
      </Container>
    </RequireRole>
  );
}
