"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/providers/authProvider";
import useSWR, { mutate } from "swr";
import {
  Container,
  Box,
  Group,
  useMantineTheme,
  Menu,
  Avatar,
  useMantineColorScheme,
  Modal,
  TextInput,
  ScrollArea,
  Text,
  Button,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import AppLargeText from "@/components/ui/AppLargeText";
import {
  IconBell,
  IconMoon,
  IconSettings,
  IconSun,
  IconUser,
  IconArrowNarrowLeft,
  IconEdit,
  IconCheck,
  IconPlus,
  IconSearch,
  IconCalendarEvent,
  IconClipboardList,
  IconTrash,
  IconFileTypePdf,
  IconLock,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppInputField from "@/components/ui/AppInputField";
import AppAssociationItem from "@/components/ui/AppAssociationItem";
// removed DateInput: use manual text inputs instead
import "dayjs/locale/it";
import RequireRole from "@/components/RequireRole";

const fetcher = async (url) => {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Let the centralized auth logic handle redirects to avoid duplication.
      const err = new Error('Unauthorized');
      err.status = 401;
      // mark as auth error so useAuthGuard can detect it
      err.isAuthError = true;
      try {
        // try to parse possible JSON body for additional info
        err.info = await res.json().catch(() => ({ message: 'Unauthorized' }));
      } catch (e) {
        err.info = { message: 'Unauthorized' };
      }
      throw err;
    }
    const errorInfo = await res.json().catch(() => ({ message: "An error occurred" }));
    const error = new Error(`HTTP ${res.status}: ${errorInfo.message}`);
    error.info = errorInfo;
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function UserDetailPage({ params }) {
  const router = useRouter();
  // Next.js may pass `params` as a promise; unwrap it with React.use if available.
  const resolvedParams = (typeof React.use === 'function') ? React.use(params) : params;
  const { id } = resolvedParams;
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const isMobile = useMediaQuery("(max-width: 1050px)", false, { getInitialValueInEffect: true });

  const [isEditing, setIsEditing] = useState(false);

  // Stati per i campi editabili dell'utente
  const [editedNome, setEditedNome] = useState("");
  const [editedCognome, setEditedCognome] = useState("");
  const [editedRuolo, setEditedRuolo] = useState("");
  const [editedDataDiNascita, seteditedDataDiNascita] = useState("");
  const [editedLuogoDiNascita, seteditedLuogoDiNascita] = useState("");
  const [editedResidenza, setEditedResidenza] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  // Stati per Assenze (selezione e creazione)
  const [isAssenzaModalOpen, setIsAssenzaModalOpen] = useState(false);
  const [assenzeDisponibili, setAssenzeDisponibili] = useState([]);
  const [assenzaSearchQuery, setAssenzaSearchQuery] = useState("");

  const [isCreateAssenzaModalOpen, setIsCreateAssenzaModalOpen] = useState(false);
  const [newAssenzaTipo, setNewAssenzaTipo] = useState("FERIE");
  const [newAssenzaDataInizio, setNewAssenzaDataInizio] = useState(null);
  const [newAssenzaDataFine, setNewAssenzaDataFine] = useState(null);
  // Edit assenza modal state
  const [isEditAssenzaModalOpen, setIsEditAssenzaModalOpen] = useState(false);
  const [editingAssenza, setEditingAssenza] = useState(null);

  // RIMOSSI stati e modali per Attività e Attestati (come richiesto)

  const auth = useAuth();

  const { data: utente, error, isLoading } = useSWR(
    (id && auth?.isAuthenticated) ? `/api/utenti/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Normalizzazione dati
  const normalizedUser = useMemo(() => {
    if (!utente) return null;
    return {
      ...utente,
      dataNascita: utente.dataDiNascita || utente.dataNascita || null,
      luogoNascita: utente.luogoDiNascita || utente.luogoNascita || null,
      assenze: Array.isArray(utente.assenze)
        ? utente.assenze.map((a) => ({
            id: a.id,
            operatore_id: a.operatore_id,
            motivo: a.tipoAssenza || a.motivo || "",
            data: a.dataInizio || a.data || null,
            dataFine: a.dataFine || null,
            raw: a,
          }))
        : [],
      attivita_assegnate: utente.attivita || utente.attivita_assegnate || [],
      attestati: utente.attestati || [],
    };
  }, [utente]);

  const authGuard = useAuthGuard({ errors: [error] });

  // Debug logging: observe when an auth error appears and the authGuard state
  useEffect(() => {
    try {
      const errStatus = error?.status ?? (error && error.message ? 'has-message' : 'no-error');
      console.log('[UTENTI PAGE] authGuard:', {
        isLoading: authGuard.isLoading,
        isAuthenticated: authGuard.isAuthenticated,
        redirectInProgress: authGuard.redirectInProgress,
        errorStatus: errStatus,
        isAuthError: !!(error && (error.status === 401 || error.isAuthError)),
      });
    } catch (e) {
      // ignore
    }
  }, [error, authGuard.isLoading, authGuard.isAuthenticated, authGuard.redirectInProgress]);

  // --- Menu profilo ---
  const handleProfile = () => router.push("/profile");
  const handleSettings = () => router.push("/settings");
  const handleThemeToggle = () => toggleColorScheme();

  // --- Utility date ---
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const toIsoYmd = (d) => {
    if (!d) return null;
    // If it's already a Date instance
    let dateObj = null;
    if (d instanceof Date) {
      dateObj = d;
    } else if (typeof d === "string") {
      // Accept strings in DD/MM/YYYY or ISO formats
      // Try DD/MM/YYYY first
      const ddmmyyyy = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        dateObj = new Date(`${year}-${month}-${day}`);
      } else {
        // Fallback to Date parsing for ISO-like strings
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) dateObj = parsed;
      }
    } else if (d && typeof d.toDate === "function") {
      // dayjs or similar
      try {
        dateObj = d.toDate();
      } catch (e) {
        dateObj = null;
      }
    }

    if (!dateObj || isNaN(dateObj.getTime())) return null;

    const pad = (n) => String(n).padStart(2, "0");
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    return `${y}-${m}-${day}`;
  };

  // Parse various date inputs into a Date object (or null)
  const parseToDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === "string") {
      const ddmmyyyy = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const d = new Date(`${year}-${month}-${day}`);
        return isNaN(d.getTime()) ? null : d;
      }
      const parsed = new Date(v);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (v && typeof v.toDate === "function") {
      try {
        const d = v.toDate();
        return isNaN(d.getTime()) ? null : d;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // --- Editing ---
  const handleEdit = () => {
    if (normalizedUser) {
      setEditedNome(normalizedUser.nome || "");
      setEditedCognome(normalizedUser.cognome || "");
      setEditedRuolo(normalizedUser.ruolo || "");
  // store as formatted string dd/MM/YYYY when possible
  seteditedDataDiNascita(normalizedUser.dataNascita ? formatDate(normalizedUser.dataNascita) : "");
      seteditedLuogoDiNascita(normalizedUser.luogoNascita || "");
      setEditedResidenza(normalizedUser.residenza || "");
      setEditedEmail(normalizedUser.email || "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      let formattedDataNascita = null;
      if (editedDataDiNascita) {
        // If it's a Date object or parseable string, use toIsoYmd
        formattedDataNascita = toIsoYmd(editedDataDiNascita);
      }

      // Validate and normalize ruolo: accept only OPERATORE or STAFF (case-insensitive)
      const normalizedRole = editedRuolo ? String(editedRuolo).toUpperCase() : "";
      if (normalizedRole && !["OPERATORE", "STAFF"].includes(normalizedRole)) {
        showNotification({ title: "Errore", message: "Ruolo non valido. Usa OPERATORE o STAFF", color: "red" });
        return;
      }

      const updatePayload = {
        nome: editedNome,
        cognome: editedCognome,
        // send ruolo in uppercase when present
        ruolo: normalizedRole || editedRuolo,
        dataDiNascita: formattedDataNascita,
        luogoDiNascita: editedLuogoDiNascita,
        residenza: editedResidenza,
        email: editedEmail,
      };

      const res = await fetch(`/api/utenti/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg =
          (errBody && (errBody.detail || errBody.message || JSON.stringify(errBody))) || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      await mutate(`/api/utenti/${id}`);
      setIsEditing(false);
      showNotification({ title: "Successo", message: "Dati utente aggiornati", color: "green" });
    } catch (error) {
      showNotification({ title: "Errore", message: "Impossibile salvare le modifiche", color: "red" });
    }
  };

  // --- Caricamento elenco assenze disponibili (se vuoi aprire il modale elenco) ---
  const openAssenzaSelectModal = async () => {
    setIsAssenzaModalOpen(true);
    try {
      const data = await fetch(`/api/utenti/${id}/assenze/disponibili`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (data.status === 401) {
        setIsAssenzaModalOpen(false);
        // trigger centralized redirect (avoid duplicating logic)
        try { authGuard.triggerRedirect('401 in openAssenzaSelectModal'); } catch (e) { /* ignore */ }
        return;
      }
      if (data.ok) {
        const json = await data.json();
        const items = json.data || json;
        setAssenzeDisponibili(Array.isArray(items) ? items : []);
      } else {
        setAssenzeDisponibili([]);
      }
    } catch (err) {
      setIsAssenzaModalOpen(false);
      showNotification({ title: "Errore", message: "Impossibile caricare assenze", color: "red" });
    }
  };

  // --- Eliminazioni (restano per tutti) ---
  const handleDelete = async (type, associationId) => {
    try {
      if (type === 'assenza') {
        const res = await fetch(`/api/assenze/${associationId}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error('Errore eliminazione assenza');
        await mutate(`/api/utenti/${id}`);
        showNotification({ title: 'Fatto', message: 'Assenza rimossa', color: 'green' });
        return;
      }

      if (type === 'attivita') {
        const res = await fetch(`/api/attivita/${associationId}/dissocia-operatore`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operatore_id: Number(id) }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || 'Errore dissociazione attività');
        }
        await mutate(`/api/utenti/${id}`);
        showNotification({ title: 'Fatto', message: 'Attività dissociata', color: 'green' });
        return;
      }

      if (type === 'attestato') {
        const res = await fetch(`/api/documenti/${associationId}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || 'Errore eliminazione documento');
        }
        await mutate(`/api/utenti/${id}`);
        showNotification({ title: 'Fatto', message: 'Attestato eliminato', color: 'green' });
        return;
      }
    } catch (error) {
      console.error('handleDelete error:', error);
      showNotification({ title: 'Errore', message: `Impossibile rimuovere ${type}`, color: 'red' });
    }
  };

  if (authGuard.isLoading || isLoading) return <div>Caricamento...</div>;
  if (!authGuard.isAuthenticated) return null;
  // Let centralized auth logic handle 401 errors (redirect). Only render
  // an error UI for non-401 failures.
  if (error && error.status !== 401) return <div>Failed to load user data: {error.message}</div>;

  const userFullName = `${normalizedUser?.nome || ""} ${normalizedUser?.cognome || ""}`.trim();

  return (
    <RequireRole allowedRoles={['STAFF']} fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
      <Container size="lg">
        <Box style={{ marginTop: "24px" }}>
          {/* HEADER */}
          <Group justify="space-between" align="center">
            <Group justify="start" align="center">
              <IconArrowNarrowLeft style={{ cursor: "pointer" }} onClick={() => router.back()} />
              <AppLargeText order={1}>{userFullName}: ID#{id}</AppLargeText>
              {isEditing ? (
                <IconCheck style={{ marginLeft: "12px", cursor: "pointer" }} onClick={handleSave} />
              ) : (
                <IconEdit style={{ marginLeft: "12px", cursor: "pointer" }} onClick={handleEdit} />
              )}
            </Group>
            <Group>
              <IconBell style={{ width: "25px", height: "25px", strokeWidth: "1.7" }} />
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Avatar color="blue" radius="xl" size={45} style={{ cursor: "pointer" }}>
                    {authGuard.email ? authGuard.email.charAt(0).toUpperCase() : "U"}
                  </Avatar>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item leftSection={<IconUser size={14} />} onClick={handleProfile}>
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

          {/* SEZIONE DETTAGLI UTENTE */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "24px",
              width: "100%",
              marginTop: "30px",
            }}
          >
            <div
              style={{
                width: isMobile ? "100%" : "20%",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              <Avatar
                src={normalizedUser?.immagineProfilo || null}
                size={isMobile ? 120 : 160}
                radius="50%"
                alt="Immagine profilo"
              >
                {normalizedUser?.nome?.charAt(0)}
                {normalizedUser?.cognome?.charAt(0)}
              </Avatar>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <AppInputField
                    id="utente-nome"
                    label="Nome"
                    placeholder={!isEditing ? normalizedUser?.nome || "--" : "--"}
                    value={isEditing ? editedNome : ""}
                    editable={isEditing}
                    onChange={(e) => setEditedNome(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <AppInputField
                    id="utente-cognome"
                    label="Cognome"
                    placeholder={!isEditing ? normalizedUser?.cognome || "--" : "--"}
                    value={isEditing ? editedCognome : ""}
                    editable={isEditing}
                    onChange={(e) => setEditedCognome(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "10px" }}>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <Menu shadow="md" width={160} position="bottom-start">
                      <Menu.Target>
                        <div>
                          <AppInputField
                            id="utente-ruolo"
                            label="Ruolo"
                            placeholder={!isEditing ? normalizedUser?.ruolo || "--" : "--"}
                            value={isEditing ? editedRuolo : ""}
                            editable={true}
                            onChange={(e) => setEditedRuolo(e.target.value)}
                          />
                        </div>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => setEditedRuolo('OPERATORE')}>OPERATORE</Menu.Item>
                        <Menu.Item onClick={() => setEditedRuolo('STAFF')}>STAFF</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  ) : (
                    <AppInputField
                      id="utente-ruolo"
                      label="Ruolo"
                      placeholder={!isEditing ? normalizedUser?.ruolo || "--" : "--"}
                      value={""}
                      editable={false}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <AppInputField
                      id="utente-data-nascita"
                      label="Data di Nascita"
                      placeholder="dd/MM/YYYY"
                      value={editedDataDiNascita}
                      editable={true}
                      onChange={(e) => seteditedDataDiNascita(e.target.value)}
                    />
                  ) : (
                    <AppInputField
                      id="utente-data-nascita"
                      label="Data di Nascita"
                      placeholder={formatDate(normalizedUser?.dataDiNascita) || "dd/MM/YYYY"}
                      value={""}
                      editable={false}
                    />
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "10px" }}>
                <div style={{ flex: 1 }}>
                  <AppInputField
                    id="utente-luogo-nascita"
                    label="Luogo di Nascita"
                    placeholder={!isEditing ? normalizedUser?.luogoDiNascita || "--" : "--"}
                    value={isEditing ? editedLuogoDiNascita : ""}
                    editable={isEditing}
                    onChange={(e) => seteditedLuogoDiNascita(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <AppInputField
                    id="utente-residenza"
                    label="Residenza"
                    placeholder={!isEditing ? normalizedUser?.residenza || "--" : "--"}
                    value={isEditing ? editedResidenza : ""}
                    editable={isEditing}
                    onChange={(e) => setEditedResidenza(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "10px" }}>
                <div style={{ flex: 1 }}>
                  <AppInputField
                    id="utente-email"
                    label="Email"
                    placeholder={!isEditing ? normalizedUser?.email || "--" : "--"}
                    value={isEditing ? editedEmail : ""}
                    editable={isEditing}
                    onChange={(e) => setEditedEmail(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}></div>
              </div>
            </div>
          </div>

          {/* SEZIONE ENTITÀ ASSOCIATE */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "32px" : "12px",
              marginTop: "60px",
              width: "100%",
            }}
          >
            {/* COLONNA ASSENZE */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" style={{ marginBottom: "12px" }}>
                <AppLargeText style={{ fontSize: "18px", fontWeight: "600" }}>Assenze</AppLargeText>
                {isEditing && (
                  <Group gap="xs">
                    {/* Apri modale Crea */}
                    <IconPlus style={{ cursor: "pointer" }} onClick={() => setIsCreateAssenzaModalOpen(true)} />
                    {/* Se vuoi anche associare da elenco esistente, scommenta la riga seguente: */}
                    {/* <IconLink style={{ cursor: "pointer" }} onClick={openAssenzaSelectModal} /> */}
                  </Group>
                )}
              </Group>
              <ScrollArea style={{ height: "40vh" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {normalizedUser?.assenze?.length > 0 ? (
                    normalizedUser.assenze.map((assenza) => (
                        <AppAssociationItem
                          key={assenza.id}
                          leftIcon={<IconCalendarEvent style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
                          title={`${formatDate(assenza.data)} - ${formatDate(assenza.dataFine)}`}
                          rightIcon={<IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
                          // Do not make the card navigate away. If in edit mode, open inline edit modal.
                          onClick={isEditing ? () => {
                            // Initialize editable fields as plain strings so inputs are controlled correctly
                            setEditingAssenza({
                              ...assenza,
                              motivo: assenza.motivo || assenza.tipoAssenza || "",
                              data: formatDate(assenza.data) || "",
                              dataFine: formatDate(assenza.dataFine) || "",
                            });
                            setIsEditAssenzaModalOpen(true);
                          } : undefined}
                          onRightIconClick={async (e) => {
                            e?.stopPropagation?.();
                            try {
                              const res = await fetch(`/api/assenze/${assenza.id}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              });
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                throw new Error(err?.detail || 'Errore eliminazione assenza');
                              }
                              await mutate(`/api/utenti/${id}`);
                              showNotification({ title: 'Fatto', message: 'Assenza rimossa', color: 'green' });
                            } catch (err) {
                              showNotification({ title: 'Errore', message: err?.message || 'Impossibile eliminare assenza', color: 'red' });
                            }
                          }}
                        />
                      ))
                  ) : (
                    <Text c="dimmed" ta="center" mt="md">
                      Nessuna assenza registrata
                    </Text>
                  )}
                </div>
              </ScrollArea>
            </div>

            {!isMobile && (
              <div style={{ width: "1px", background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
            )}

            {/* COLONNA ATTIVITÀ */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" style={{ marginBottom: "12px" }}>
                <AppLargeText style={{ fontSize: "18px", fontWeight: "600" }}>Attività</AppLargeText>
                {isEditing && (
                  <IconPlus style={{ cursor: "pointer" }} onClick={() => router.push("/attivita/crea")} />
                )}
              </Group>
              <ScrollArea style={{ height: "40vh" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {normalizedUser?.attivita_assegnate?.length > 0 ? (
                    normalizedUser.attivita_assegnate.map((attivita) => (
                      <AppAssociationItem
                        key={attivita.id}
                        leftText={`#${attivita.id}`}
                        title={attivita.titolo}
                        rightIcon={<IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
                        onClick={!isEditing ? () => router.push(`/attivita/${attivita.id}`) : undefined}
                        onRightIconClick={(e) => { e?.stopPropagation?.(); handleDelete('attivita', attivita.id); }}
                      />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" mt="md">
                      Nessuna attività assegnata
                    </Text>
                  )}
                </div>
              </ScrollArea>
            </div>

            {!isMobile && (
              <div style={{ width: "1px", background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
            )}

            {/* COLONNA ATTESTATI */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" style={{ marginBottom: "12px" }}>
                <AppLargeText style={{ fontSize: "18px", fontWeight: "600" }}>Attestati</AppLargeText>
                {isEditing && (
                  <IconPlus style={{ cursor: "pointer" }} onClick={() => router.push("/documento/crea")} />
                )}
              </Group>
              <ScrollArea style={{ height: "40vh" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {normalizedUser?.attestati?.length > 0 ? (
                    normalizedUser.attestati.map((attestato) => (
                      <AppAssociationItem
                        key={attestato.id}
                        leftIcon={<IconFileTypePdf style={{ width: '25px', height: '25px', color: '#919293', marginRight: '10px', strokeWidth: '1.7' }} />}
                        title={attestato.nome}
                        rightIcon={<IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />}
                        onClick={!isEditing ? () => router.push(`/documenti/${attestato.id}`) : undefined}
                        onRightIconClick={(e) => { e?.stopPropagation?.(); handleDelete('attestato', attestato.id); }}
                      />
                    ))
                  ) : (
                    <Text c="dimmed" ta="center" mt="md">
                      Nessun attestato presente
                    </Text>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Box>
      </Container>

      {/* MODALI */}

      {/* Selezione Assenza ( opzionale — la lasciamo, ma non c’è un bottone diretto nel layout) */}
      <Modal
        opened={isAssenzaModalOpen}
        onClose={() => setIsAssenzaModalOpen(false)}
        title="Aggiungi Assenza"
        size="xl"
        centered
      >
        <TextInput
          placeholder="Cerca per motivo..."
          value={assenzaSearchQuery}
          onChange={(e) => setAssenzaSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />
        <ScrollArea style={{ height: 400 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {assenzeDisponibili.filter((a) =>
              (a.motivo || "").toLowerCase().includes(assenzaSearchQuery.toLowerCase())
            ).length > 0 ? (
              assenzeDisponibili
                .filter((a) => (a.motivo || "").toLowerCase().includes(assenzaSearchQuery.toLowerCase()))
                .map((a) => (
                  <AppAssociationItem
                    key={a.id}
                    leftIcon={<IconCalendarEvent size={18} />}
                    title={`${a.motivo} - ${formatDate(a.data)}`}
                    // Nota: qui potresti implementare una chiamata di associazione se in futuro ti serve
                    onClick={() => {
                      // handleAssociate('assenza', a.id) — rimosso per coerenza col requisito sugli altri
                      setIsAssenzaModalOpen(false);
                    }}
                  />
                ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: theme.colors.gray ? theme.colors.gray[6] : "#999",
                }}
              >
                Nessuna assenza disponibile
              </div>
            )}
          </div>
        </ScrollArea>
      </Modal>

      {/* Crea Assenza con DateInput DD/MM/YYYY */}
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
          value={newAssenzaDataInizio || ""}
          onChange={(e) => setNewAssenzaDataInizio(e.target.value)}
          mb="sm"
        />
        <TextInput
          label="Data fine (dd/MM/YYYY)"
          placeholder="gg/MM/YYYY"
          value={newAssenzaDataFine || ""}
          onChange={(e) => setNewAssenzaDataFine(e.target.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button
            onClick={async () => {
              // Validate presence
              if (!newAssenzaDataInizio || !newAssenzaDataFine) {
                showNotification({ title: "Errore", message: "Compila le date", color: "red" });
                return;
              }

              const isoStart = toIsoYmd(newAssenzaDataInizio);
              const isoEnd = toIsoYmd(newAssenzaDataFine);

              if (!isoStart || !isoEnd) {
                showNotification({ title: "Errore", message: "Formati data non validi", color: "red" });
                return;
              }

              // Ensure start <= end
              const startDate = new Date(isoStart);
              const endDate = new Date(isoEnd);
              if (startDate > endDate) {
                showNotification({ title: "Errore", message: "La data di inizio deve essere precedente o uguale alla data di fine", color: "red" });
                return;
              }

              try {
                const payload = {
                  operatore_id: Number(id),
                  tipoAssenza: newAssenzaTipo,
                  dataInizio: isoStart,
                  dataFine: isoEnd,
                };

                const res = await fetch("/api/assenze", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err?.detail || "Errore creazione assenza");
                }

                await mutate(`/api/utenti/${id}`);
                setIsCreateAssenzaModalOpen(false);
                setNewAssenzaTipo("FERIE");
                setNewAssenzaDataInizio(null);
                setNewAssenzaDataFine(null);
                showNotification({ title: "Successo", message: "Assenza creata", color: "green" });
              } catch (err) {
                showNotification({
                  title: "Errore",
                  message: err?.message || "Impossibile creare assenza",
                  color: "red",
                });
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
          value={editingAssenza ? (editingAssenza.data || "") : ""}
          onChange={(e) => setEditingAssenza((prev) => ({ ...(prev||{}), data: e.target.value }))}
          mb="sm"
        />
        <TextInput
          label="Data fine (dd/MM/YYYY)"
          placeholder="gg/MM/YYYY"
          value={editingAssenza ? (editingAssenza.dataFine || "") : ""}
          onChange={(e) => setEditingAssenza((prev) => ({ ...(prev||{}), dataFine: e.target.value }))}
          mb="md"
        />
        <Group justify="flex-end">
          <Button
            onClick={async () => {
              if (!editingAssenza) return;
              // Parse inputs into ISO Y-m-d
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
                await mutate(`/api/utenti/${id}`);
                setIsEditAssenzaModalOpen(false);
                setEditingAssenza(null);
                showNotification({ title: 'Successo', message: 'Assenza aggiornata', color: 'green' });
              } catch (err) {
                showNotification({ title: 'Errore', message: err?.message || 'Impossibile aggiornare assenza', color: 'red' });
              }
            }}
          >
            Salva
          </Button>
        </Group>
      </Modal>
    </RequireRole>
  );
}
