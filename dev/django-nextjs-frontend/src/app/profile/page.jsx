"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuth } from '@/providers/authProvider';
import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme, Modal, Text, Button, ScrollArea, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconUser, IconArrowNarrowLeft, IconEdit, IconCheck, IconPlus, IconSearch, IconCalendarEvent, IconTrash, IconFileTypePdf, IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppInputField from '@/components/ui/AppInputField';
import AppSubmitButton from '@/components/ui/AppSubmitButton';
import AppAssociationItem from '@/components/ui/AppAssociationItem';
import RequireRole from "@/components/RequireRole";

// no extra paper/list on profile page

const fetcher = async url => {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    if (res.status === 401) {
      const error = new Error('Authentication required');
      error.isAuthError = true;
      error.status = 401;
      throw error;
    }

    // Try to parse JSON; if not JSON, read text. Normalize possible shapes.
    let errorInfo = null;
    try {
      errorInfo = await res.json();
    } catch (e) {
      try {
        const txt = await res.text();
        errorInfo = txt ? { text: txt } : { message: 'An error occurred' };
      } catch (ee) {
        errorInfo = { message: 'An error occurred' };
      }
    }

    const candidateMessage =
      (errorInfo && (errorInfo.message || errorInfo.detail)) ||
      (errorInfo && typeof errorInfo.text === 'string' ? (errorInfo.text.length > 200 ? errorInfo.text.slice(0, 200) + '...' : errorInfo.text) : null) ||
      JSON.stringify(errorInfo) ||
      'An error occurred';

    const error = new Error(`HTTP ${res.status}: ${candidateMessage}`);
    error.info = errorInfo;
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function ProfilePage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 1050px)', false, { getInitialValueInEffect: true });

  const [isEditing, setIsEditing] = useState(false);

  const auth = useAuth();

  const { data: utente, error, isLoading } = useSWR(
    auth?.isAuthenticated ? `/api/profile` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const authGuard = useAuthGuard({ errors: [error] });

  // If the auth provider says the user is not authenticated but auth guard
  // hasn't redirected yet (session lost while on page), trigger redirect.
  // This mirrors the pattern used in other "crea" pages.
  useEffect(() => {
    if (authGuard.isLoading) return;

    if (!authGuard.isAuthenticated && !authGuard.redirectInProgress) {
      authGuard.triggerRedirect('session lost - redirect from profile page');
    }
  }, [authGuard.isLoading, authGuard.isAuthenticated, authGuard.redirectInProgress]);

  // editable fields
  const [editedNome, setEditedNome] = useState('');
  const [editedCognome, setEditedCognome] = useState('');
  const [editedRuolo, setEditedRuolo] = useState('');
  const [editedDataNascita, setEditedDataNascita] = useState('');
  const [editedLuogoNascita, setEditedLuogoNascita] = useState('');
  const [editedResidenza, setEditedResidenza] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  // Assenze UI state
  const [isAssenzaModalOpen, setIsAssenzaModalOpen] = useState(false);
  const [assenzeDisponibili, setAssenzeDisponibili] = useState([]);
  const [assenzaSearchQuery, setAssenzaSearchQuery] = useState("");
  const [isCreateAssenzaModalOpen, setIsCreateAssenzaModalOpen] = useState(false);
  const [newAssenzaTipo, setNewAssenzaTipo] = useState("FERIE");
  const [newAssenzaDataInizio, setNewAssenzaDataInizio] = useState("");
  const [newAssenzaDataFine, setNewAssenzaDataFine] = useState("");
  // Edit assenza modal state (added to match utenti page)
  const [isEditAssenzaModalOpen, setIsEditAssenzaModalOpen] = useState(false);
  const [editingAssenza, setEditingAssenza] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleEdit = () => {
    if (utente) {
      setEditedNome(utente.nome || '');
      setEditedCognome(utente.cognome || '');
      setEditedRuolo(utente.ruolo || '');
      setEditedDataNascita(formatDate(utente.dataDiNascita || utente.dataNascita));
      setEditedLuogoNascita(utente.luogoDiNascita || utente.luogoNascita || '');
      setEditedResidenza(utente.residenza || '');
      setEditedEmail(utente.email || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      let formattedDataNascita = null;
      if (editedDataNascita && /^\d{2}\/\d{2}\/\d{4}$/.test(editedDataNascita)) {
        const [day, month, year] = editedDataNascita.split('/');
        formattedDataNascita = `${year}-${month}-${day}`;
      }

      // Validate ruolo (allow case-insensitive input but only OPERATORE or STAFF)
      const normalizedRole = editedRuolo ? String(editedRuolo).toUpperCase() : "";
      if (normalizedRole && !["OPERATORE", "STAFF"].includes(normalizedRole)) {
        showNotification({ title: 'Errore', message: 'Ruolo non valido. Usa OPERATORE o STAFF', color: 'red' });
        return;
      }

      const updatePayload = {
        nome: editedNome,
        cognome: editedCognome,
        ruolo: normalizedRole || editedRuolo,
        dataDiNascita: formattedDataNascita,
        luogoDiNascita: editedLuogoNascita,
        residenza: editedResidenza,
        email: editedEmail,
        // password handled via dedicated flow; do not send here
      };

      const res = await fetch(`/api/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error('Errore durante il salvataggio');
      await mutate(`/api/profile`);
      setIsEditing(false);
      showNotification({ title: 'Successo', message: 'Profilo aggiornato', color: 'green' });
    } catch (error) {
      showNotification({ title: 'Errore', message: 'Impossibile salvare le modifiche', color: 'red' });
    }
  };

  // Utilities copied from utenti page
  const toIsoYmd = (d) => {
    if (!d) return null;
    let dateObj = null;
    if (d instanceof Date) dateObj = d; else if (typeof d === 'string') {
      const ddmmyyyy = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        dateObj = new Date(`${year}-${month}-${day}`);
      } else {
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) dateObj = parsed;
      }
    }
    if (!dateObj || isNaN(dateObj.getTime())) return null;
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  };

  const openAssenzaSelectModal = async () => {
    if (!utente?.id) return;
    setIsAssenzaModalOpen(true);
    try {
      const dataRes = await fetch(`/api/utenti/${utente.id}/assenze/disponibili`, {
        method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' }
      });
      if (dataRes.ok) {
        const json = await dataRes.json();
        const items = json.data || json;
        setAssenzeDisponibili(Array.isArray(items) ? items : []);
      } else {
        setAssenzeDisponibili([]);
      }
    } catch (err) {
      setIsAssenzaModalOpen(false);
      showNotification({ title: 'Errore', message: 'Impossibile caricare assenze', color: 'red' });
    }
  };

  const handleDeleteAssociation = async (type, associationId) => {
    if (!utente?.id) return;
    try {
      if (type === 'assenza') {
        // Assenze are deleted directly by ID
        const res = await fetch(`/api/assenze/${associationId}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error('Errore eliminazione assenza');
        await mutate('/api/profile');
        showNotification({ title: 'Fatto', message: `Assenza rimossa`, color: 'green' });
        return;
      }

      if (type === 'attivita') {
        // Call the proxy route which will call Django DELETE /attivita/{id}/dissocia-operatore/{operatore_id}
        const res = await fetch(`/api/attivita/${associationId}/dissocia-operatore`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operatore_id: utente.id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || 'Errore dissociazione attività');
        }
        await mutate('/api/profile');
        showNotification({ title: 'Fatto', message: `Attività dissociata`, color: 'green' });
        return;
      }

      if (type === 'attestato') {
        // Delete the document itself via the documenti proxy route
        const res = await fetch(`/api/documenti/${associationId}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || 'Errore eliminazione documento');
        }
        await mutate('/api/profile');
        showNotification({ title: 'Fatto', message: `Attestato eliminato`, color: 'green' });
        return;
      }
    } catch (error) {
      console.error('handleDeleteAssociation error:', error);
      showNotification({ title: 'Errore', message: `Impossibile rimuovere ${type}`, color: 'red' });
    }
  };

  // Edit assenza save handler (copied/adapted from utenti page)
  const handleSaveEditedAssenza = async () => {
    if (!editingAssenza) return;
    const isoStart = toIsoYmd(editingAssenza.data);
    const isoEnd = toIsoYmd(editingAssenza.dataFine);
    if (!isoStart || !isoEnd) {
      showNotification({ title: 'Errore', message: 'Formati data non validi', color: 'red' });
      return;
    }
    try {
      const payload = {
        tipoAssenza: editingAssenza.motivo || editingAssenza.tipoAssenza,
        dataInizio: isoStart,
        dataFine: isoEnd,
      };

      const res = await fetch(`/api/assenze/${editingAssenza.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'Errore aggiornamento assenza');
      }
      await mutate('/api/profile');
      setIsEditAssenzaModalOpen(false);
      setEditingAssenza(null);
      showNotification({ title: 'Successo', message: 'Assenza aggiornata', color: 'green' });
    } catch (err) {
      showNotification({ title: 'Errore', message: err?.message || 'Impossibile aggiornare assenza', color: 'red' });
    }
  };

  if (authGuard.isLoading || isLoading) return <div>Caricamento...</div>;
  if (!authGuard.isAuthenticated) return null;
  if (error && error.status !== 401) return <div>Failed to load profile: {error.message}</div>;

  const userFullName = `${utente?.nome || ''} ${utente?.cognome || ''}`.trim();

  return (
    <>
      <Container size="lg">
        <Box style={{ marginTop: '24px' }}>
          <Group justify="space-between" align="center">
            <Group justify="start" align="center">
              <IconArrowNarrowLeft style={{ cursor: 'pointer' }} onClick={() => router.back()} />
              <AppLargeText order={1}>{userFullName}</AppLargeText>
              {isEditing ? 
                <IconCheck style={{ marginLeft: '12px', cursor: 'pointer' }} onClick={handleSave} /> : 
                <IconEdit style={{ marginLeft: '12px', cursor: 'pointer' }} onClick={handleEdit} />
              }
            </Group>
            <Group>
              <IconBell style={{ width: '25px', height: '25px', strokeWidth: '1.7' }} />
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Avatar color="blue" radius="xl" size={45} style={{ cursor: 'pointer' }}>
                    {authGuard.email ? authGuard.email.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item leftSection={<IconUser size={14} />} onClick={() => router.push('/profile')}>Profilo</Menu.Item>
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

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', width: '100%', marginTop: '30px' }}>
            <div style={{ width: isMobile ? '100%' : '20%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <Avatar src={utente?.immagineProfilo || null} size={isMobile ? 120 : 160} radius="50%" alt="Immagine profilo">
                {utente?.nome?.charAt(0)}{utente?.cognome?.charAt(0)}
              </Avatar>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Nome / Cognome */}
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-nome" label="Nome" placeholder={!isEditing ? (utente?.nome || '--') : '--'} value={isEditing ? editedNome : ""} editable={isEditing} onChange={(e) => setEditedNome(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-cognome" label="Cognome" placeholder={!isEditing ? (utente?.cognome || '--') : '--'} value={isEditing ? editedCognome : ""} editable={isEditing} onChange={(e) => setEditedCognome(e.target.value)} />
                </div>
              </div>
              {/* Ruolo / Data di nascita */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-ruolo" label="Ruolo" placeholder={(utente?.ruolo || '--')} value={""} editable={false} />
                </div>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-data-nascita" label="Data di Nascita" placeholder={!isEditing ? (formatDate(utente?.dataDiNascita || utente?.dataNascita) || 'dd/MM/YYYY') : 'dd/MM/YYYY'} value={isEditing ? editedDataNascita : ""} editable={isEditing} onChange={(e) => setEditedDataNascita(e.target.value)} />
                </div>
              </div>
              {/* Luogo nascita / Residenza */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-luogo-nascita" label="Luogo di Nascita" placeholder={!isEditing ? (utente?.luogoDiNascita || utente?.luogoNascita || '--') : '--'} value={isEditing ? editedLuogoNascita : ""} editable={isEditing} onChange={(e) => setEditedLuogoNascita(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-residenza" label="Residenza" placeholder={!isEditing ? (utente?.residenza || '--') : '--'} value={isEditing ? editedResidenza : ""} editable={isEditing} onChange={(e) => setEditedResidenza(e.target.value)} />
                </div>
              </div>

              {/* Email + Password side-by-side */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                <div style={{ flex: 1 }}><AppInputField id="profile-email" label="Email" placeholder={!isEditing ? (utente?.email || '--') : '--'} value={isEditing ? editedEmail : ""} editable={isEditing} onChange={(e) => setEditedEmail(e.target.value)} /></div>
                <div style={{ flex: 1 }}>
                  <AppInputField id="profile-password" label="Password" placeholder={'••••••'} value={""} editable={false} readOnly />
                </div>
              </div>

              {/* Elimina account button full width across two columns */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '18px' }}>
                <div style={{ flex: 2 }}>
                  <AppSubmitButton
                    fullWidth
                    color="red"
                    onClick={async () => {
                      const confirmed = window.confirm('Sei sicuro di voler eliminare definitivamente il tuo account? Questa operazione non può essere annullata.')
                      if (!confirmed) return
                      try {
                        const res = await fetch('/api/profile', { method: 'DELETE', credentials: 'include' })
                        if (!res.ok) throw new Error('Errore eliminazione account')
                        showNotification({ title: 'Account eliminato', message: 'Il tuo account è stato eliminato', color: 'green' })
                        // Dopo l'eliminazione dell'account, reindirizza all'endpoint di login
                        // evitando push diretti; l'utente non è più autenticato
                        // e l'app lo reindirizzerà automaticamente al login nelle pagine protette
                        // In alternativa, si può utilizzare router.replace
                        router.replace('/login')
                      } catch (err) {
                        showNotification({ title: 'Errore', message: 'Impossibile eliminare account', color: 'red' })
                      }
                    }}
                  >
                    Elimina account
                  </AppSubmitButton>
                </div>
              </div>
            </div>
          </div>

          {/* SEZIONE ENTITÀ ASSOCIATE (Assenze, Attività, Attestati) */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '32px' : '12px', marginTop: '60px', width: '100%' }}>
            {/* ASSENZE */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
                <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Assenze</AppLargeText>
                {isEditing && (
                  <RequireRole allowedRoles={['STAFF']}>
                  <Group gap="xs">
                    <IconPlus style={{ cursor: 'pointer' }} onClick={() => setIsCreateAssenzaModalOpen(true)} />
                    {/* <IconLink style={{ cursor: 'pointer' }} onClick={openAssenzaSelectModal} /> */}
                  </Group>
                  </RequireRole>
                )}
              </Group>
              <ScrollArea style={{ height: '40vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {utente?.assenze?.length > 0 ? (
                    utente.assenze.map((a) => (
                      <AppAssociationItem
                        key={a.id}
                        leftIcon={<IconCalendarEvent style={{ width: '25px', height: '25px', color: '#919293)', strokeWidth: '1.7' }} />}
                        title={`${formatDate(a.dataInizio || a.data)} - ${formatDate(a.dataFine)}`}
                        rightIcon={<IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
                        onClick={isEditing ? () => {
                          setEditingAssenza({
                            ...a,
                            motivo: a.tipoAssenza || a.motivo || "",
                            data: formatDate(a.dataInizio || a.data) || "",
                            dataFine: formatDate(a.dataFine) || "",
                          });
                          setIsEditAssenzaModalOpen(true);
                        } : undefined}
                        onRightIconClick={(e) => { e?.stopPropagation?.(); handleDeleteAssociation('assenza', a.id); }}
                      />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" mt="md">Nessuna assenza registrata</Text>
                  )}
                </div>
              </ScrollArea>
            </div>

            {!isMobile && (<div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />)}

            {/* ATTIVITÀ */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
                <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Attività</AppLargeText>
                {isEditing && (<RequireRole allowedRoles={['STAFF']}> <IconPlus style={{ cursor: 'pointer' }} onClick={() => router.push('/attivita/crea')} /> </RequireRole>)}
              </Group>
              <ScrollArea style={{ height: '40vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {utente?.attivita?.length > 0 ? (
                    utente.attivita.map((att) => (
            <AppAssociationItem
                        key={att.id}
                        leftText={`#${att.id}`}
                        title={att.titolo}
                        rightIcon={<IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
              onClick={!isEditing ? () => router.push(`/attivita/${att.id}`) : undefined}
              onRightIconClick={(e) => { e?.stopPropagation?.(); handleDeleteAssociation('attivita', att.id); }}
                      />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" mt="md">Nessuna attività assegnata</Text>
                  )}
                </div>
              </ScrollArea>
            </div>

            {!isMobile && (<div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />)}

            {/* ATTESTATI */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
                <AppLargeText style={{ fontSize: '18px', fontWeight: '600' }}>Attestati</AppLargeText>
                {isEditing && (<RequireRole allowedRoles={['STAFF']}> <IconPlus style={{ cursor: 'pointer' }} onClick={() => router.push('/documento/crea')} /> </RequireRole>)}
              </Group>
              <ScrollArea style={{ height: '40vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {utente?.attestati?.length > 0 ? (
                    utente.attestati.map((doc) => (
            <AppAssociationItem
                        key={doc.id}
                        leftIcon={<IconFileTypePdf style={{ width: '25px', height: '25px', color: '#919293', marginRight: '10px', strokeWidth: '1.7' }} />}
                        title={doc.tipoDocumento || doc.nome}
                        rightIcon={<IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
              onClick={!isEditing ? () => router.push(`/documenti/${doc.id}`) : undefined}
              onRightIconClick={(e) => { e?.stopPropagation?.(); handleDeleteAssociation('attestato', doc.id); }}
                      />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" mt="md">Nessun attestato presente</Text>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Box>
      </Container>

      {/* Selezione Assenza Modal */}
      <Modal
        opened={isAssenzaModalOpen}
        onClose={() => setIsAssenzaModalOpen(false)}
        title="Aggiungi Assenza"
        size="xl"
        centered
      >
        <Text style={{ display: 'block', marginBottom: 12 }}>Cerca assenze disponibili</Text>
        <TextInput
          placeholder="Cerca per motivo..."
          value={assenzaSearchQuery}
          onChange={(e) => setAssenzaSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />
        <ScrollArea style={{ height: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assenzeDisponibili.filter((a) => (a.motivo || '').toLowerCase().includes(assenzaSearchQuery.toLowerCase())).length > 0 ? (
              assenzeDisponibili
                .filter((a) => (a.motivo || '').toLowerCase().includes(assenzaSearchQuery.toLowerCase()))
                .map((a) => (
                  <AppAssociationItem
                    key={a.id}
                    leftIcon={<IconCalendarEvent size={18} />}
                    title={`${a.motivo || a.tipoAssenza || ''} - ${formatDate(a.data || a.dataInizio)}`}
                    onClick={() => { setIsAssenzaModalOpen(false); }}
                  />
                ))
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: theme.colors.gray ? theme.colors.gray[6] : '#999' }}>
                Nessuna assenza disponibile
              </div>
            )}
          </div>
        </ScrollArea>
      </Modal>

      {/* Crea Assenza Modal */}
      <Modal
        opened={isCreateAssenzaModalOpen}
        onClose={() => setIsCreateAssenzaModalOpen(false)}
        title="Crea Nuova Assenza"
        size="md"
        centered
      >
        <TextInput
          label="Tipo assenza (FERIE/MALATTIA/PERMESSO/ASPETTATIVA/MATERNITA)"
          value={newAssenzaTipo}
          onChange={(e) => setNewAssenzaTipo(e.target.value.toUpperCase())}
          mb="sm"
        />
        <TextInput
          label="Data inizio (dd/MM/YYYY)"
          placeholder="gg/MM/YYYY"
          value={newAssenzaDataInizio || ''}
          onChange={(e) => setNewAssenzaDataInizio(e.target.value)}
          mb="sm"
        />
        <TextInput
          label="Data fine (dd/MM/YYYY)"
          placeholder="gg/MM/YYYY"
          value={newAssenzaDataFine || ''}
          onChange={(e) => setNewAssenzaDataFine(e.target.value)}
          mb="md"
        />
        <Group position="right">
          <Button
            onClick={async () => {
              if (!newAssenzaDataInizio || !newAssenzaDataFine) {
                showNotification({ title: 'Errore', message: 'Compila le date', color: 'red' });
                return;
              }
              const isoStart = toIsoYmd(newAssenzaDataInizio);
              const isoEnd = toIsoYmd(newAssenzaDataFine);
              if (!isoStart || !isoEnd) {
                showNotification({ title: 'Errore', message: 'Formati data non validi', color: 'red' });
                return;
              }
              const startDate = new Date(isoStart);
              const endDate = new Date(isoEnd);
              if (startDate > endDate) {
                showNotification({ title: 'Errore', message: 'La data di inizio deve essere precedente o uguale alla data di fine', color: 'red' });
                return;
              }
              try {
                const payload = {
                  operatore_id: utente?.id,
                  tipoAssenza: newAssenzaTipo,
                  dataInizio: isoStart,
                  dataFine: isoEnd,
                };
                const res = await fetch('/api/assenze', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err?.detail || 'Errore creazione assenza');
                }
                await mutate('/api/profile');
                setIsCreateAssenzaModalOpen(false);
                setNewAssenzaTipo('FERIE');
                setNewAssenzaDataInizio('');
                setNewAssenzaDataFine('');
                showNotification({ title: 'Successo', message: 'Assenza creata', color: 'green' });
              } catch (err) {
                showNotification({ title: 'Errore', message: err?.message || 'Impossibile creare assenza', color: 'red' });
              }
            }}
          >
            Crea
          </Button>
        </Group>
      </Modal>

      {/* Edit Assenza Modal */}
      <Modal
        opened={isEditAssenzaModalOpen}
        onClose={() => { setIsEditAssenzaModalOpen(false); setEditingAssenza(null); }}
        title="Modifica Assenza"
        size="md"
        centered
      >
        <TextInput
          label="Tipo assenza (FERIE/MALATTIA/PERMESSO/ASPETTATIVA/MATERNITA)"
          value={editingAssenza?.motivo || newAssenzaTipo}
          onChange={(e) => setEditingAssenza((prev) => ({ ...(prev||{}), motivo: e.target.value.toUpperCase() }))}
          mb="sm"
        />
        <TextInput
          label="Data inizio (dd/MM/YYYY)"
          placeholder="gg/MM/YYYY"
          value={editingAssenza ? (editingAssenza.data || '') : ''}
          onChange={(e) => setEditingAssenza((prev) => ({ ...(prev||{}), data: e.target.value }))}
          mb="sm"
        />
        <TextInput
          label="Data fine (dd/MM/YYYY)"
          placeholder="gg/MM/YYYY"
          value={editingAssenza ? (editingAssenza.dataFine || '') : ''}
          onChange={(e) => setEditingAssenza((prev) => ({ ...(prev||{}), dataFine: e.target.value }))}
          mb="md"
        />
        <Group position="right">
          <Button onClick={handleSaveEditedAssenza}>Salva</Button>
        </Group>
      </Modal>
    </>
  );
}

// Modals placed after main component render for clarity (file-local functions/JSX)

// NOTE: Placing modals below to avoid duplicating large sections inside the return above.

/* Selezione Assenza Modal */
export function ProfileAssenzaModalsPlaceholder() { return null }

// We'll actually render modals inside the component by returning fragments inserted after the main JSX.

/* The following JSX is intentionally not its own component because it uses closure-scoped state above. */

// Add modal JSX by mutating the DOM inside the component render — to keep things simple we append here.


