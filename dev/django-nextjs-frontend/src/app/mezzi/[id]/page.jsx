"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuth } from '@/providers/authProvider';
import { useState, useEffect, use, useRef } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme, Image } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconUser, IconArrowNarrowLeft, IconEdit, IconCheck, IconUpload } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppInputField from '@/components/ui/AppInputField';
import { DJANGO_MEDIA_URL } from '@/config/config';
import RequireRole from "@/components/RequireRole";

const fetcher = async url => {
  console.log('Fetching from URL:', url);
  
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
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
        console.log('Error response JSON:', errorInfo);
        
        // Se errorInfo è un oggetto vuoto o non ha messaggi utili
        if (!errorInfo || Object.keys(errorInfo).length === 0) {
          errorInfo = { message: `HTTP ${res.status} error` };
        } else if (!errorInfo.message && !errorInfo.error && !errorInfo.detail) {
          errorInfo.message = `HTTP ${res.status} error`;
        }
      } else {
        const textResponse = await res.text();
        console.log('Non-JSON response:', textResponse.substring(0, 200));
        errorInfo = { message: textResponse || 'Authentication required - please refresh the page' };
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      errorInfo = { message: `Failed to parse error response (HTTP ${res.status})` };
    }
    console.error('API Error Info:', errorInfo);
    
    // Non facciamo redirect manuale - lasciamo che useAuthGuard gestisca il 401
    const errorMessage = errorInfo.detail || errorInfo.error || errorInfo.message || 'An error occurred while fetching the data.';
    const error = new Error(`HTTP ${res.status}: ${errorMessage}`);
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

