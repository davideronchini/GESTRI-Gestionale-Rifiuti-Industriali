"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState, useEffect, use } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme, Modal, TextInput, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppTable from '@/components/ui/AppTable';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconTrash, IconUser, IconArrowNarrowLeft, IconEdit, IconCheck, IconPlus, IconSearch, IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppInputField from '@/components/ui/AppInputField';
import MezzoCard from '@/components/ui/MezzoCard';
import UtenteCard from '@/components/ui/UtenteCard';
import RequireRole from "@/components/RequireRole";

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
  // Read the body as text first so we can provide better diagnostics even when
  // the server returns an empty body or non-JSON (e.g. an HTML login page).
  const rawText = await res.text();

  if (!res.ok) {
    let errorInfo;
    try {
      const contentType = res.headers.get('content-type') || '';
      // Try to parse JSON if content-type indicates JSON or the body looks like JSON
      if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          errorInfo = rawText ? JSON.parse(rawText) : {};
        } catch (parseErr) {
          console.error('Error parsing error JSON body:', parseErr, 'rawText:', rawText.substring(0, 400));
          errorInfo = { message: 'Invalid JSON error body from server', raw: rawText.substring(0, 400) };
        }
      } else {
        // Non-JSON response (often an HTML login page or redirect body)
        console.log('Non-JSON response body (truncated):', rawText.substring(0, 200));
        errorInfo = { message: 'Authentication required - please refresh the page', raw: rawText.substring(0, 400) };
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      errorInfo = { message: 'Failed to parse error response', raw: rawText.substring(0, 400), status: res.status };
    }

    // Defensive fallback: ensure errorInfo always has at least status and raw
    if (!errorInfo || Object.keys(errorInfo).length === 0) {
      errorInfo = { status: res.status, raw: rawText ? rawText.substring(0, 400) : null };
    } else if (!errorInfo.status) {
      errorInfo.status = res.status;
    }

    console.error('API Error Info:', errorInfo);

    // Se è un errore 401, forza il redirect al login
    if (res.status === 401) {
      const error = new Error('Authentication required');
      error.isAuthError = true;
      error.status = 401;
      throw error;
    }

    const error = new Error(`HTTP ${res.status}: ${errorInfo?.message || 'An error occurred while fetching the data.'}`);
    error.info = errorInfo;
    error.status = res.status;
    throw error;
  }

  // Success path: try to parse the previously-read text as JSON
  try {
    const responseData = rawText ? JSON.parse(rawText) : {};
    console.log('API Response:', responseData);
    return responseData;
  } catch (e) {
    console.error('Error parsing successful response as JSON:', e, 'rawText:', rawText.substring(0, 400));
    throw new Error('Invalid JSON response from server');
  }
}

