"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Box, Group, useMantineTheme, useMantineColorScheme, Menu, Avatar, ActionIcon, Modal, Select, Text, Divider } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import AppLargeText from '@/components/ui/AppLargeText';
import AppNormalText from '@/components/ui/AppNormalText';
import AppInputField from '@/components/ui/AppInputField';
import { IconArrowNarrowLeft, IconCheck, IconBell, IconUser, IconSettings, IconSun, IconLock, IconShare3, IconDownload, IconUpload } from '@tabler/icons-react';
import { Document, Page, pdfjs } from 'react-pdf';
import RequireRole from "@/components/RequireRole";

// Configura il worker di PDF.js (versione compatibile con react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

export default function CreaDocumentoPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Valori consentiti dal backend (Documento.TipoDocumento)
  const TIPO_DOCUMENTO_OPTIONS = [
    { value: 'FIR', label: 'FIR' },
    { value: 'CORSO_SICUREZZA', label: 'CORSO_SICUREZZA' },
    { value: 'CORSO_AGGIORNAMENTO', label: "CORSO_AGGIORNAMENTO" },
    { value: 'ALTRO', label: 'ALTRO' },
  ];

  const [tipoDocumento, setTipoDocumento] = useState('ALTRO');
  const [file, setFile] = useState(null);
  const [dataScadenza, setDataScadenza] = useState(''); // yyyy-MM-dd (native date input)
  const [dataScadenzaDate, setDataScadenzaDate] = useState(''); // yyyy-MM-dd
  const [dataScadenzaTime, setDataScadenzaTime] = useState(''); // HH:mm
  const [objectUrl, setObjectUrl] = useState(null);

  const authGuard = useAuthGuard();
  // Rely on useAuthGuard internal redirect handling and use the early-return below
  // Operatore selection state (per la creazione)
  const [isOperatoreModalOpen, setIsOperatoreModalOpen] = useState(false);
  const [operatoriOptions, setOperatoriOptions] = useState([]);
  const [selectedOperatoreEmail, setSelectedOperatoreEmail] = useState(null);

  const handleFilePick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      if (f) {
        // assegna il file scelto e forziamo il reset dell'anteprima precedente
        setFile(f);
      }
    };
    input.click();
  };

  // Gestione object URL per anteprima locale
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
    }
  }, [file]);

  const isPdf = useMemo(() => {
    // Se abbiamo un file locale, preferiamo usare il mime-type
    if (file) {
      const t = (file.type || '').toLowerCase();
      if (t === 'application/pdf') return true;
      // fall back al nome file
      const name = (file.name || '').toLowerCase();
      return name.endsWith('.pdf');
    }
    // Se non abbiamo file ma abbiamo un objectUrl possiamo provare a inferire
    if (objectUrl) {
      try {
        const u = String(objectUrl).toLowerCase();
        return u.includes('.pdf');
      } catch (e) {
        return false;
      }
    }
    return false;
  }, [file, objectUrl]);

  const formatDate = (value, withTime = false) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('it-IT', withTime ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleOpenFull = () => {
    // In creazione, aprire il file picker quando si clicca sulla preview
    handleFilePick();
  };

  const handleDownload = () => {
    const url = objectUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    // se abbiamo il file locale usiamo il suo nome, altrimenti una fallback
    a.download = (file && file.name) ? file.name : `nuovo-documento`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!objectUrl) return;
    const shareData = {
      title: `Nuovo Documento`,
      text: tipoDocumento ? `Tipo: ${tipoDocumento}` : 'Documento',
      url: objectUrl,
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
      await navigator.clipboard.writeText(objectUrl);
    } catch (e) {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCreate = async () => {
    try {
      // Nota: il file è opzionale in fase di creazione; non blocchiamo se manca
      if (!tipoDocumento) {
        showNotification({ title: 'Errore', message: 'Seleziona il tipo documento', color: 'red' });
        return;
      }

      // Valida tipoDocumento rispetto agli enum del backend
      const isValidTipo = TIPO_DOCUMENTO_OPTIONS.some(t => t.value === String(tipoDocumento).toUpperCase());
      if (!isValidTipo) {
        showNotification({ title: 'Errore', message: `Tipo documento non valido. Valori ammessi: ${TIPO_DOCUMENTO_OPTIONS.map(o => o.value).join(', ')}`, color: 'red' });
        return;
      }

      const normalizedTipo = String(tipoDocumento).toUpperCase();

      // Helper: converti dd/MM/YYYY o yyyy-MM-dd in ISO (yyyy-mm-dd)
      const normalizeDateInput = (v) => {
        if (!v) return null;
        // se ha slash: consideriamo dd/MM/YYYY
        if (v.includes('/')) {
          const parts = v.split('/').map(p => p.trim());
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
          }
        }
        // se è già yyyy-mm-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        return null;
      };

      // Normalizziamo la data (se fornita) prima di scegliere il ramo di invio
      const normalizedDate = normalizeDateInput(dataScadenzaDate);

      // Se abbiamo un file, usiamo l'endpoint di upload che accetta multipart/form-data
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipoDocumento', normalizedTipo);

        // Se dataScadenza è presente la aggiungiamo come datetime; se manca l'ora settiamo 00:00
        if (normalizedDate) {
          const timePart = dataScadenzaTime && dataScadenzaTime.trim() !== '' ? dataScadenzaTime : '00:00';
          formData.append('dataScadenza', `${normalizedDate}T${timePart}:00`);
        }

        // Se è stato selezionato un operatore e il tipo documento NON è FIR, lo includiamo
        if (selectedOperatoreEmail && normalizedTipo !== 'FIR') {
          formData.append('operatore_email', String(selectedOperatoreEmail));
        }

        const res = await fetch('/api/documenti/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Errore creazione documento (upload)');
        }

        const doc = await res.json();
        console.debug('POST /api/documenti/upload response:', doc);
        // Se il proxy o il backend rispondono con un body che contiene 'error', trattiamo come errore
        if (doc && doc.error) {
          showNotification({ title: 'Errore', message: String(doc.error || 'Errore lato server'), color: 'red' });
          return;
        }
        showNotification({ title: 'Successo', message: 'Documento creato', color: 'green' });
        if (!doc || !doc.id) {
          showNotification({ title: 'Attenzione', message: 'Risposta server ricevuta ma documento non contiene id. Verifica backend.', color: 'yellow' });
        }
        router.push('/documenti');
        return;
      }

      // Se non abbiamo file, inviamo JSON semplice al proxy /api/documenti/
      const payload = { tipoDocumento: normalizedTipo };
      if (normalizedDate) {
        const timePart = dataScadenzaTime && dataScadenzaTime.trim() !== '' ? dataScadenzaTime : '00:00';
        payload.dataScadenza = `${normalizedDate}T${timePart}:00`;
      }
      if (selectedOperatoreEmail && normalizedTipo !== 'FIR') payload.operatore_email = String(selectedOperatoreEmail);

      const res = await fetch('/api/documenti/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Errore creazione documento');
      }

      const doc = await res.json();
      console.debug('POST /api/documenti/ response:', doc);
      if (doc && doc.error) {
        showNotification({ title: 'Errore', message: String(doc.error || 'Errore lato server'), color: 'red' });
        return;
      }
      showNotification({ title: 'Successo', message: 'Documento creato', color: 'green' });
      if (!doc || !doc.id) {
        showNotification({ title: 'Attenzione', message: 'Risposta server ricevuta ma documento non contiene id. Verifica backend.', color: 'yellow' });
      }
      router.push('/documenti');
    } catch (error) {
      showNotification({ title: 'Errore', message: error?.message || 'Creazione fallita', color: 'red' });
    }
  };

  if (authGuard.isLoading) return <div>Caricamento...</div>;
  if (!authGuard.isAuthenticated || authGuard.redirectInProgress) return null;

  return (
    <Container size="lg" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
      <RequireRole
                  allowedRoles={['STAFF']}
                  fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
      {/* Header identico alla pagina di dettaglio */}
      <Box style={{marginTop: '24px'}}>
        <Group justify="space-between" align="center">
          <Group justify="start" align="center">
            <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
            <AppLargeText order={1}>
              Nuovo Documento
            </AppLargeText>
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
                  onClick={() => router.push('/profile')}
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

      {/* Campi informativi (allineati alla pagina di dettaglio/modifica) */}
      {/* Row 1: (Data inserimento non mostrata in creazione) */}

      {/* Row 2: Data scadenza (date + time) - in creazione l'utente può impostare */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '10px', flexWrap: 'wrap', marginTop: '30px' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-data-scadenza-date"
            label="Data scadenza (gg/MM/YYYY)"
            placeholder={'--'}
            value={dataScadenzaDate}
            editable
            onChange={(e) => setDataScadenzaDate(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-data-scadenza-time"
            label="Ora scadenza (hh:mm)"
            placeholder={'--'}
            value={dataScadenzaTime}
            editable
            onChange={(e) => setDataScadenzaTime(e.target.value)}
          />
        </div>
      </div>

      {/* Row 3: Tipo documento | Operatore (single pair) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-tipo-documento"
            label="Tipo documento"
            placeholder={tipoDocumento || 'Scrivi tipo (FIR, CORSO_SICUREZZA, ...)'}
            value={tipoDocumento}
            editable
            onChange={(e) => setTipoDocumento((e.target.value || '').toUpperCase())}
            onClick={() => showNotification({ title: 'Valori tipo documento', message: 'Valori ammessi: FIR, CORSO_SICUREZZA, CORSO_AGGIORNAMENTO, ALTRO', color: 'blue' })}
          />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <AppInputField
            id="doc-operatore"
            label="Operatore (opzionale)"
            placeholder={selectedOperatoreEmail || '--'}
            editable={false}
            onClick={() => {
              // apriamo modal solo se non è FIR
              if ((String(tipoDocumento || '').toUpperCase()) === 'FIR') {
                showNotification({ title: 'Operazione non permessa', message: "I documenti di tipo 'FIR' non possono avere un operatore associato", color: 'yellow' });
                return;
              }
              // fetch operatori e apri modal
              (async () => {
                try {
                  const res = await fetch('/api/utenti/');
                  if (!res.ok) return;
                  const json = await res.json();
                  const data = json.data || json;
                  const ops = (Array.isArray(data) ? data : []).filter(u => String(u.ruolo).toUpperCase() === 'OPERATORE');
                  setOperatoriOptions(ops.map(o => ({ value: String(o.email || o.id), label: String(o.email || `#${o.id}`), email: o.email })));
                } catch (e) {
                  console.error('fetchOperatori error', e);
                }
                setIsOperatoreModalOpen(true);
              })();
            }}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Preview full-width con click per scegliere file, come nella pagina dettaglio */}
      <Box style={{ marginTop: 20 }}>
        <PreviewBox
          src={objectUrl || "/images/FIR-preview.png"}
          fileObj={file}
          hasFile={!!file}
          isPdf={!!file && isPdf}
          onOpen={handleOpenFull}
          onShare={handleShare}
          onDownload={handleDownload}
          colorScheme={colorScheme}
          theme={theme}
        />
        {/* Il campo "File (opzionale)" è stato rimosso come richiesto; la preview gestisce il pick del file */}
      </Box>

      {/* Modal per associare operatore */}
      <Modal
        opened={isOperatoreModalOpen}
        onClose={() => setIsOperatoreModalOpen(false)}
        title={`Associa operatore al documento`}
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
          <button className="mantine-Button-root mantine-Button-root_variant_default" onClick={() => setIsOperatoreModalOpen(false)}>Annulla</button>
          <button className="mantine-Button-root" onClick={() => setIsOperatoreModalOpen(false)}>Salva</button>
        </div>
      </Modal>
      </RequireRole>
    </Container>
  );
}

// Componente preview inline, identico alla pagina dettaglio
function PreviewBox({ src, fileObj, isPdf, hasFile, onOpen, onShare, onDownload, colorScheme, theme }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [pdfError, setPdfError] = useState(false);
  const [localUrl, setLocalUrl] = useState(null);

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

  // if we have a File object (from input), prefer to use it directly for Document
  useEffect(() => {
    if (fileObj && !(fileObj instanceof String)) {
      try {
        // createObjectURL is used only for non-pdf previews if needed
        const url = URL.createObjectURL(fileObj);
        setLocalUrl(url);
        return () => {
          URL.revokeObjectURL(url);
          setLocalUrl(null);
        };
      } catch (e) {
        // ignore
      }
    } else {
      setLocalUrl(null);
    }
  }, [fileObj]);

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
      {hasFile && (
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
      )}

      {/* Contenuto preview */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(!hasFile) ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.colors.gray[6], width: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160, borderRadius: 12, margin: '0 auto' }}>
              <IconUpload size={48} color={iconColor} />
            </div>
            <div style={{ marginTop: 16, fontSize: 16 }}>Carica un nuovo file</div>
            <div style={{ marginTop: 8, color: theme.colors.gray[5] }}>Clicca per selezionare un file (PDF/JPG/PNG)</div>
          </div>
        ) : isPdf && (fileObj || src) && !pdfError ? (
          <Document
            file={fileObj || src}
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
            Anteprima non disponibile
          </div>
        )}
      </div>
    </div>
  );
}
