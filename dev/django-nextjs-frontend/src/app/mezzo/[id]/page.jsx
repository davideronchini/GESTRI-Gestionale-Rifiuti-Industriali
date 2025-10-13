"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuth } from "@/providers/authProvider";
import { useState, use, useRef } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme, Image } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconUser, IconArrowNarrowLeft, IconEdit, IconCheck, IconUpload, IconLock } from "@tabler/icons-react";
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

export default function MezzoDetailPage({ params }) {
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
  const [editedScadenzaRevisione, setEditedScadenzaRevisione] = useState('');
  const [editedScadenzaAssicurazione, setEditedScadenzaAssicurazione] = useState('');
  const [editedStatoMezzo, setEditedStatoMezzo] = useState('');
  const [editedConsumoCarburante, setEditedConsumoCarburante] = useState('');
  const [mezzoImageFile, setMezzoImageFile] = useState(null);
  const [mezzoImagePreview, setMezzoImagePreview] = useState(null);

  // Refs per il file input nascosto
  const mezzoImageInputRef = useRef(null);

  // Possibili stati del mezzo (dal modello Django)
  const STATI_MEZZO_VALIDI = [
    { value: 'DISPONIBILE', label: 'Disponibile' },
    { value: 'OCCUPATO', label: 'Occupato' },
    { value: 'MANUTENZIONE', label: 'In manutenzione' }
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
      setEditedStatoMezzo(mezzo?.statoMezzo || '');
    }
  };

  // Funzione per entrare in modalità editing
  const handleEdit = () => {
    if (mezzo) {
      setEditedTarga(mezzo.targa || '');
      setEditedChilometraggio(mezzo.chilometraggio?.toString() || '');
      setEditedScadenzaRevisione(formatDate(mezzo.scadenzaRevisione));
      setEditedScadenzaAssicurazione(formatDate(mezzo.scadenzaAssicurazione));
      setEditedStatoMezzo(mezzo.statoMezzo || '');
      setEditedConsumoCarburante(mezzo.consumoCarburante?.toString() || '');
      
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

  // Funzione per salvare le modifiche
  const handleSave = async () => {
    try {
      // Prepara il payload per il mezzo
      const mezzoPayload = {
        targa: editedTarga,
        chilometraggio: editedChilometraggio ? parseInt(editedChilometraggio, 10) : 0,
        scadenzaRevisione: convertDateToISO(editedScadenzaRevisione),
        scadenzaAssicurazione: convertDateToISO(editedScadenzaAssicurazione),
        statoMezzo: editedStatoMezzo,
        consumoCarburante: editedConsumoCarburante ? parseFloat(editedConsumoCarburante) : 0.0,
      };

      console.log('Mezzo Payload da inviare:', mezzoPayload);

      // Aggiorna il mezzo
      const updateMezzoRes = await fetch(`/api/mezzi/${id}`, {
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

      // Upload dell'immagine se presente
      if (mezzoImageFile) {
        const formData = new FormData();
        formData.append('immagine', mezzoImageFile);

        const uploadRes = await fetch(`/api/mezzi/${id}/upload-image`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!uploadRes.ok) {
          console.error('Errore durante l\'upload dell\'immagine');
        }
      }

      await mutate(`/api/mezzi/${id}`);
      setIsEditing(false);
      
      // Reset degli stati delle immagini
      setMezzoImageFile(null);
      setMezzoImagePreview(null);
      
      showNotification({
        title: 'Successo',
        message: 'Mezzo aggiornato con successo',
        color: 'green',
      });
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      
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

  // Ottieni lo stato d'autenticazione dal provider prima di iniziare le richieste SWR
  const auth = useAuth();

  const { data: mezzo, error, isLoading } = useSWR(
    auth?.isAuthenticated ? `/api/mezzi/${id}` : null,
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
  console.log('Mezzo data:', mezzo);

  return (
    <RequireRole
                allowedRoles={['STAFF', 'OPERATORE']}
                fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
    <Container size="lg">
      <Box style={{marginTop: '24px'}}>
        <Group justify="space-between" align="center">
          <Group justify="start" align="center">
            <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
            <AppLargeText order={1}>
              Mezzo: {mezzo?.targa || `ID#${id}`}
            </AppLargeText>
            
            {/* Icona di modifica/salvataggio accanto al titolo */}
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

        {/* Contenuto principale - Solo dati del Mezzo */}
        <div style={{ width: '100%' }}>
          {/* Sezione Mezzo con Immagine */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '20px', 
            width: '100%', 
            marginTop: '30px', 
            alignItems: 'flex-start',
            marginBottom: '60px'
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
                key={`targa-${isEditing}-${mezzo?.targa}`}
                id="mezzo-targa" 
                label="Targa" 
                placeholder={!isEditing ? (mezzo?.targa || '--') : '--'} 
                value={isEditing ? editedTarga : ""} 
                editable={isEditing}
                onChange={(e) => setEditedTarga(e.target.value)}
              />
              
              <AppInputField 
                key={`chilometraggio-${isEditing}-${mezzo?.chilometraggio}`}
                id="mezzo-chilometraggio" 
                label="Chilometraggio" 
                placeholder={!isEditing ? (mezzo?.chilometraggio?.toString() || '0') : '0'} 
                value={isEditing ? editedChilometraggio : ""} 
                editable={isEditing}
                onChange={(e) => setEditedChilometraggio(e.target.value)}
              />
              
              <AppInputField 
                key={`consumo-carburante-${isEditing}-${mezzo?.consumoCarburante}`}
                id="mezzo-consumo-carburante" 
                label="Consumo Carburante (L/100km)" 
                placeholder={!isEditing ? (mezzo?.consumoCarburante?.toString() || '0.0') : '0.0'} 
                value={isEditing ? editedConsumoCarburante : ""} 
                editable={isEditing}
                onChange={(e) => setEditedConsumoCarburante(e.target.value)}
              />
              
              <AppInputField 
                key={`scadenza-revisione-${isEditing}-${mezzo?.scadenzaRevisione}`}
                id="mezzo-scadenza-revisione" 
                label="Scadenza Revisione" 
                placeholder={!isEditing ? (formatDate(mezzo?.scadenzaRevisione) || 'dd/MM/yyyy') : 'dd/MM/yyyy'} 
                value={isEditing ? editedScadenzaRevisione : ""} 
                editable={isEditing}
                onChange={(e) => setEditedScadenzaRevisione(e.target.value)}
              />
              
              <AppInputField 
                key={`scadenza-assicurazione-${isEditing}-${mezzo?.scadenzaAssicurazione}`}
                id="mezzo-scadenza-assicurazione" 
                label="Scadenza Assicurazione" 
                placeholder={!isEditing ? (formatDate(mezzo?.scadenzaAssicurazione) || 'dd/MM/yyyy') : 'dd/MM/yyyy'} 
                value={isEditing ? editedScadenzaAssicurazione : ""} 
                editable={isEditing}
                onChange={(e) => setEditedScadenzaAssicurazione(e.target.value)}
              />
              
              <AppInputField 
                key={`stato-mezzo-${isEditing}-${mezzo?.statoMezzo}`}
                id="mezzo-stato" 
                label="Stato Mezzo" 
                placeholder={!isEditing ? (mezzo?.statoMezzo || '--') : '--'} 
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
                src={mezzoImagePreview || (mezzo?.immagine ? `${DJANGO_MEDIA_URL}${mezzo.immagine}` : '/images/login-bg.png')}
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
        </div>
      </Box>
    </Container>
    </RequireRole>
  );
}
