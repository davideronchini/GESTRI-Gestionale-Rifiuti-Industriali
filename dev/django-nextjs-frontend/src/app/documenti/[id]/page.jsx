"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuth } from "@/providers/authProvider";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, Button, ActionIcon, useMantineTheme, useMantineColorScheme, Menu, Avatar } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconArrowNarrowLeft, IconDownload, IconShare3, IconBell, IconSettings, IconUser, IconSun, IconEdit, IconCheck, IconLock, IconUpload } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppLargeText from "@/components/ui/AppLargeText";
import AppNormalText from "@/components/ui/AppNormalText";
import AppInputField from "@/components/ui/AppInputField";
import { DJANGO_BASE_URL, DJANGO_MEDIA_URL } from "@/config/config";
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Select, Text, Divider } from '@mantine/core';
import { Document, Page, pdfjs } from 'react-pdf';
import RequireRole from "@/components/RequireRole";

// Configura il worker di PDF.js (versione compatibile con react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = new Error('Failed to fetch');
    try { err.info = await res.json(); } catch {}
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return json.data || json;
}

export default function DocumentoPage({ params: rawParams }) {
  // Next.js may provide `params` as a Promise in newer versions. Unwrap it
  // with React.use() so we don't access properties on a Promise directly.
  // Keep a fallback for older versions where params is already an object.
  const params = React.use(rawParams || {});
  const id = params?.id || (rawParams && rawParams.id) || null;
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const auth = useAuth();

  // Header editing state to mirror Attività page header behavior
  const [isEditing, setIsEditing] = useState(false);
  const handleEdit = () => setIsEditing(true);
  const handleSave = async () => {
    // Build payload
    const payload = {};

    // Validate and include tipoDocumento if edited
    const TIPO_ALLOWED = ['FIR', 'CORSO_SICUREZZA', 'CORSO_AGGIORNAMENTO', 'ALTRO'];
    if (editedTipoDocumento && editedTipoDocumento.trim() !== '') {
      const t = String(editedTipoDocumento).toUpperCase();
      if (!TIPO_ALLOWED.includes(t)) {
        showNotification({ title: 'Errore', message: `Tipo documento non valido. Valori ammessi: ${TIPO_ALLOWED.join(', ')}`, color: 'red' });
        return;
      }
      payload.tipoDocumento = t;
      // If tipo becomes FIR, remove any operatore association
      if (t === 'FIR') {
        payload.operatore_id = null;
      }
    }

    if (editedDataInserimentoDate && editedDataInserimentoDate.trim() !== '') {
      const parts = editedDataInserimentoDate.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const timeValue = (editedDataInserimentoTime && editedDataInserimentoTime.trim() !== '') ? editedDataInserimentoTime : '00:00';
        payload.dataInserimento = `${year}-${month}-${day}T${timeValue}:00`;
      }
    }

    if (editedDataScadenza && editedDataScadenza.trim() !== '') {
      const parts = editedDataScadenza.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (editedDataScadenzaTime && editedDataScadenzaTime.trim() !== '') {
          // Send full ISO datetime when time is provided so backend can store datetime
          payload.dataScadenza = `${year}-${month}-${day}T${editedDataScadenzaTime}:00`;
        } else {
          payload.dataScadenza = `${year}-${month}-${day}`;
        }
      }
    }

    try {
      if (Object.keys(payload).length > 0) {
        const res = await fetch(`/api/documenti/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('PUT /api/documenti failed', res.status, err);
          showNotification({ title: 'Errore', message: 'Impossibile salvare le modifiche', color: 'red' });
          return;
        }

        await mutate(`/api/documenti/${id}`);
      }

      setIsEditing(false);
      showNotification({ title: 'Salvato', message: 'Modifiche salvate', color: 'green' });
    } catch (e) {
      console.error('Save error', e);
      showNotification({ title: 'Errore', message: 'Errore durante il salvataggio', color: 'red' });
    }
  };
  const handleProfile = () => router.push('/profile');

  const { data: documento, error, isLoading } = useSWR(
    auth?.isAuthenticated ? `/api/documenti/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
    }
  );

  const authGuard = useAuthGuard({ errors: [error] });

  // Editable states for dates so user can type dates manually when editing
  // Declared here (before any early returns) so hooks order is stable across renders
  const [editedDataInserimentoDate, setEditedDataInserimentoDate] = useState('');
  const [editedDataInserimentoTime, setEditedDataInserimentoTime] = useState('');
  // We also keep a separate time field for dataScadenza so the UI always
  // shows a date+time pair (even if backend only stores a date).
  const [editedDataScadenza, setEditedDataScadenza] = useState('');
  const [editedDataScadenzaTime, setEditedDataScadenzaTime] = useState('');
  // Editable tipoDocumento
  const [editedTipoDocumento, setEditedTipoDocumento] = useState('');

  // Modal state for associating operatore
  const [isOperatoreModalOpen, setIsOperatoreModalOpen] = useState(false);
  const [operatoriOptions, setOperatoriOptions] = useState([]);
  const [selectedOperatoreEmail, setSelectedOperatoreEmail] = useState(null);
  const [operatorePlaceholder, setOperatorePlaceholder] = useState('--');

  // Initialize editable states when documento loads
  useEffect(() => {
    if (documento) {
      try { console.debug('[DocumentoPage] documento:', documento); } catch (e) {}
      const dt = documento.dataInserimento ? formatDateTime(documento.dataInserimento) : { date: '', time: '' };
      setEditedDataInserimentoDate(dt.date);
      setEditedDataInserimentoTime(dt.time || '');
      // dataScadenza is a Date (no time) on backend. Initialize date and
      // Initialize scadenza date and time from documento (backend may provide datetime)
      const sc = documento.dataScadenza ? formatDateTime(documento.dataScadenza) : { date: '', time: '' };
      setEditedDataScadenza(sc.date);
      setEditedDataScadenzaTime(sc.time || '');
      setEditedTipoDocumento(documento.tipoDocumento || '');
      // prefer operatore email when available, fallback to operatore_nome if email missing
      setOperatorePlaceholder(documento.operatore_email || documento.operatore_nome || '--');

      // If email is missing but we have an operatore_id, try to fetch users and get the email
      if ((!documento.operatore_email || documento.operatore_email === null) && documento.operatore_id) {
        (async () => {
          try {
            const res = await fetch('/api/utenti/');
            if (!res.ok) return;
            const json = await res.json();
            const data = json.data || json;
            const list = Array.isArray(data) ? data : [];
            const found = list.find(u => String(u.id) === String(documento.operatore_id));
            if (found && found.email) {
              setOperatorePlaceholder(found.email);
            }
          } catch (e) {
            console.error('Could not fetch operatore email by id', e);
          }
        })();
      }
    }
  }, [documento]);

  if (authGuard.isLoading) return <div>Caricamento...</div>;
  if (!authGuard.isAuthenticated || authGuard.redirectInProgress) return null;
  if (isLoading) return <div>Caricamento documento...</div>;
  if (error || !documento) {
    return (
      <Container size="lg" style={{ paddingTop: '2rem' }}>
        <AppLargeText style={{ color: theme.colors.red[6] }}>Documento non trovato</AppLargeText>
      </Container>
    );
  }

  const tipo = documento?.tipoDocumento || '-';
  const dataInserimento = documento?.dataInserimento || null;
  const dataScadenza = documento?.dataScadenza || null;
  // Show operatore email in the field placeholder (operatorePlaceholder initialized from documento)
  const operatoreNome = operatorePlaceholder || '--';

  // Helper per costruire un URL file robusto
  const makeFileUrl = (filePath) => {
    if (!filePath) return null;
    // Se è già un URL assoluto, usalo così com'è
    if (/^https?:\/\//i.test(filePath)) return filePath;
    // Rimuovi eventuale prefisso "media/" o slash iniziale
    const cleaned = filePath.replace(/^\/?media\//, '').replace(/^\//, '');
    // Determine backend base URL; prefer configured DJANGO_BASE_URL if it's absolute,
    // otherwise fallback to a sensible default used in this project.
    const defaultBackend = 'http://127.0.0.1:8001';
    const backendBase = (DJANGO_BASE_URL && /^https?:\/\//i.test(DJANGO_BASE_URL)) ? DJANGO_BASE_URL : defaultBackend;
    // Rimuovi eventuale slash finale per non duplicare
    const normalizedBase = backendBase.replace(/\/$/, '');
    return `${normalizedBase}/media/${cleaned}`;
  };

  // Costruisci URL preview: gestiamo tre casi:
  // 1) se documento.file_url è un URL assoluto lo usiamo così com'è
  // 2) se documento.file_url è relativo (/media/...) lo convertiamo con makeFileUrl
  // 3) altrimenti proviamo documento.file
  let rawFile = null;
  if (documento?.file_url) {
    if (/^https?:\/\//i.test(documento.file_url)) {
      rawFile = documento.file_url;
    } else {
      rawFile = makeFileUrl(documento.file_url);
    }
  }
  if (!rawFile && documento?.file) {
    rawFile = makeFileUrl(documento.file);
  }
  // Debug: mostra quale URL è stato scelto per la preview (utile in dev)
  try { console.debug('[DocumentoPage] preview rawFile:', rawFile); } catch (e) {}
  // Show FIR preview image only if there is no file and the document type is FIR.
  const isFirTipo = ((documento?.tipoDocumento || '') + '').toUpperCase() === 'FIR';
  const previewSrc = rawFile ? rawFile : (isFirTipo ? "/images/FIR-preview.png" : null);
  const isPdf = typeof previewSrc === 'string' && (previewSrc.toLowerCase().endsWith('.pdf') || previewSrc.toLowerCase().includes('.pdf?'));

  function formatDate(value, withTime = false) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('it-IT', withTime ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Split a datetime into localized date/time strings (dd/MM/yyyy and HH:mm)
  function formatDateTime(value) {
    if (!value) return { date: '', time: '' };
    const d = new Date(value);
    const date = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  }

  const handleOpenFull = () => {
    if (rawFile) window.open(rawFile, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    if (!rawFile) return;
    const a = document.createElement('a');
    a.href = rawFile;
    a.download = rawFile.split('/').pop() || `documento-${id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!rawFile) return;
    const shareData = {
      title: `Documento #${id}`,
      text: tipo ? `Tipo: ${tipo}` : 'Documento',
      url: rawFile,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      // se l'utente annulla, prosegui col fallback
    }

    try {
      await navigator.clipboard.writeText(rawFile);
      // opzionalmente potremmo mostrare una notifica se disponibile
      // ma evitiamo dipendenze qui
    } catch (e) {
      // ultimo fallback: apri in nuova scheda
      window.open(rawFile, '_blank', 'noopener,noreferrer');
    }
  };

  // Allow picking a new file when in edit mode. Parent will upload the file.
  const handlePickFileForEdit = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const formData = new FormData();
        formData.append('file', f);
        // upload proxy's PUT expects documento_id
        formData.append('documento_id', String(id));

        showNotification({ title: 'Upload', message: 'Caricamento file in corso...', color: 'blue' });

        const res = await fetch('/api/documenti/upload', {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('PUT /api/documenti/upload failed', res.status, err);
          showNotification({ title: 'Errore', message: err?.error || 'Errore upload file', color: 'red' });
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (data && data.error) {
          showNotification({ title: 'Errore', message: String(data.error), color: 'red' });
          return;
        }

        // Refresh documento data
        await mutate(`/api/documenti/${id}`);
        showNotification({ title: 'Successo', message: 'File aggiornato', color: 'green' });
      } catch (e) {
        console.error('upload file error', e);
        showNotification({ title: 'Errore', message: 'Errore durante upload file', color: 'red' });
      }
    };
    input.click();
  };

  // Fetch operatori when opening modal (client side)
  const fetchOperatori = async () => {
    try {
      const res = await fetch('/api/utenti/');
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;
  // Filter only OPERATORE role
  const ops = (Array.isArray(data) ? data : []).filter(u => String(u.ruolo).toUpperCase() === 'OPERATORE');
  // Use email as both value and label so modal shows emails
  setOperatoriOptions(ops.map(o => ({ value: String(o.email || o.id), label: String(o.email || `#${o.id}`), email: o.email })));
    } catch (e) {
      console.error('fetchOperatori error', e);
    }
  };

  const openOperatoreModal = async () => {
    // Allow opening modal only when tipo is NOT FIR
    const isFir = ((editedTipoDocumento || tipo) || '').toUpperCase() === 'FIR';
    if (isFir) {
      showNotification({ title: 'Operazione non permessa', message: "L'associazione non è disponibile per documenti di tipo 'FIR'", color: 'yellow' });
      return;
    }

    await fetchOperatori();
    // Preselect current operatore email if any
    setSelectedOperatoreEmail(documento?.operatore_email ? String(documento.operatore_email) : null);
    setIsOperatoreModalOpen(true);
  };

  const handleAssociateOperatore = async () => {
    if (!selectedOperatoreEmail) {
      showNotification({ title: 'Errore', message: 'Seleziona un operatore', color: 'red' });
      return;
    }

    try {
      // Send operatore_email to backend (associate by email)
      const res = await fetch(`/api/documenti/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatore_email: String(selectedOperatoreEmail) })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotification({ title: 'Errore', message: err?.error || 'Impossibile associare operatore', color: 'red' });
        return;
      }

      await mutate(`/api/documenti/${id}`);
      setIsOperatoreModalOpen(false);
      // Update placeholder with selected email
      setOperatorePlaceholder(String(selectedOperatoreEmail));
      showNotification({ title: 'Associato', message: 'Operatore associato correttamente', color: 'green' });
    } catch (e) {
      console.error('associate operatore error', e);
      showNotification({ title: 'Errore', message: 'Errore nella richiesta', color: 'red' });
    }
  };

  return (
    <Container size="lg" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
      <RequireRole
            allowedRoles={['STAFF', 'OPERATORE']}
            fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
       {/* Header con titolo e profilo */}
            {/* Header con titolo e profilo */}
    <Box style={{marginTop: '24px'}}>
      <Group justify="space-between" align="center">
                <Group justify="start" align="center">
                  <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
                  <AppLargeText order={1}>
                    Documento: ID#{id}
                  </AppLargeText>
                  
                  <RequireRole
            allowedRoles={['STAFF']}>
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
              </Box>

      {/* Campi informativi */}
      {/* Row 1: Data inserimento (date + time) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', marginTop: '30px' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-data-inserimento-date"
            label="Data inserimento (gg/MM/YYYY)"
            placeholder={formatDate(dataInserimento, false) || 'gg/MM/YYYY'}
            value={editedDataInserimentoDate || (isEditing ? '' : (formatDate(dataInserimento, false) || ''))}
            editable={isEditing}
            onChange={(e) => setEditedDataInserimentoDate(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-data-inserimento-time"
            label="Ora inserimento (hh:mm)"
            placeholder={formatDate(dataInserimento, true).split(' ')[1] || 'hh:mm'}
            value={editedDataInserimentoTime || (isEditing ? '' : (formatDate(dataInserimento, true).split(' ')[1] || ''))}
            editable={isEditing}
            onChange={(e) => setEditedDataInserimentoTime(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Data scadenza (date + time) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-data-scadenza-date"
            label="Data scadenza (gg/MM/YYYY)"
            placeholder={formatDateTime(dataScadenza).date || 'gg/MM/YYYY'}
            value={editedDataScadenza || (isEditing ? '' : (formatDateTime(dataScadenza).date || ''))}
            editable={isEditing}
            onChange={(e) => setEditedDataScadenza(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-data-scadenza-time"
            label="Ora scadenza (hh:mm)"
            placeholder={formatDateTime(dataScadenza).time || 'hh:mm'}
            value={editedDataScadenzaTime || (isEditing ? '' : (formatDateTime(dataScadenza).time || ''))}
            editable={isEditing}
            onChange={(e) => setEditedDataScadenzaTime(e.target.value)}
          />
        </div>
      </div>

      {/* Row 3: Tipo documento | Operatore (single pair) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-tipo-documento"
            label="Tipo documento"
            placeholder={tipo || '--'}
            value={isEditing ? editedTipoDocumento : (tipo || '')}
            editable={isEditing}
            onChange={(e) => setEditedTipoDocumento((e.target.value || '').toUpperCase())}
            onClick={() => { if (isEditing) showNotification({ title: 'Valori tipo documento', message: 'Valori ammessi: FIR, CORSO_SICUREZZA, CORSO_AGGIORNAMENTO, ALTRO', color: 'blue' }); }}
          />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-operatore"
            label="Operatore"
            placeholder={operatorePlaceholder}
            // When not editing, show the associated operatore email as the value so it's visible
            value={isEditing ? '' : (documento?.operatore_email || '')}
            editable={false}
            onClick={(e) => {
              if (!isEditing) return;
              const isFirClick = (((editedTipoDocumento || tipo) || '').toUpperCase() === 'FIR');
              // If document type is FIR, block association
              if (isFirClick) {
                showNotification({ title: 'Operazione non permessa', message: "L'associazione non è disponibile per documenti di tipo 'FIR'", color: 'yellow' });
                return;
              }
              openOperatoreModal();
            }}
            style={{ cursor: isEditing ? 'pointer' : 'default' }}
          />
        </div>
      </div>

      {/* Modal per associare/dissociare operatore */}
      <Modal
        opened={isOperatoreModalOpen}
        onClose={() => setIsOperatoreModalOpen(false)}
        title={`Associa operatore al documento #${id}`}
        size="lg"
      >
        <Text size="sm" color="dimmed">Seleziona un operatore tra quelli disponibili. Nota: la selezione avviene via email (verrà associata la mail dell'operatore).</Text>
        <Divider my="sm" />
        <Select
          label="Operatore"
          placeholder="Seleziona operatore"
          data={operatoriOptions}
          value={selectedOperatoreEmail}
          onChange={(v) => setSelectedOperatoreEmail(v)}
          searchable
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="default" onClick={() => setIsOperatoreModalOpen(false)}>Annulla</Button>
          <Button onClick={handleAssociateOperatore}>Salva</Button>
        </div>
      </Modal>

      {/* Preview full-width con bordi stondati e icone circolari */}
      <Box style={{ marginTop: 20 }}>
        <PreviewBox
          src={previewSrc}
          isPdf={isPdf}
          // If we're editing, clicking should open the file picker to replace the file
          onOpen={isEditing ? handlePickFileForEdit : handleOpenFull}
          onShare={handleShare}
          onDownload={handleDownload}
          colorScheme={colorScheme}
          theme={theme}
          // let the preview know if we're in edit mode and whether a file exists
          isEditing={isEditing}
          hasFile={!!rawFile}
        />
      </Box>
         </RequireRole>
    </Container>
  );
}

// Componente preview inline, full-width, prima pagina PDF o immagine
function PreviewBox({ src, isPdf, onOpen, onShare, onDownload, colorScheme, theme, isEditing = false, hasFile = false }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      ro.disconnect();
    };
  }, []);

  useEffect(() => setPdfError(false), [src]);

  const overlayBg = colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)';
  const iconColor = colorScheme === 'dark'
    ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
    : (theme.other?.components?.appIcon?.light?.color || 'rgba(44,44,44,1)');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        cursor: src ? 'pointer' : 'default'
      }}
      onClick={() => src && onOpen && onOpen()}
    >
      {/* Overlay azioni in alto a destra */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
        {src && (
          <ActionIcon variant="filled" radius="xl" size={38} style={{ background: overlayBg }} onClick={onShare}>
            <IconShare3 size={18} color={iconColor} />
          </ActionIcon>
        )}
        {src && (
          <ActionIcon variant="filled" radius="xl" size={38} style={{ background: overlayBg }} onClick={onDownload}>
            <IconDownload size={18} color={iconColor} />
          </ActionIcon>
        )}
      </div>

      {/* Contenuto preview */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(isEditing && !hasFile) ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.colors.gray[6], width: '100%' }} onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160, borderRadius: 12, margin: '0 auto' }}>
              <IconUpload size={48} color={iconColor} />
            </div>
            <div style={{ marginTop: 16, fontSize: 16 }}>Carica un nuovo file</div>
            <div style={{ marginTop: 8, color: theme.colors.gray[5] }}>Clicca per selezionare un file (PDF/JPG/PNG)</div>
          </div>
        ) : isPdf && src && !pdfError ? (
          <Document
            file={src}
            onLoadError={() => setPdfError(true)}
            loading={<div style={{ padding: 24, color: theme.colors.gray[6] }}>Caricamento anteprima…</div>}
          >
            <Page
              pageNumber={1}
              width={Math.max(320, width)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : src && !isPdf ? (
          <img
            src={src}
            alt="Anteprima documento"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => { e.currentTarget.src = "/images/FIR-preview.png"; }}
          />
        ) : (
          <div style={{ padding: 40, color: theme.colors.gray[6], width: '100%', textAlign: 'center' }}>
            {isEditing ? (
              <div onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160, borderRadius: 12, margin: '0 auto' }}>
                  <IconUpload size={48} color={iconColor} />
                </div>
                <div style={{ marginTop: 16, fontSize: 16 }}>Carica un nuovo file</div>
                <div style={{ marginTop: 8, color: theme.colors.gray[5] }}>Clicca per selezionare un file (PDF/JPG/PNG)</div>
              </div>
            ) : (
              <div>Anteprima non disponibile</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
