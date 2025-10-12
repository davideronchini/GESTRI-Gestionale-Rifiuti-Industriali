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
  // Some backend endpoints return { data: ... } while others return raw values
  return responseData.data || responseData;
}

const DOCUMENTI_API_URL = '/api/documenti/'

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

  // Funzione per eliminare un documento
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDeleteDocumento = async (row) => {
    if (!row || !row.id) return;
    const id = row.id;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documenti/${id}`, { method: 'DELETE' });

      if (response.ok) {
        showNotification({ title: 'Eliminazione', message: 'Documento eliminato con successo', color: 'green' });
        try { mutate(DOCUMENTI_API_URL); } catch (e) { /* ignore */ }
      } else {
        let errMsg = 'Errore durante l\'eliminazione del documento';
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
      showNotification({ title: 'Errore', message: 'Errore durante l\'eliminazione del documento', color: 'red' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Funzione per aggiungere un nuovo documento
  const handleAddDocumento = () => {
    router.push('/documento/crea');
  };

  // Funzione per filtrare i documenti
  const handleFilterDocumento = () => {
    console.log('Filtra documenti');
    // TODO: Implementare la logica per filtrare documenti
  };

  // Avoid fetching data when the user is not authenticated to prevent 401s that
  // can trigger redirects while the auth state is being resolved.
  const { data, error, isLoading } = useSWR(
    auth.isAuthenticated ? DOCUMENTI_API_URL : null,
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
        const endpoint = `/api/documenti/filter-by/${encodeURIComponent(termForUrl)}`;
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
        const endpoint = `/api/documenti/cerca/${encodeURIComponent(termForUrl)}`;
        console.log('Calling SEARCH endpoint (no filters active), term:', searchTerm);
        res = await fetch(endpoint);
      }
      console.log('Search response status:', res.status, 'ok:', res.ok);
      
      if (!res.ok) {
        // Se è un errore 401, sarà gestito automaticamente dal useAuthGuard
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
    const normalizedTerm = term || ''; // assicurati che sia sempre una stringa
    console.log('callCerca called with term:', term, 'normalized:', normalizedTerm, 'activeFilters:', activeFilters);
    setCurrentSearchTerm(normalizedTerm); // traccia il termine di ricerca corrente
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
    <RequireRole
                allowedRoles={['STAFF']}
                fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
      <Container size="lg">
        {/* Header con titolo e profilo */}
        <Box style={{marginTop: '24px'}}>
          <Group justify="space-between" align="center">
            <Group justify="start" align="baseline">
              <AppLargeText order={1}>
                Documenti
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

        {/* Tabella documenti */}
        <Box style={{ marginTop: 25 }}>
          <AppTable
            title="Tutti i documenti"
            onHoverLineClick={(row) => router.push(`/documenti/${row?.id}`)}
            onAddClick={handleAddDocumento}
            onFilterClick={handleFilterDocumento}
            onFilterChange={handleFilterChange}
            onSearch={(searchTerm) => {
              console.log('Search triggered with term:', searchTerm, 'active filters:', activeFilters);
              callCerca(searchTerm);
            }}
            columns={[
              { key: 'id', title: 'ID' },
              { key: 'tipo', title: 'Tipo' },
              { key: 'operatore', title: 'Operatore' },
              { key: 'scadenza', title: 'Scadenza' },
              { key: 'icona', title: '' },
            ]}
            data={
              tableData && Array.isArray(tableData) ? tableData.map(d => ({
                id: d.id ?? '-',
                tipo: d.tipoDocumento ?? '-',
                operatore: d.operatore_nome ?? '--',
                scadenza: d.dataScadenza ? new Date(d.dataScadenza).toLocaleDateString('it-IT') : '-',
                icona: IconTrash,
              })) : []
            }
            iconActions={[
              {
                label: 'Elimina documento',
                action: requestDeleteDocumento,
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