export default function MezzoRimorchioDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  // Responsive layout: le immagini passano sotto i campi sotto i 1050px
  const isMobile = useMediaQuery('(max-width: 1050px)', false, { getInitialValueInEffect: true });
  
  // Stato per la modalità editing
  const [isEditing, setIsEditing] = useState(false);
  
  // Stati per i campi editabili del mezzo
  const [editedTarga, setEditedTarga] = useState('');
  const [editedChilometraggio, setEditedChilometraggio] = useState('');
  const [editedConsumoCarburante, setEditedConsumoCarburante] = useState('');
  const [editedScadenzaRevisione, setEditedScadenzaRevisione] = useState('');
  const [editedScadenzaAssicurazione, setEditedScadenzaAssicurazione] = useState('');
  const [editedStatoMezzo, setEditedStatoMezzo] = useState('');
  const [mezzoImageFile, setMezzoImageFile] = useState(null);
  const [mezzoImagePreview, setMezzoImagePreview] = useState(null);

  // Stati per i campi editabili del rimorchio
  const [editedRimorchioId, setEditedRimorchioId] = useState('');
  const [editedRimorchioNome, setEditedRimorchioNome] = useState('');
  const [editedRimorchioCapacita, setEditedRimorchioCapacita] = useState('');
  const [editedRimorchioTipo, setEditedRimorchioTipo] = useState('');
  const [rimorchioImageFile, setRimorchioImageFile] = useState(null);
  const [rimorchioImagePreview, setRimorchioImagePreview] = useState(null);

  // Refs per i file input nascosti
  const mezzoImageInputRef = useRef(null);
  const rimorchioImageInputRef = useRef(null);

  // Possibili stati del mezzo (dal modello Django)
  const STATI_MEZZO_VALIDI = [
    { value: 'DISPONIBILE', label: 'Disponibile' },
    { value: 'OCCUPATO', label: 'Occupato' },
    { value: 'MANUTENZIONE', label: 'In manutenzione' }
  ];

  // Possibili tipi di rimorchio (dal modello Django)
  const TIPI_RIMORCHIO_VALIDI = [
    { value: 'RIBALTABILE', label: 'Ribaltabile' },
    { value: 'COMPATTANTE', label: 'Compattante' },
    { value: 'CISTERNA', label: 'Cisterna' },
    { value: 'PIANALE', label: 'Pianale' },
    { value: 'CASSONE', label: 'Cassone' },
    { value: 'SCARRABILE', label: 'Scarrabile' },
    { value: 'ALTRO', label: 'Altro' }
  ];

  // Funzione per caricare i dati del mezzo quando cambia la targa
  const loadMezzoByTarga = async (targa) => {
    if (!targa || targa.trim() === '') return;
    
    try {
      // Cerca il mezzo con questa targa
      const res = await fetch(`/api/mezzi?targa=${encodeURIComponent(targa)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const mezzi = await res.json();
        if (mezzi && mezzi.length > 0) {
          const mezzo = mezzi[0];
          // Aggiorna i campi con i dati del mezzo esistente
          setEditedChilometraggio(mezzo.chilometraggio?.toString() || '0');
          setEditedScadenzaRevisione(formatDate(mezzo.scadenzaRevisione));
          setEditedScadenzaAssicurazione(formatDate(mezzo.scadenzaAssicurazione));
          setEditedStatoMezzo(mezzo.statoMezzo || 'DISPONIBILE');
          
          showNotification({
            title: 'Mezzo trovato',
            message: `Caricati i dati del mezzo con targa ${targa}`,
            color: 'blue',
          });
        } else {
          // Mezzo non trovato - imposta valori di default
          setEditedChilometraggio('0');
          setEditedScadenzaRevisione('');
          setEditedScadenzaAssicurazione('');
          setEditedStatoMezzo('DISPONIBILE');
          
          showNotification({
            title: 'Nuovo mezzo',
            message: `Nessun mezzo trovato con targa ${targa}. Verrà creato un nuovo mezzo con i dati inseriti.`,
            color: 'yellow',
            autoClose: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Errore durante il caricamento del mezzo:', error);
    }
  };

  // Funzione per caricare i dati del rimorchio quando cambia l'ID
  const loadRimorchioById = async (rimorchioId) => {
    if (!rimorchioId || rimorchioId.trim() === '') return;
    
    const id = parseInt(rimorchioId, 10);
    if (isNaN(id)) return;
    
    try {
      const res = await fetch(`/api/rimorchi/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const rimorchio = await res.json();
        // Aggiorna i campi con i dati del rimorchio esistente
        setEditedRimorchioNome(rimorchio.nome || '');
        setEditedRimorchioCapacita(rimorchio.capacitaDiCarico?.toString() || '0');
        setEditedRimorchioTipo(rimorchio.tipoRimorchio || 'ALTRO');
        
        showNotification({
          title: 'Rimorchio trovato',
          message: `Caricati i dati del rimorchio ID ${id}`,
          color: 'blue',
        });
      } else {
        // Rimorchio non trovato - imposta valori di default
        setEditedRimorchioNome('');
        setEditedRimorchioCapacita('0');
        setEditedRimorchioTipo('ALTRO');
        
        showNotification({
          title: 'Nuovo rimorchio',
          message: `Nessun rimorchio trovato con ID ${id}. Verrà creato un nuovo rimorchio con i dati inseriti.`,
          color: 'yellow',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Errore durante il caricamento del rimorchio:', error);
    }
  };

  // Gestione cambio targa con debounce
  const handleTargaBlur = () => {
    const newTarga = editedTarga.trim();
    const originalTarga = mezzoRimorchio?.mezzo?.targa;
    
    if (newTarga && newTarga !== originalTarga) {
      loadMezzoByTarga(newTarga);
    }
  };

  // Gestione cambio ID rimorchio con debounce
  const handleRimorchioIdBlur = () => {
    const newId = editedRimorchioId.trim();
    const originalId = mezzoRimorchio?.rimorchio?.id?.toString();
    
    if (newId && newId !== originalId) {
      loadRimorchioById(newId);
    }
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

  // Funzione per mostrare i tipi di rimorchio possibili
  const handleTipoRimorchioClick = () => {
    if (isEditing) {
      const tipiMessage = TIPI_RIMORCHIO_VALIDI.map(tipo => `${tipo.value}`).join(', ');
      showNotification({
        title: 'Tipi di rimorchio disponibili',
        message: `I tipi possibili sono: ${tipiMessage}`,
        color: 'blue',
        autoClose: 8000,
      });
    }
  };

  // Funzione per validare il tipo di rimorchio inserito
  const validateTipoRimorchio = (tipoValue) => {
    if (!tipoValue || tipoValue.trim() === '') {
      return false;
    }
    
    const tipoUpper = tipoValue.trim().toUpperCase();
    return TIPI_RIMORCHIO_VALIDI.some(tipo => tipo.value === tipoUpper);
  };

  // Funzione per gestire il cambio del campo tipo rimorchio
  const handleTipoRimorchioChange = (e) => {
    const newValue = e.target.value;
    setEditedRimorchioTipo(newValue);
  };

  // Funzione per validare il tipo di rimorchio quando l'utente finisce di modificare
  const handleTipoRimorchioBlur = () => {
    const currentValue = editedRimorchioTipo;
    
    if (!currentValue || currentValue.trim() === '') {
      return;
    }
    
    if (validateTipoRimorchio(currentValue)) {
      setEditedRimorchioTipo(currentValue.trim().toUpperCase());
    } else {
      showNotification({
        title: 'Tipo non valido',
        message: `Il tipo "${currentValue}" non è valido. Tipi possibili: ${TIPI_RIMORCHIO_VALIDI.map(t => t.value).join(', ')}. Ripristinato il valore precedente.`,
        color: 'yellow',
        autoClose: 5000,
      });
      setEditedRimorchioTipo(mezzoRimorchio?.rimorchio?.tipoRimorchio || '');
    }
  };

  // Funzione per mostrare gli stati possibili quando si clicca sul campo stato
  const handleStatoMezzoClick = () => {
    if (isEditing) {
      const statiMessage = STATI_MEZZO_VALIDI.map(stato => `${stato.value}`).join(', ');
      showNotification({
        title: 'Stati disponibili',
        message: `Gli stati possibili sono: ${statiMessage}`,
        color: 'blue',
        autoClose: 8000,
      });
    }
  };

  // Funzione per validare lo stato inserito
  const validateStatoMezzo = (statoValue) => {
    if (!statoValue || statoValue.trim() === '') {
      return false;
    }
    
    const statoUpper = statoValue.trim().toUpperCase();
    return STATI_MEZZO_VALIDI.some(stato => stato.value === statoUpper);
  };

  // Funzione per gestire il cambio del campo stato
  const handleStatoMezzoChange = (e) => {
    const newValue = e.target.value;
    setEditedStatoMezzo(newValue);
  };

  // Funzione per validare lo stato quando l'utente finisce di modificare
  const handleStatoMezzoBlur = () => {
    const currentValue = editedStatoMezzo;
    
    if (!currentValue || currentValue.trim() === '') {
      return;
    }
    
    if (validateStatoMezzo(currentValue)) {
      setEditedStatoMezzo(currentValue.trim().toUpperCase());
    } else {
      showNotification({
        title: 'Stato non valido',
        message: `Lo stato "${currentValue}" non è valido. Stati possibili: ${STATI_MEZZO_VALIDI.map(s => s.value).join(', ')}. Ripristinato il valore precedente.`,
        color: 'yellow',
        autoClose: 5000,
      });
      setEditedStatoMezzo(mezzoRimorchio?.mezzo?.statoMezzo || '');
    }
  };

  // Funzione per entrare in modalità editing
  const handleEdit = () => {
    if (mezzoRimorchio) {
      // Dati del mezzo
      setEditedTarga(mezzoRimorchio.mezzo?.targa || '');
      setEditedChilometraggio(mezzoRimorchio.mezzo?.chilometraggio?.toString() || '');
      setEditedConsumoCarburante(mezzoRimorchio.mezzo?.consumoCarburante?.toString() || '');
      setEditedScadenzaRevisione(formatDate(mezzoRimorchio.mezzo?.scadenzaRevisione));
      setEditedScadenzaAssicurazione(formatDate(mezzoRimorchio.mezzo?.scadenzaAssicurazione));
      setEditedStatoMezzo(mezzoRimorchio.mezzo?.statoMezzo || '');
      
      // Dati del rimorchio
      setEditedRimorchioId(mezzoRimorchio.rimorchio?.id?.toString() || '');
      setEditedRimorchioNome(mezzoRimorchio.rimorchio?.nome || '');
      setEditedRimorchioCapacita(mezzoRimorchio.rimorchio?.capacitaDiCarico?.toString() || '');
      setEditedRimorchioTipo(mezzoRimorchio.rimorchio?.tipoRimorchio || '');
      
      setIsEditing(true);
    }
  };

  // Funzione per formattare la data in formato dd/MM/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Funzione per convertire la data da dd/MM/yyyy a yyyy-MM-dd
  const convertDateToISO = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;
    const [day, month, year] = dateString.split('/');
    if (!day || !month || !year) return null;
    return `${year}-${month}-${day}`;
  };

  // Funzione per gestire il cambio dell'immagine del mezzo
  const handleMezzoImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMezzoImageFile(file);
      // Crea preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMezzoImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Funzione per gestire il cambio dell'immagine del rimorchio
  const handleRimorchioImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRimorchioImageFile(file);
      // Crea preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setRimorchioImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Funzione per caricare un'immagine
  const uploadImage = async (file, entityType, entityId) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('immagine', file);

    console.debug(`uploadImage: entityType=${entityType} entityId=${entityId} fileName=${file.name} fileSize=${file.size}`);

    try {
      const res = await fetch(`/api/${entityType}/${entityId}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.debug('uploadImage response status:', res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error(`Errore durante l'upload dell'immagine per ${entityType}`, { status: res.status, body: text });
        return null;
      }

      const data = await res.json();
      console.debug('uploadImage response json:', data);
      return data.immagine;
    } catch (error) {
      console.error(`Errore durante l'upload dell'immagine per ${entityType}:`, error);
      return null;
    }
  };

  // Funzione per salvare le modifiche
  const handleSave = async () => {
    try {
      // Determina se la targa o l'ID rimorchio sono cambiati
      const targaChanged = editedTarga !== mezzoRimorchio.mezzo.targa;
      const rimorchioIdChanged = editedRimorchioId && parseInt(editedRimorchioId, 10) !== mezzoRimorchio.rimorchio.id;

      // Prepara i payload per mezzo e rimorchio
      const mezzoPayload = {
        targa: editedTarga,
        chilometraggio: editedChilometraggio ? parseInt(editedChilometraggio, 10) : 0,
        consumoCarburante: editedConsumoCarburante ? parseFloat(editedConsumoCarburante) : 0.0,
        scadenzaRevisione: convertDateToISO(editedScadenzaRevisione),
        scadenzaAssicurazione: convertDateToISO(editedScadenzaAssicurazione),
        statoMezzo: editedStatoMezzo,
      };

      console.log('Mezzo Payload da inviare:', mezzoPayload);

      const rimorchioPayload = {
        nome: editedRimorchioNome,
        capacitaDiCarico: editedRimorchioCapacita ? parseFloat(editedRimorchioCapacita) : 0.0,
        tipoRimorchio: editedRimorchioTipo,
      };

      console.log('Rimorchio Payload da inviare:', rimorchioPayload);

      let finalMezzoId = mezzoRimorchio.mezzo.id;
      let finalRimorchioId = mezzoRimorchio.rimorchio.id;

      // Gestisci il mezzo (aggiorna o crea se targa è cambiata)
      if (targaChanged) {
        // Verifica se esiste già un mezzo con questa targa
        const checkMezzoRes = await fetch(`/api/mezzi?targa=${encodeURIComponent(editedTarga)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (checkMezzoRes.ok) {
          const mezzi = await checkMezzoRes.json();
          if (mezzi && mezzi.length > 0) {
            // Mezzo esistente - aggiorna
            finalMezzoId = mezzi[0].id;
            const updateMezzoRes = await fetch(`/api/mezzi/${finalMezzoId}`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mezzoPayload)
            });

            if (!updateMezzoRes.ok) {
              const errorData = await updateMezzoRes.json();
              throw new Error(errorData.error || 'Errore durante l\'aggiornamento del mezzo');
            }
          } else {
            // Mezzo non esiste - crea nuovo
            const createMezzoRes = await fetch(`/api/mezzi`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mezzoPayload)
            });

            if (!createMezzoRes.ok) {
              const errorData = await createMezzoRes.json();
              throw new Error(errorData.error || 'Errore durante la creazione del mezzo');
            }

            const newMezzo = await createMezzoRes.json();
            finalMezzoId = newMezzo.id;
          }
        }
      } else {
        // Targa non cambiata - semplice aggiornamento
        console.log('Aggiornamento mezzo esistente, payload:', mezzoPayload);
        const updateMezzoRes = await fetch(`/api/mezzi/${mezzoRimorchio.mezzo.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mezzoPayload)
        });

        console.log('Risposta aggiornamento mezzo:', updateMezzoRes.status);

        if (!updateMezzoRes.ok) {
          const errorData = await updateMezzoRes.json();
          console.error('Errore aggiornamento mezzo:', errorData);
          const errorMsg = errorData.error || errorData.message || JSON.stringify(errorData);
          throw new Error(`Errore durante l'aggiornamento del mezzo: ${errorMsg}`);
        }
      }

      // Gestisci il rimorchio (aggiorna o crea se ID è cambiato)
      if (rimorchioIdChanged) {
        const newRimorchioId = parseInt(editedRimorchioId, 10);
        
        // Verifica se esiste il rimorchio con questo ID
        const checkRimorchioRes = await fetch(`/api/rimorchi/${newRimorchioId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (checkRimorchioRes.ok) {
          // Rimorchio esistente - aggiorna
          finalRimorchioId = newRimorchioId;
          const updateRimorchioRes = await fetch(`/api/rimorchi/${finalRimorchioId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rimorchioPayload)
          });

          if (!updateRimorchioRes.ok) {
            const errorData = await updateRimorchioRes.json();
            throw new Error(errorData.error || 'Errore durante l\'aggiornamento del rimorchio');
          }
        } else {
          // Rimorchio non esiste - crea nuovo
          const createRimorchioRes = await fetch(`/api/rimorchi`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rimorchioPayload)
          });

          if (!createRimorchioRes.ok) {
            const errorData = await createRimorchioRes.json();
            throw new Error(errorData.error || 'Errore durante la creazione del rimorchio');
          }

          const newRimorchio = await createRimorchioRes.json();
          finalRimorchioId = newRimorchio.id;
        }
      } else {
        // ID rimorchio non cambiato - semplice aggiornamento
        const updateRimorchioRes = await fetch(`/api/rimorchi/${mezzoRimorchio.rimorchio.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rimorchioPayload)
        });

        if (!updateRimorchioRes.ok) {
          const errorData = await updateRimorchioRes.json();
          throw new Error(errorData.error || 'Errore durante l\'aggiornamento del rimorchio');
        }
      }

      // Se mezzo o rimorchio sono cambiati, aggiorna la relazione mezzo-rimorchio
      if (targaChanged || rimorchioIdChanged) {
        const updateRelationRes = await fetch(`/api/mezzi-rimorchi/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mezzo_id: finalMezzoId,
            rimorchio_id: finalRimorchioId,
          })
        });

        if (!updateRelationRes.ok) {
          console.warn('Attenzione: errore durante l\'aggiornamento della relazione mezzo-rimorchio');
          // Non blocchiamo il salvataggio per questo errore
        }
      }

      // Upload delle immagini se presenti
      if (mezzoImageFile) {
        await uploadImage(mezzoImageFile, 'mezzi', finalMezzoId);
      }

      if (rimorchioImageFile) {
        await uploadImage(rimorchioImageFile, 'rimorchi', finalRimorchioId);
      }

      await mutate(`/api/mezzi-rimorchi/${id}`);
      setIsEditing(false);
      
      // Reset degli stati delle immagini
      setMezzoImageFile(null);
      setMezzoImagePreview(null);
      setRimorchioImageFile(null);
      setRimorchioImagePreview(null);
      
      showNotification({
        title: 'Successo',
        message: 'Mezzo-rimorchio aggiornato con successo',
        color: 'green',
      });
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      
      // Gestisci l'errore in modo più robusto
      let errorMessage = 'Impossibile salvare le modifiche';
      
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showNotification({
        title: 'Errore',
        message: errorMessage,
        color: 'red',
        autoClose: 8000,
      });
    }
  };

  const auth = useAuth();

  const { data: mezzoRimorchio, error, isLoading } = useSWR(
    auth?.isAuthenticated ? `/api/mezzi-rimorchi/${id}` : null,
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
  console.log('MezzoRimorchio data:', mezzoRimorchio);

  return (
    <Container size="lg">
      <RequireRole
                  allowedRoles={['STAFF', 'OPERATORE']}
                  fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
      <Box style={{marginTop: '24px'}}>
        <Group justify="space-between" align="center">
          <Group justify="start" align="center">
            <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
            <AppLargeText order={1}>
              Mezzo-Rimorchio: ID#{id}
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

        {/* Contenuto principale */}
        <div style={{ width: '100%' }}>
          {/* Sezione Mezzo con Immagine */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '20px', 
            width: '100%', 
            marginTop: '30px', 
            alignItems: 'flex-start' 
          }}>
            {/* Colonna campi del mezzo */}
            <div style={{ 
              flex: isMobile ? 'none' : '0 0 45%',
              width: isMobile ? '100%' : '45%',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px' 
            }}>
              <AppInputField 
                key={`targa-${isEditing}-${mezzoRimorchio?.mezzo?.targa}`}
                id="mezzo-targa" 
                label="Targa" 
                placeholder={!isEditing ? (mezzoRimorchio?.mezzo?.targa || '--') : '--'} 
                value={isEditing ? editedTarga : ""} 
                editable={isEditing}
                onChange={(e) => setEditedTarga(e.target.value)}
                onBlur={handleTargaBlur}
              />
              
              <AppInputField 
                key={`chilometraggio-${isEditing}-${mezzoRimorchio?.mezzo?.chilometraggio}`}
                id="mezzo-chilometraggio" 
                label="Chilometraggio" 
                placeholder={!isEditing ? (mezzoRimorchio?.mezzo?.chilometraggio?.toString() || '0') : '0'} 
                value={isEditing ? editedChilometraggio : ""} 
                editable={isEditing}
                onChange={(e) => setEditedChilometraggio(e.target.value)}
              />
              
              <AppInputField 
                key={`consumo-carburante-${isEditing}-${mezzoRimorchio?.mezzo?.consumoCarburante}`}
                id="mezzo-consumo-carburante" 
                label="Consumo Carburante (L/100km)" 
                placeholder={!isEditing ? (mezzoRimorchio?.mezzo?.consumoCarburante?.toString() || '0.0') : '0.0'} 
                value={isEditing ? editedConsumoCarburante : ""} 
                editable={isEditing}
                onChange={(e) => setEditedConsumoCarburante(e.target.value)}
              />
              
              <AppInputField 
                key={`scadenza-revisione-${isEditing}-${mezzoRimorchio?.mezzo?.scadenzaRevisione}`}
                id="mezzo-scadenza-revisione" 
                label="Scadenza Revisione" 
                placeholder={!isEditing ? (formatDate(mezzoRimorchio?.mezzo?.scadenzaRevisione) || 'dd/MM/yyyy') : 'dd/MM/yyyy'} 
                value={isEditing ? editedScadenzaRevisione : ""} 
                editable={isEditing}
                onChange={(e) => setEditedScadenzaRevisione(e.target.value)}
              />
              
              <AppInputField 
                key={`scadenza-assicurazione-${isEditing}-${mezzoRimorchio?.mezzo?.scadenzaAssicurazione}`}
                id="mezzo-scadenza-assicurazione" 
                label="Scadenza Assicurazione" 
                placeholder={!isEditing ? (formatDate(mezzoRimorchio?.mezzo?.scadenzaAssicurazione) || 'dd/MM/yyyy') : 'dd/MM/yyyy'} 
                value={isEditing ? editedScadenzaAssicurazione : ""} 
                editable={isEditing}
                onChange={(e) => setEditedScadenzaAssicurazione(e.target.value)}
              />
              
              <AppInputField 
                key={`stato-mezzo-${isEditing}-${mezzoRimorchio?.mezzo?.statoMezzo}`}
                id="mezzo-stato" 
                label="Stato Mezzo" 
                placeholder={!isEditing ? (mezzoRimorchio?.mezzo?.statoMezzo || '--') : '--'} 
                value={isEditing ? editedStatoMezzo : ""} 
                editable={isEditing}
                onChange={handleStatoMezzoChange}
                onBlur={handleStatoMezzoBlur}
                onClick={handleStatoMezzoClick}
              />
            </div>
            
            {/* Immagine del mezzo */}
            <div style={{ 
              flex: isMobile ? 'none' : '1',
              width: isMobile ? '100%' : 'auto',
              maxWidth: '100%',
              position: 'relative'
            }}>
              {/* Input file nascosto */}
              <input
                ref={mezzoImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleMezzoImageChange}
                style={{ display: 'none' }}
              />
              
              {/* Icona di upload in alto a destra */}
              {isEditing && (
                <div
                  onClick={() => mezzoImageInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                >
                  <IconUpload size={20} color="#ffffff" />
                </div>
              )}
              
              <Image
                src={mezzoImagePreview || (mezzoRimorchio?.mezzo?.immagine ? `${DJANGO_MEDIA_URL}${mezzoRimorchio.mezzo.immagine}` : '/images/login-bg.png')}
                alt="Immagine mezzo"
                radius="md"
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'cover',
                  cursor: isEditing ? 'pointer' : 'default'
                }}
                onClick={() => isEditing && mezzoImageInputRef.current?.click()}
              />
            </div>
          </div>

          {/* Sezione Rimorchio con Immagine */}
          <AppLargeText style={{marginTop: '60px', fontSize: '18px', fontWeight: '600',}}>Rimorchio</AppLargeText>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '20px', 
            width: '100%', 
            marginTop: '10px',
            alignItems: 'flex-start' 
          }}>
            {/* Colonna campi del rimorchio */}
            <div style={{ 
              flex: isMobile ? 'none' : '0 0 45%',
              width: isMobile ? '100%' : '45%',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px' 
            }}>
              <AppInputField 
                key={`rimorchio-id-${isEditing}-${mezzoRimorchio?.rimorchio?.id}`}
                id="rimorchio-id" 
                label="ID" 
                placeholder={!isEditing ? (mezzoRimorchio?.rimorchio?.id?.toString() || '--') : '--'} 
                value={isEditing ? editedRimorchioId : ""} 
                editable={isEditing}
                onChange={(e) => setEditedRimorchioId(e.target.value)}
                onBlur={handleRimorchioIdBlur}
              />
              
              <AppInputField 
                key={`rimorchio-nome-${isEditing}-${mezzoRimorchio?.rimorchio?.nome}`}
                id="rimorchio-nome" 
                label="Nome" 
                placeholder={!isEditing ? (mezzoRimorchio?.rimorchio?.nome || '--') : '--'} 
                value={isEditing ? editedRimorchioNome : ""} 
                editable={isEditing}
                onChange={(e) => setEditedRimorchioNome(e.target.value)}
              />
              
              <AppInputField 
                key={`rimorchio-capacita-${isEditing}-${mezzoRimorchio?.rimorchio?.capacitaDiCarico}`}
                id="rimorchio-capacita" 
                label="Capacità" 
                placeholder={!isEditing ? (mezzoRimorchio?.rimorchio?.capacitaDiCarico?.toString() || '0.00') : '0.00'} 
                value={isEditing ? editedRimorchioCapacita : ""} 
                editable={isEditing}
                onChange={(e) => setEditedRimorchioCapacita(e.target.value)}
              />
              
              <AppInputField 
                key={`rimorchio-tipo-${isEditing}-${mezzoRimorchio?.rimorchio?.tipoRimorchio}`}
                id="rimorchio-tipo" 
                label="Tipo" 
                placeholder={!isEditing ? (mezzoRimorchio?.rimorchio?.tipoRimorchio || '--') : '--'} 
                value={isEditing ? editedRimorchioTipo : ""} 
                editable={isEditing}
                onChange={handleTipoRimorchioChange}
                onBlur={handleTipoRimorchioBlur}
                onClick={handleTipoRimorchioClick}
              />
            </div>

            {/* Immagine del rimorchio */}
            <div style={{ 
              flex: isMobile ? 'none' : '1',
              width: isMobile ? '100%' : 'auto',
              maxWidth: '100%',
              position: 'relative'
            }}>
              {/* Input file nascosto */}
              <input
                ref={rimorchioImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleRimorchioImageChange}
                style={{ display: 'none' }}
              />
              
              {/* Icona di upload in alto a destra */}
              {isEditing && (
                <div
                  onClick={() => rimorchioImageInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                >
                  <IconUpload size={20} color="#ffffff" />
                </div>
              )}
              
              <Image
                src={rimorchioImagePreview || (mezzoRimorchio?.rimorchio?.immagine ? `${DJANGO_MEDIA_URL}${mezzoRimorchio.rimorchio.immagine}` : '/images/login-bg.png')}
                alt="Immagine rimorchio"
                radius="md"
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'cover',
                  cursor: isEditing ? 'pointer' : 'default'
                }}
                onClick={() => isEditing && rimorchioImageInputRef.current?.click()}
              />
            </div>
          </div>
        </div>
      </Box>
      </RequireRole>
    </Container>
  );
}