export default function Page({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  // Responsive layout: le liste passano in verticale sotto i 1050px
  // Usiamo una media query esplicita per rispettare la richiesta
  const isMobile = useMediaQuery('(max-width: 1050px)', false, { getInitialValueInEffect: true });

  // Stato per la modalità editing
  const [isEditing, setIsEditing] = useState(false);
  
  // Stati per i campi editabili
  const [editedTitolo, setEditedTitolo] = useState('');
  const [editedCodiceCer, setEditedCodiceCer] = useState('');
  const [editedData, setEditedData] = useState('');
  const [editedOrario, setEditedOrario] = useState('');
  const [editedLuogo, setEditedLuogo] = useState('');
  const [editedStato, setEditedStato] = useState('');
  const [editedDurata, setEditedDurata] = useState('');
  const [editedDescrizione, setEditedDescrizione] = useState('');

  // Stati per la gestione del documento
  const [documentoInfo, setDocumentoInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Stati per il modale di associazione mezzo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mezziDisponibili, setMezziDisponibili] = useState([]);

  // Stati per il modale di associazione operatore
  const [isOperatoreModalOpen, setIsOperatoreModalOpen] = useState(false);
  const [operatoreSearchQuery, setOperatoreSearchQuery] = useState('');
  const [operatoriDisponibili, setOperatoriDisponibili] = useState([]);

  // Possibili stati dell'attività (dal modello Django)
  const STATI_VALIDI = [
    { value: 'PROGRAMMATA', label: 'Programmata' },
    { value: 'INIZIATA', label: 'Iniziata' },
    { value: 'TERMINATA', label: 'Terminata' }
  ];

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleThemeToggle = () => {
    toggleColorScheme();
  };

  // Funzione per mostrare gli stati possibili quando si clicca sul campo stato
  const handleStatoClick = () => {
    if (isEditing) {
      const statiMessage = STATI_VALIDI.map(stato => `${stato.value}`).join(', ');
      showNotification({
        title: 'Stati disponibili',
        message: `Gli stati possibili sono: ${statiMessage}`,
        color: 'blue',
        autoClose: 8000,
      });
    }
  };

  // Funzione per validare lo stato inserito
  const validateStato = (statoValue) => {
    if (!statoValue || statoValue.trim() === '') {
      return false;
    }
    
    const statoUpper = statoValue.trim().toUpperCase();
    return STATI_VALIDI.some(stato => stato.value === statoUpper);
  };

  // Funzione per gestire il cambio del campo stato (senza validazione)
  const handleStatoChange = (e) => {
    const newValue = e.target.value;
    setEditedStato(newValue);
  };

  // Funzione per validare lo stato quando l'utente finisce di modificare (onBlur)
  const handleStatoBlur = () => {
    const currentValue = editedStato;
    
    // Se il valore è vuoto, nessuna validazione necessaria
    if (!currentValue || currentValue.trim() === '') {
      return;
    }
    
    // Valida lo stato inserito
    if (validateStato(currentValue)) {
      // Se valido, normalizza al formato corretto
      setEditedStato(currentValue.trim().toUpperCase());
    } else {
      // Se non valido, mostra notifica e ripristina il valore precedente
      showNotification({
        title: 'Stato non valido',
        message: `Lo stato "${currentValue}" non è valido. Stati possibili: ${STATI_VALIDI.map(s => s.value).join(', ')}. Ripristinato il valore precedente.`,
        color: 'yellow',
        autoClose: 5000,
      });
      // Ripristina il valore precedente dall'attività
      setEditedStato(attivita?.statoAttivita || '');
    }
  };

  // Funzione per entrare in modalità editing
  const handleEdit = () => {
    if (attivita) {
      setEditedTitolo(attivita.titolo || '');
      setEditedCodiceCer(attivita.codiceCer || '');
      const { date, time } = formatDateTime(attivita.data);
      setEditedData(date);
      setEditedOrario(time);
      setEditedLuogo(attivita.luogo || '');
      setEditedStato(attivita.statoAttivita || '');
      setEditedDurata(attivita.durata ? attivita.durata.toString() : '');
      setEditedDescrizione(attivita.descrizione || '');
      
      // Carica informazioni del documento
      loadDocumentoInfo();
      
      setIsEditing(true);
    }
  };

  // Funzione per caricare le informazioni del documento
  const loadDocumentoInfo = async () => {
    try {
      const res = await fetch(`/api/attivita/${id}/documento`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const documento = await res.json();
        setDocumentoInfo(documento);
      } else {
        setDocumentoInfo(null);
      }
    } catch (error) {
      console.error('Errore nel caricamento documento:', error);
      setDocumentoInfo(null);
    }
  };

  // Funzione per gestire il click sul campo documento
  const handleDocumentoClick = () => {
    if (!isEditing && documentoInfo?.id) {
      // Modalità visualizzazione: vai alla pagina del documento
      window.open(`/documento/${documentoInfo.id}`, '_blank');
    } else if (isEditing) {
      // Modalità modifica: apri file picker
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setSelectedFile(file);
        }
      };
      fileInput.click();
    }
  };

  // Funzione per ottenere il placeholder del campo documento
  const getDocumentoPlaceholder = () => {
    if (!isEditing) {
      return documentoInfo ? 'Vai al documento' : 'Nessun documento';
    } else {
      return selectedFile ? selectedFile.name : 'Carica nuovo file';
    }
  };

  // Funzione per salvare le modifiche
  const handleSave = async () => {
    try {
      // Lo stato è già validato in tempo reale, quindi usiamo direttamente editedStato
      const statoToSave = editedStato;

      // Ricostruisci la data completa da data e orario
      let fullDateTime = null;
      if (editedData) {
        // Converti dd/MM/yyyy in yyyy-MM-dd
        // Se c'è la data, usa l'orario fornito o default a 00:00
        const [day, month, year] = editedData.split('/');
        const timeValue = editedOrario || '00:00';
        // Usa il formato ISO locale senza conversione UTC per evitare problemi di fuso orario
        fullDateTime = `${year}-${month}-${day}T${timeValue}:00`;
      }

      const updatePayload = {
        titolo: editedTitolo,
        codiceCer: editedCodiceCer,
        data: fullDateTime,
        luogo: editedLuogo,
        statoAttivita: statoToSave,
        durata: editedDurata ? parseInt(editedDurata, 10) : null,
        descrizione: editedDescrizione
      };

      const res = await fetch(`/api/attivita/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) {
        throw new Error('Errore durante il salvataggio');
      }

      // Gestisci l'upload del documento se è stato selezionato un file
      if (selectedFile) {
        await handleUploadDocumento();
        // Ricarica le informazioni del documento dopo l'upload
        await loadDocumentoInfo();
      }

      // Aggiorna i dati con mutate di SWR
      await mutate(`/api/attivita/${id}`);
      
      // Resetta gli stati di editing
      setIsEditing(false);
      setEditedTitolo('');
      setEditedCodiceCer('');
      setEditedData('');
      setEditedOrario('');
      setEditedLuogo('');
      setEditedStato('');
      setEditedDurata('');
      setEditedDescrizione('');
      setSelectedFile(null);
      // Non resettiamo documentoInfo qui perché vogliamo mantenerlo per la visualizzazione
      
      showNotification({
        title: 'Successo',
        message: 'Attività aggiornata con successo',
        color: 'green',
      });
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showNotification({
        title: 'Errore',
        message: 'Impossibile salvare le modifiche',
        color: 'red',
      });
    }
  };

  // Funzione per aprire il modale e caricare i mezzi disponibili
  const handleOpenMezzoModal = async () => {
    setIsModalOpen(true);
    setSearchQuery('');
    
    try {
      console.log('Caricamento mezzi disponibili per attività ID:', id);
      
      const res = await fetch(`/api/attivita/${id}/mezzi-rimorchi/disponibili`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const response = await res.json();
        const data = response.data || response; // Gestisce sia {data: [...]} che [...] direttamente
        console.log('Mezzi disponibili caricati:', data.length, 'elementi');
        setMezziDisponibili(data || []);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        console.error('Errore nel caricamento mezzi - Status:', res.status);
        console.error('Dettagli errore:', errorData);
        
        showNotification({
          title: 'Errore',
          message: errorData.error || `Impossibile caricare i mezzi disponibili (${res.status})`,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Errore di rete nel caricamento mezzi:', error);
      showNotification({
        title: 'Errore',
        message: 'Errore di connessione durante il caricamento dei mezzi',
        color: 'red',
      });
    }
  };

  // Funzione per associare un mezzo all'attività
  const handleAssociaMezzo = async (mezzoRimorchioId) => {
    try {
      const res = await fetch(`/api/attivita/${id}/associa-mezzo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mezzo_rimorchio_id: mezzoRimorchioId
        })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Aggiorna i dati dell'attività
        await mutate(`/api/attivita/${id}`);
        
        // Chiudi il modale
        setIsModalOpen(false);
        setSearchQuery('');
        
        showNotification({
          title: 'Successo',
          message: result.message || 'Mezzo associato con successo',
          color: 'green',
        });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(errorData.error || `Errore durante l'associazione (${res.status})`);
      }
    } catch (error) {
      console.error('Errore durante l\'associazione:', error);
      showNotification({
        title: 'Errore',
        message: error.message || 'Impossibile associare il mezzo',
        color: 'red',
      });
    }
  };

  // Funzione per dissociare un mezzo dall'attività
  const handleDissociaMezzo = async () => {
    try {
      const res = await fetch(`/api/attivita/${id}/associa-mezzo`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const result = await res.json();
        
        // Aggiorna i dati dell'attività
        await mutate(`/api/attivita/${id}`);
        
        showNotification({
          title: 'Successo',
          message: result.message || 'Mezzo dissociato con successo',
          color: 'green',
        });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(errorData.error || `Errore durante la dissociazione (${res.status})`);
      }
    } catch (error) {
      console.error('Errore durante la dissociazione:', error);
      showNotification({
        title: 'Errore',
        message: error.message || 'Impossibile dissociare il mezzo',
        color: 'red',
      });
    }
  };

  // Funzione per aprire il modale operatore e caricare gli operatori disponibili
  const handleOpenOperatoreModal = async () => {
    setIsOperatoreModalOpen(true);
    setOperatoreSearchQuery('');
    
    try {
      console.log('Caricamento operatori disponibili per attività ID:', id);
      
      const res = await fetch(`/api/attivita/${id}/operatori/disponibili`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const response = await res.json();
        const data = response.data || response;
        console.log('Operatori disponibili caricati:', data.length, 'elementi');
        setOperatoriDisponibili(data || []);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        console.error('Errore nel caricamento operatori - Status:', res.status);
        console.error('Dettagli errore:', errorData);
        
        showNotification({
          title: 'Errore',
          message: errorData.error || `Impossibile caricare gli operatori disponibili (${res.status})`,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Errore di rete nel caricamento operatori:', error);
      showNotification({
        title: 'Errore',
        message: 'Errore di connessione durante il caricamento degli operatori',
        color: 'red',
      });
    }
  };

  // Funzione per associare un operatore all'attività
  const handleAssociaOperatore = async (operatoreId) => {
    try {
      const res = await fetch(`/api/attivita/${id}/associa-operatore`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatore_id: operatoreId
        })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Aggiorna i dati dell'attività
        await mutate(`/api/attivita/${id}`);
        
        // Chiudi il modale
        setIsOperatoreModalOpen(false);
        setOperatoreSearchQuery('');
        
        showNotification({
          title: 'Successo',
          message: result.message || 'Operatore associato con successo',
          color: 'green',
        });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(errorData.error || `Errore durante l'associazione (${res.status})`);
      }
    } catch (error) {
      console.error('Errore durante l\'associazione:', error);
      showNotification({
        title: 'Errore',
        message: error.message || 'Impossibile associare l\'operatore',
        color: 'red',
      });
    }
  };

  // Funzione per dissociare un operatore dall'attività
  const handleDissociaOperatore = async (operatoreId) => {
    try {
      const res = await fetch(`/api/attivita/${id}/associa-operatore`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatore_id: operatoreId
        })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Aggiorna i dati dell'attività
        await mutate(`/api/attivita/${id}`);
        
        showNotification({
          title: 'Successo',
          message: result.message || 'Operatore dissociato con successo',
          color: 'green',
        });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(errorData.error || `Errore durante la dissociazione (${res.status})`);
      }
    } catch (error) {
      console.error('Errore durante la dissociazione:', error);
      showNotification({
        title: 'Errore',
        message: error.message || 'Impossibile dissociare l\'operatore',
        color: 'red',
      });
    }
  };

  // Funzione per l'upload del documento
  const handleUploadDocumento = async () => {
    try {
      console.log('=== UPLOAD DOCUMENTO ===');
      console.log('Selected file:', selectedFile?.name);
      console.log('Document info:', documentoInfo);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tipoDocumento', 'FIR');
      
      let res, newDocumento;

      // Se esiste già un documento, aggiornalo usando l'endpoint specifico
      if (documentoInfo && documentoInfo.id) {
        console.log('Aggiornamento documento esistente:', documentoInfo.id);
        // Aggiungi l'ID del documento al FormData per l'aggiornamento
        formData.append('documento_id', documentoInfo.id);
        
        res = await fetch(`/api/documenti/upload`, {
          method: 'PATCH',
          credentials: 'include',
          body: formData
        });

        console.log('PATCH Response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('PATCH Error response:', errorText);
          throw new Error('Errore durante l\'aggiornamento del documento');
        }

        newDocumento = await res.json();
        console.log('PATCH Success:', newDocumento);
      } else {
        console.log('Creazione nuovo documento per attivita:', id);
        // Crea nuovo documento
        formData.append('attivita_id', id);

        res = await fetch('/api/documenti/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        console.log('POST Response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('POST Error response:', errorText);
          throw new Error('Errore durante l\'upload del documento');
        }

        newDocumento = await res.json();
        console.log('POST Success:', newDocumento);
      }

      setDocumentoInfo(newDocumento);
      
    } catch (error) {
      console.error('Errore upload documento:', error);
      throw error;
    }
  };

  // Funzione per filtrare i mezzi in base alla ricerca
  const getMezziFiltrati = () => {
    if (!searchQuery.trim()) return mezziDisponibili;
    
    const query = searchQuery.toLowerCase();
    return mezziDisponibili.filter(item => 
      item.mezzo?.targa?.toLowerCase().includes(query) ||
      item.rimorchio?.nome?.toLowerCase().includes(query) ||
      item.rimorchio?.tipoRimorchio?.toLowerCase().includes(query)
    );
  };

  // Funzione per filtrare gli operatori in base alla ricerca
  const getOperatoriFiltrati = () => {
    if (!operatoreSearchQuery.trim()) return operatoriDisponibili;
    
    const query = operatoreSearchQuery.toLowerCase();
    return operatoriDisponibili.filter(operatore => 
      operatore.email?.toLowerCase().includes(query) ||
      operatore.nome?.toLowerCase().includes(query) ||
      operatore.cognome?.toLowerCase().includes(query) ||
      `${operatore.nome} ${operatore.cognome}`.toLowerCase().includes(query)
    );
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

  // Effect per caricare il documento quando l'attività viene caricata
  useEffect(() => {
    if (attivita && !isEditing) {
      loadDocumentoInfo();
    }
  }, [attivita, isEditing]);

  // Usa il nuovo hook per gestire l'autenticazione in modo unificato
  const authGuard = useAuthGuard({ 
    errors: [error]
  });

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
                  
                  {/* Icona di modifica/salvataggio accanto al titolo */}
                  <RequireRole
                              allowedRoles={['STAFF']}>
                  {isEditing ? (
                    <IconCheck 
                      style={{ 
                        width: '25px', 
                        height: '25px', 
                        color: colorScheme === 'dark' 
                          ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                          : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)'), 
                        marginLeft: '12px', 
                        strokeWidth: '1.7',
                        cursor: 'pointer'
                      }}
                      onClick={handleSave}
                    />
                  ) : (
                    <IconEdit 
                      style={{ 
                        width: '25px', 
                        height: '25px', 
                        color: colorScheme === 'dark' 
                          ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                          : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)'), 
                        marginLeft: '12px', 
                        strokeWidth: '1.7',
                        cursor: 'pointer'
                      }}
                      onClick={handleEdit}
                    />
                  )}
                  </RequireRole>
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

              {/* Example input field placed near the header */}
              {/* Allow inputs/description/lists to use the Container width so they match the header/profile image */}
              <div style={{ width: '100%' }}>
                  {/* Two input fields side-by-side, each half width */}
                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`titolo-${isEditing}-${attivita?.titolo}`}
                        id="attivita-titolo" 
                        label="Titolo" 
                        placeholder={!isEditing ? (attivita?.titolo || '--') : '--'} 
                        value={isEditing ? editedTitolo : ""} 
                        editable={isEditing}
                        onChange={(e) => setEditedTitolo(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`cer-${isEditing}-${attivita?.codiceCer}`}
                        id="attivita-cer" 
                        label="Codice CER" 
                        placeholder={!isEditing ? (attivita?.codiceCer || 'XX XX XX') : 'XX XX XX'} 
                        value={isEditing ? editedCodiceCer : ""} 
                        editable={isEditing}
                        onChange={(e) => setEditedCodiceCer(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`data-${isEditing}-${formatDateTime(attivita?.data).date}`}
                        id="attivita-data" 
                        label="Data" 
                        placeholder={!isEditing ? (formatDateTime(attivita?.data).date || 'dd/MM/YYYY') : 'dd/MM/YYYY'} 
                        value={isEditing ? editedData : ""} 
                        editable={isEditing}
                        onChange={(e) => setEditedData(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`orario-${isEditing}-${formatDateTime(attivita?.data).time}`}
                        id="attivita-orario" 
                        label="Orario" 
                        placeholder={!isEditing ? (formatDateTime(attivita?.data).time || '--') : 'HH:MM'} 
                        value={isEditing ? editedOrario : ""} 
                        editable={isEditing}
                        onChange={(e) => setEditedOrario(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`luogo-${isEditing}-${attivita?.luogo}`}
                        id="attivita-luogo" 
                        label="Luogo" 
                        placeholder={!isEditing ? (attivita?.luogo || '--') : '--'} 
                        value={isEditing ? editedLuogo : ""} 
                        editable={isEditing}
                        onChange={(e) => setEditedLuogo(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`stato-${isEditing}-${attivita?.statoAttivita}`}
                        id="attivita-stato" 
                        label="Stato" 
                        placeholder={!isEditing ? (attivita?.statoAttivita || '--') : '--'} 
                        value={isEditing ? editedStato : ""} 
                        editable={isEditing}
                        onChange={handleStatoChange}
                        onBlur={handleStatoBlur}
                        onClick={handleStatoClick}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`durata-${isEditing}-${attivita?.durata}`}
                        id="attivita-durata" 
                        label="Durata (minuti)" 
                        placeholder={!isEditing ? (attivita?.durata ? `${attivita.durata} minuti` : '--') : '--'} 
                        value={isEditing ? editedDurata : ""} 
                        editable={isEditing}
                        onChange={(e) => setEditedDurata(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AppInputField 
                        key={`documento-${isEditing}-${documentoInfo?.id}`}
                        id="attivita-documento" 
                        label="Documento" 
                        placeholder={getDocumentoPlaceholder()}
                        value=""
                        editable={false} // Campo sempre non modificabile
                        style={{ 
                          cursor: documentoInfo || isEditing ? 'pointer' : 'default',
                          backgroundColor: documentoInfo || isEditing ? 'rgba(0, 123, 255, 0.1)' : undefined
                        }}
                        onClick={handleDocumentoClick}
                      />
                    </div>
                  </div>

                  <AppLargeText style={{marginTop: '80px', fontSize: '18px', fontWeight: '600',}}>Descrizione</AppLargeText>
                  <div style={{ display: 'flex', width: '100%', marginTop: '10px' }}>
                    
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <AppInputField
                          key={`descrizione-${isEditing}-${attivita?.descrizione}`}
                          id="attivita-descrizione"
                          label="Descrizione"
                          placeholder={!isEditing ? (attivita?.descrizione || 'Nessuna descrizione') : '--'}
                          hideFloatingLabel={true}
                          placeholderLeft={true}
                          value={isEditing ? editedDescrizione : ""}
                          editable={isEditing}
                          onChange={(e) => setEditedDescrizione(e.target.value)}
                        />
                    </div>
                  </div>
                  {/* Two-column section with vertical divider: Mezzo associato | Operatori associati */}
                  <RequireRole allowedRoles={['STAFF', 'OPERATORE']}>
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
                      <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
                        <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Mezzo associato</AppLargeText>
                        {isEditing && (
                          <IconPlus 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              color: colorScheme === 'dark' 
                                ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                                : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)'), 
                              strokeWidth: '1.7',
                              cursor: 'pointer'
                            }}
                            onClick={handleOpenMezzoModal}
                          />
                        )}
                      </Group>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
                        {attivita?.mezzo_rimorchio ? (
                          <MezzoCard 
                            /* Use the association id (mezzo_rimorchio.id) for navigation and identity
                               because the mezzI detail page expects the MezzoRimorchio id, not the Mezzo id */
                            id={attivita.mezzo_rimorchio.id} 
                            previewSrc={attivita.mezzo_rimorchio.mezzo.immagine || "/images/login-bg.png"} 
                            stato={attivita.mezzo_rimorchio.mezzo.statoMezzo}
                            targa={attivita.mezzo_rimorchio.mezzo.targa}
                            rimorchio={`${attivita.mezzo_rimorchio.rimorchio.nome} (${attivita.mezzo_rimorchio.rimorchio.tipoRimorchio})`}
                            onView={() => router.push(`/mezzi/${attivita.mezzo_rimorchio.id}`)} 
                            isEditable={isEditing}
                            onDelete={async () => {
                              try {
                                const res = await fetch(`/api/attivita/${id}/associa-mezzo`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({})
                                });

                                if (res.ok) {
                                  await mutate(`/api/attivita/${id}`);
                                  showNotification({ title: 'Successo', message: 'Mezzo dissociato', color: 'green' });
                                } else {
                                  const err = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
                                  throw new Error(err.error || 'Impossibile dissociare mezzo');
                                }
                              } catch (e) {
                                console.error('Errore dissociazione mezzo:', e);
                                showNotification({ title: 'Errore', message: e.message || 'Impossibile dissociare il mezzo', color: 'red' });
                              }
                            }}
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
                      <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
                        <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Operatori associati</AppLargeText>
                        {isEditing && (
                          <IconPlus 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              color: colorScheme === 'dark' 
                                ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                                : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)'), 
                              strokeWidth: '1.7',
                              cursor: 'pointer'
                            }}
                            onClick={handleOpenOperatoreModal}
                          />
                        )}
                      </Group>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
                        {attivita?.operatori_assegnati && attivita.operatori_assegnati.length > 0 ? (
                          attivita.operatori_assegnati.map((operatore) => (
                            <UtenteCard 
                              key={operatore.id}
                              id={operatore.id} 
                              nome={`${operatore.nome || ''} ${operatore.cognome || ''}`.trim() || operatore.email} 
                              email={operatore.email}
                              onView={() => router.push(`/utenti/${operatore.id}`)} 
                              isEditable={isEditing}
                              onDelete={async () => {
                                try {
                                  const res = await fetch(`/api/attivita/${id}/dissocia-operatore`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ operatore_id: operatore.id })
                                  });

                                  if (res.ok) {
                                    await mutate(`/api/attivita/${id}`);
                                    showNotification({ title: 'Successo', message: 'Operatore rimosso', color: 'green' });
                                  } else {
                                    const err = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
                                    throw new Error(err.error || 'Impossibile rimuovere operatore');
                                  }
                                } catch (e) {
                                  console.error('Errore rimozione operatore:', e);
                                  showNotification({ title: 'Errore', message: e.message || 'Impossibile rimuovere operatore', color: 'red' });
                                }
                              }}
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
                </RequireRole>
        </div>
  </Box>
  </Container>

      {/* Modale per associare mezzo */}
      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSearchQuery('');
        }}
        title="Associa Mezzo all'Attività"
        size="lg"
        centered
      >
        <Box>
          {/* Barra di ricerca */}
          <TextInput
            placeholder="Cerca per targa, nome rimorchio o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ marginBottom: '20px' }}
          />

          {/* Lista dei mezzi filtrati */}
          <ScrollArea style={{ height: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getMezziFiltrati().length > 0 ? (
                getMezziFiltrati().map((mezzoRimorchio) => (
                  <div
                    key={mezzoRimorchio.id}
                    data-mezzo-id={mezzoRimorchio.id}
                    style={{
                      padding: '16px',
                      border: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                    onClick={(e) => {
                      // Use currentTarget to avoid issues if inner elements are clicked
                      const el = e.currentTarget;
                      const idAttr = el.getAttribute('data-mezzo-id');
                      const selectedId = idAttr ? parseInt(idAttr, 10) : null;
                      console.debug('AssociaMezzo click, selected object:', mezzoRimorchio, 'extractedId:', selectedId);
                      if (selectedId !== null) {
                        handleAssociaMezzo(selectedId);
                      } else {
                        console.error('Unable to determine mezzo id from clicked element', el);
                      }
                    }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      target.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                      target.style.borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget;
                      target.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                      target.style.borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          color: colorScheme === 'dark' ? '#ffffff' : '#000000'
                        }}>
                          Targa: {mezzoRimorchio.mezzo?.targa || 'N/A'}
                        </div>
                        <div style={{ 
                          fontSize: '14px',
                          color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}>
                          Rimorchio: {mezzoRimorchio.rimorchio?.nome || 'N/A'} ({mezzoRimorchio.rimorchio?.tipoRimorchio || 'N/A'})
                        </div>
                        <div style={{ 
                          fontSize: '14px',
                          color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}>
                          Stato: {mezzoRimorchio.mezzo?.statoMezzo || 'N/A'}
                        </div>
                      </div>
                      <IconPlus 
                        size={20}
                        style={{
                          color: colorScheme === 'dark' 
                            ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                            : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)')
                        }}
                      />
                    </Group>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  fontStyle: 'italic'
                }}>
                  {searchQuery.trim() ? 'Nessun mezzo trovato per la ricerca' : 'Nessun mezzo disponibile'}
                </div>
              )}
            </div>
          </ScrollArea>
        </Box>
      </Modal>

      {/* Modale per associare operatore */}
      <Modal
        opened={isOperatoreModalOpen}
        onClose={() => {
          setIsOperatoreModalOpen(false);
          setOperatoreSearchQuery('');
        }}
        title="Associa Operatore all'Attività"
        size="lg"
        centered
      >
        <Box>
          {/* Barra di ricerca */}
          <TextInput
            placeholder="Cerca per nome, cognome o email..."
            value={operatoreSearchQuery}
            onChange={(e) => setOperatoreSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ marginBottom: '20px' }}
          />

          {/* Lista degli operatori filtrati */}
          <ScrollArea style={{ height: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getOperatoriFiltrati().length > 0 ? (
                getOperatoriFiltrati().map((operatore) => (
                  <div
                    key={operatore.id}
                    style={{
                      padding: '16px',
                      border: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                    onClick={() => handleAssociaOperatore(operatore.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          color: colorScheme === 'dark' ? '#ffffff' : '#000000'
                        }}>
                          {`${operatore.nome || ''} ${operatore.cognome || ''}`.trim() || operatore.email}
                        </div>
                        <div style={{ 
                          fontSize: '14px',
                          color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}>
                          Email: {operatore.email || 'N/A'}
                        </div>
                        <div style={{ 
                          fontSize: '14px',
                          color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}>
                          Ruolo: {operatore.ruolo || 'N/A'}
                        </div>
                      </div>
                      <IconPlus 
                        size={20}
                        style={{
                          color: colorScheme === 'dark' 
                            ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                            : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)')
                        }}
                      />
                    </Group>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  fontStyle: 'italic'
                }}>
                  {operatoreSearchQuery.trim() ? 'Nessun operatore trovato per la ricerca' : 'Nessun operatore disponibile'}
                </div>
              )}
            </div>
          </ScrollArea>
        </Box>
      </Modal>
    </>
  );
}
