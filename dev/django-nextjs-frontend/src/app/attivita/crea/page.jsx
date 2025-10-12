"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState } from "react";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme, Modal, TextInput, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconUser, IconArrowNarrowLeft, IconCheck, IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppInputField from '@/components/ui/AppInputField';
import MezzoCard from '@/components/ui/MezzoCard';
import UtenteCard from '@/components/ui/UtenteCard';
import RequireRole from "@/components/RequireRole";

export default function CreaAttivitaPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  // Responsive layout: le liste passano in verticale sotto i 1050px
  const isMobile = useMediaQuery('(max-width: 1050px)', false, { getInitialValueInEffect: true });

  // Stati per i campi della nuova attività (tutti modificabili)
  const [titolo, setTitolo] = useState('');
  const [codiceCer, setCodiceCer] = useState('');
  const [data, setData] = useState('');
  const [orario, setOrario] = useState('');
  const [luogo, setLuogo] = useState('');
  const [stato, setStato] = useState('PROGRAMMATA'); // Valore di default
  const [durata, setDurata] = useState('');
  const [descrizione, setDescrizione] = useState('');

  // Stati per la gestione del documento
  const [selectedFile, setSelectedFile] = useState(null);

  // Stati per mezzo associato
  const [mezzoAssociato, setMezzoAssociato] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mezziDisponibili, setMezziDisponibili] = useState([]);

  // Stati per operatori associati
  const [operatoriAssociati, setOperatoriAssociati] = useState([]);
  const [isOperatoreModalOpen, setIsOperatoreModalOpen] = useState(false);
  const [operatoreSearchQuery, setOperatoreSearchQuery] = useState('');
  const [operatoriDisponibili, setOperatoriDisponibili] = useState([]);

  // Stati per tracciare errori API per il redirect
  const [apiErrors, setApiErrors] = useState([]);

  // Possibili stati dell'attività
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
    const statiMessage = STATI_VALIDI.map(s => `${s.value}`).join(', ');
    showNotification({
      title: 'Stati disponibili',
      message: `Gli stati possibili sono: ${statiMessage}`,
      color: 'blue',
      autoClose: 8000,
    });
  };

  // Funzione per validare lo stato inserito
  const validateStato = (statoValue) => {
    if (!statoValue || statoValue.trim() === '') {
      return false;
    }
    
    const statoUpper = statoValue.trim().toUpperCase();
    return STATI_VALIDI.some(s => s.value === statoUpper);
  };

  // Funzione per gestire il cambio del campo stato
  const handleStatoChange = (e) => {
    setStato(e.target.value);
  };

  // Funzione per validare lo stato quando l'utente finisce di modificare
  const handleStatoBlur = () => {
    if (!stato || stato.trim() === '') {
      return;
    }
    
    if (validateStato(stato)) {
      setStato(stato.trim().toUpperCase());
    } else {
      showNotification({
        title: 'Stato non valido',
        message: `Lo stato "${stato}" non è valido. Stati possibili: ${STATI_VALIDI.map(s => s.value).join(', ')}. Ripristinato a PROGRAMMATA.`,
        color: 'yellow',
        autoClose: 5000,
      });
      setStato('PROGRAMMATA');
    }
  };

  // Funzione per gestire il click sul campo documento
  const handleDocumentoClick = () => {
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
  };

  // Funzione per ottenere il placeholder del campo documento
  const getDocumentoPlaceholder = () => {
    return selectedFile ? selectedFile.name : 'Carica file';
  };

  // Funzione per creare la nuova attività
  const handleCreate = async () => {
    try {
      // Validazione campi obbligatori
      if (!titolo || titolo.trim() === '') {
        showNotification({
          title: 'Errore',
          message: 'Il titolo è obbligatorio',
          color: 'red',
        });
        return;
      }

      // Costruisci la data completa
      let fullDateTime = null;
      if (data) {
        // Se c'è la data, usa l'orario fornito o default a 00:00
        const [day, month, year] = data.split('/');
        const timeValue = orario || '00:00';
        // Usa il formato ISO locale senza conversione UTC per evitare problemi di fuso orario
        fullDateTime = `${year}-${month}-${day}T${timeValue}:00`;
      }

      const createPayload = {
        titolo: titolo,
        codiceCer: codiceCer || null,
        data: fullDateTime,
        luogo: luogo || null,
        statoAttivita: stato,
        durata: durata ? parseInt(durata, 10) : null,
        descrizione: descrizione || null,
        mezzo_rimorchio_id: mezzoAssociato?.id || null,
        utenti_assegnati_ids: operatoriAssociati.map(op => op.id)
      };

      console.log('Creating new activity with payload:', createPayload);

      const res = await fetch('/api/attivita/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload)
      });

      if (!res.ok) {
        // Gestisci errori 401 per il redirect
        if (res.status === 401) {
          const error = new Error('Non autenticato');
          error.status = 401;
          setApiErrors([error]);
          return;
        }
        
        const errorData = await res.json();
        throw new Error(errorData.error || 'Errore durante la creazione');
      }

      const nuovaAttivita = await res.json();
      console.log('Activity created successfully:', nuovaAttivita);

      // Gestisci l'upload del documento se è stato selezionato un file
      if (selectedFile && nuovaAttivita.id) {
        await handleUploadDocumento(nuovaAttivita.id);
      }

      showNotification({
        title: 'Successo',
        message: 'Attività creata con successo',
        color: 'green',
      });

      // Reindirizza alla pagina della nuova attività
      router.push(`/attivita/${nuovaAttivita.id}`);
      
    } catch (error) {
      console.error('Errore durante la creazione:', error);
      showNotification({
        title: 'Errore',
        message: error.message || 'Impossibile creare l\'attività',
        color: 'red',
      });
    }
  };

  // Funzione per l'upload del documento
  const handleUploadDocumento = async (attivitaId) => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('attivita_id', attivitaId);

      const res = await fetch('/api/documenti/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Errore durante l\'upload del documento');
      }

      console.log('Document uploaded successfully');
      
    } catch (error) {
      console.error('Errore upload documento:', error);
      showNotification({
        title: 'Avviso',
        message: 'Attività creata ma errore nell\'upload del documento',
        color: 'yellow',
      });
    }
  };

  // Funzione per aprire il modale e caricare i mezzi disponibili
  const handleOpenMezzoModal = async () => {
    setIsModalOpen(true);
    setSearchQuery('');
    
    try {
      const res = await fetch('/api/mezzo-rimorchio/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.status === 401) {
        const error = new Error('Non autenticato');
        error.status = 401;
        setApiErrors([error]);
        setIsModalOpen(false);
        return;
      }

      if (res.ok) {
        const response = await res.json();
        const mezzi = response.data || response;
        setMezziDisponibili(Array.isArray(mezzi) ? mezzi : []);
      } else {
        setMezziDisponibili([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei mezzi:', error);
      setMezziDisponibili([]);
    }
  };

  // Funzione per associare un mezzo
  const handleAssociaMezzo = (mezzo) => {
    setMezzoAssociato(mezzo);
    setIsModalOpen(false);
    showNotification({
      title: 'Mezzo associato',
      message: `Mezzo ${mezzo.mezzo?.targa || 'N/A'} associato con successo`,
      color: 'green',
    });
  };

  // Funzione per rimuovere il mezzo associato
  const handleRimuoviMezzo = () => {
    setMezzoAssociato(null);
    showNotification({
      title: 'Mezzo rimosso',
      message: 'Mezzo rimosso dall\'attività',
      color: 'blue',
    });
  };

  // Funzione per aprire il modale operatori
  const handleOpenOperatoreModal = async () => {
    setIsOperatoreModalOpen(true);
    setOperatoreSearchQuery('');
    
    try {
      const res = await fetch('/api/utente/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.status === 401) {
        const error = new Error('Non autenticato');
        error.status = 401;
        setApiErrors([error]);
        setIsOperatoreModalOpen(false);
        return;
      }

      if (res.ok) {
        const response = await res.json();
        const utenti = response.data || response;
        // Filtra solo gli operatori
        const operatori = Array.isArray(utenti) ? utenti.filter(u => u.ruolo === 'OPERATORE') : [];
        setOperatoriDisponibili(operatori);
      } else {
        setOperatoriDisponibili([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento degli operatori:', error);
      setOperatoriDisponibili([]);
    }
  };

  // Funzione per associare un operatore
  const handleAssociaOperatore = (operatore) => {
    if (operatoriAssociati.find(op => op.id === operatore.id)) {
      showNotification({
        title: 'Attenzione',
        message: 'Operatore già associato',
        color: 'yellow',
      });
      return;
    }

    setOperatoriAssociati([...operatoriAssociati, operatore]);
    setIsOperatoreModalOpen(false);
    showNotification({
      title: 'Operatore associato',
      message: `${operatore.nome} ${operatore.cognome} associato con successo`,
      color: 'green',
    });
  };

  // Funzione per rimuovere un operatore
  const handleRimuoviOperatore = (operatoreId) => {
    setOperatoriAssociati(operatoriAssociati.filter(op => op.id !== operatoreId));
    showNotification({
      title: 'Operatore rimosso',
      message: 'Operatore rimosso dall\'attività',
      color: 'blue',
    });
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

  // Usa il nuovo hook per gestire l'autenticazione
  const authGuard = useAuthGuard({
    errors: apiErrors
  });

  // Mostra loading mentre l'auth si inizializza
  if (authGuard.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se non autenticato, non mostrare nulla (il redirect è in corso)
  if (!authGuard.isAuthenticated) {
    return null;
  }

  return (
    <RequireRole
            allowedRoles={['STAFF', 'CLIENTE']}
            fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
      {/* Modale per associare mezzo */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Seleziona Mezzo"
        size="lg"
      >
        <TextInput
          placeholder="Cerca mezzo per targa o tipo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />
        <ScrollArea style={{ height: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getMezziFiltrati().length > 0 ? (
              getMezziFiltrati().map((item) => (
                <MezzoCard 
                  key={item.id}
                  id={item.id}
                  targa={item.mezzo?.targa || 'N/A'}
                  tipo={item.rimorchio?.tipoRimorchio || 'N/A'}
                  onClick={() => handleAssociaMezzo(item)}
                  style={{ cursor: 'pointer' }}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: theme.colors.gray[6] }}>
                Nessun mezzo disponibile
              </div>
            )}
          </div>
        </ScrollArea>
      </Modal>

      {/* Modale per associare operatore */}
      <Modal
        opened={isOperatoreModalOpen}
        onClose={() => setIsOperatoreModalOpen(false)}
        title="Seleziona Operatore"
        size="lg"
      >
        <TextInput
          placeholder="Cerca operatore per nome o email..."
          value={operatoreSearchQuery}
          onChange={(e) => setOperatoreSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />
        <ScrollArea style={{ height: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getOperatoriFiltrati().length > 0 ? (
              getOperatoriFiltrati().map((operatore) => (
                <UtenteCard
                  key={operatore.id}
                  id={operatore.id}
                  nome={operatore.nome}
                  cognome={operatore.cognome}
                  email={operatore.email}
                  ruolo={operatore.ruolo}
                  onClick={() => handleAssociaOperatore(operatore)}
                  style={{ cursor: 'pointer' }}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: theme.colors.gray[6] }}>
                Nessun operatore disponibile
              </div>
            )}
          </div>
        </ScrollArea>
      </Modal>

      <Container size="lg">
        {/* Header con titolo e icona di salvataggio */}
        <Box style={{marginTop: '24px'}}>
          <Group justify="space-between" align="center">
            <Group justify="start" align="center">
              <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
              <AppLargeText order={1}>
                Nuova Attività
              </AppLargeText>
              
              {/* Icona di salvataggio/creazione */}
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
                onClick={handleCreate}
              />
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

          {/* Campi input */}
          <div style={{ width: '100%' }}>
            {/* Prima riga: Titolo e Codice CER */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '30px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-titolo" 
                  label="Titolo" 
                  placeholder="Inserisci titolo" 
                  value={titolo} 
                  editable={true}
                  onChange={(e) => setTitolo(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-cer" 
                  label="Codice CER" 
                  placeholder="XX XX XX" 
                  value={codiceCer} 
                  editable={true}
                  onChange={(e) => setCodiceCer(e.target.value)}
                />
              </div>
            </div>

            {/* Seconda riga: Data e Orario */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-data" 
                  label="Data" 
                  placeholder="dd/MM/yyyy" 
                  value={data} 
                  editable={true}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-orario" 
                  label="Orario" 
                  placeholder="HH:MM" 
                  value={orario} 
                  editable={true}
                  onChange={(e) => setOrario(e.target.value)}
                />
              </div>
            </div>

            {/* Terza riga: Luogo e Stato */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-luogo" 
                  label="Luogo" 
                  placeholder="Inserisci luogo" 
                  value={luogo} 
                  editable={true}
                  onChange={(e) => setLuogo(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-stato" 
                  label="Stato" 
                  placeholder="PROGRAMMATA" 
                  value={stato} 
                  editable={true}
                  onChange={handleStatoChange}
                  onBlur={handleStatoBlur}
                  onClick={handleStatoClick}
                />
              </div>
            </div>

            {/* Quarta riga: Durata e Documento */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField 
                  id="attivita-durata" 
                  label="Durata (minuti)" 
                  placeholder="Es: 120" 
                  value={durata} 
                  editable={true}
                  onChange={(e) => setDurata(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <RequireRole allowedRoles={['STAFF']}>
                  <AppInputField 
                    id="attivita-documento" 
                    label="Documento" 
                    placeholder={getDocumentoPlaceholder()}
                    value=""
                    editable={false}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: 'rgba(0, 123, 255, 0.1)'
                    }}
                    onClick={handleDocumentoClick}
                  />
                </RequireRole>
              </div>
            </div>

            {/* Descrizione con titolo esterno */}
            <AppLargeText style={{marginTop: '80px', fontSize: '18px', fontWeight: '600'}}>Descrizione</AppLargeText>
            <div style={{ display: 'flex', width: '100%', marginTop: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppInputField
                  id="attivita-descrizione"
                  label="Descrizione"
                  placeholder="Inserisci descrizione"
                  hideFloatingLabel={true}
                  placeholderLeft={true}
                  value={descrizione}
                  editable={true}
                  onChange={(e) => setDescrizione(e.target.value)}
                />
              </div>
            </div>
          </div>

          <RequireRole allowedRoles={['STAFF']}>
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
              <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
                <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Mezzo associato</AppLargeText>
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
              </Group>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
                {mezzoAssociato ? (
                  <MezzoCard 
                    id={mezzoAssociato.id}
                    targa={mezzoAssociato.mezzo?.targa || 'N/A'}
                    tipo={mezzoAssociato.rimorchio?.tipoRimorchio || 'N/A'}
                    onRemove={handleRimuoviMezzo}
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
                <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Operatori assegnati</AppLargeText>
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
              </Group>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
                {operatoriAssociati.length > 0 ? (
                  operatoriAssociati.map((operatore) => (
                    <UtenteCard
                      key={operatore.id}
                      id={operatore.id}
                      nome={operatore.nome}
                      cognome={operatore.cognome}
                      email={operatore.email}
                      ruolo={operatore.ruolo}
                      onRemove={() => handleRimuoviOperatore(operatore.id)}
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
        </Box>
      </Container>
    </RequireRole>
  );
}
