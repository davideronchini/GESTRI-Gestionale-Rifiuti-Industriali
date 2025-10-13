"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Group,
  useMantineTheme,
  Menu,
  Avatar,
  useMantineColorScheme,
  ScrollArea,
  Text,
  Button,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import AppLargeText from "@/components/ui/AppLargeText";
import AppInputField from "@/components/ui/AppInputField";
import AppAssociationItem from "@/components/ui/AppAssociationItem";
import {
  IconArrowNarrowLeft,
  IconCheck,
  IconBell,
  IconUser,
  IconSettings,
  IconSun,
  IconMoon,
  IconPlus,
  IconCalendarEvent,
  IconTrash,
  IconFileTypePdf,
  IconLock,
} from "@tabler/icons-react";
import RequireRole from "@/components/RequireRole";

export default function CreaUtentePage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 1050px)", false, { getInitialValueInEffect: true });

  // Campi anagrafica
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [ruolo, setRuolo] = useState("OPERATORE");
  const [dataDiNascita, setDataDiNascita] = useState("");
  const [luogoDiNascita, setLuogoDiNascita] = useState("");
  const [residenza, setResidenza] = useState("");
  const [password, setPassword] = useState("");

  // Immagine profilo: rimosso upload/selection su richiesta; mostriamo solo iniziali

  // Colonne associazioni (placeholder durante creazione)
  const [assenzeSelezionate] = useState([]);
  const [attivitaSelezionate] = useState([]);
  const [attestatiSelezionati] = useState([]);

  const authGuard = useAuthGuard();

  useEffect(() => {
    if (authGuard.isLoading) return;
    if (!authGuard.isAuthenticated && !authGuard.redirectInProgress) {
      authGuard.triggerRedirect('session lost - redirect from utenti crea page');
    }
  }, [authGuard.isLoading, authGuard.isAuthenticated, authGuard.redirectInProgress]);

  const handleProfile = () => router.push("/profile");
  const handleSettings = () => router.push("/settings");
  const handleThemeToggle = () => toggleColorScheme();

  // Rimosso: selezione immagine profilo non supportata in questa fase

  const toIso = (ddmmyyyy) => {
    if (!ddmmyyyy) return null;
    const [d, m, y] = ddmmyyyy.split("/");
    if (!d || !m || !y) return null;
    return `${y}-${m}-${d}`;
  };

  const handleCreate = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        showNotification({ title: "Errore", message: "Email e password sono obbligatorie", color: "red" });
        return;
      }

      // Normalizza e valida ruolo: accetta solo OPERATORE o STAFF
      const normalizedRole = ruolo ? String(ruolo).toUpperCase() : '';
      if (normalizedRole && !['OPERATORE', 'STAFF'].includes(normalizedRole)) {
        showNotification({ title: 'Errore', message: 'Ruolo non valido. Usa OPERATORE o STAFF.', color: 'red' });
        return;
      }

      const payload = {
        nome: nome || null,
        cognome: cognome || null,
        email: email.trim(),
        password: password.trim(),
        ruolo: normalizedRole || 'OPERATORE',
        dataDiNascita: toIso(dataDiNascita),
        luogoDiNascita: luogoDiNascita || null,
        residenza: residenza || null,
      };

      const res = await fetch("/api/utenti/crea", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.detail || err?.error || "Errore creazione utente";
        throw new Error(msg);
      }

      const nuovo = await res.json();
      const newId = nuovo?.id || nuovo?.data?.id || null;

      // Upload immagine profilo non supportato

      showNotification({ title: "Successo", message: "Utente creato", color: "green" });
      if (newId) router.push(`/utenti/${newId}`);
      else router.push("/utenti");
    } catch (error) {
      showNotification({ title: "Errore", message: error?.message || "Creazione fallita", color: "red" });
    }
  };

  if (authGuard.isLoading) return <div>Caricamento...</div>;
  if (!authGuard.isAuthenticated) return null;

  return (
    <RequireRole allowedRoles={['STAFF']} fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
    <Container size="lg">
      <Box style={{ marginTop: 24 }}>
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group align="center">
            <IconArrowNarrowLeft style={{ cursor: "pointer" }} onClick={() => router.back()} />
            <AppLargeText>Nuovo Utente</AppLargeText>
            <IconCheck
              style={{
                width: "25px",
                height: "25px",
                marginLeft: "12px",
                strokeWidth: "1.7",
                cursor: "pointer",
                color:
                  colorScheme === "dark"
                    ? theme.other?.components?.appIcon?.dark?.color || "#ffffff"
                    : theme.other?.components?.appIcon?.light?.color || "rgba(44, 44, 44, 1)",
              }}
              onClick={handleCreate}
            />
          </Group>
          <Group>
            <IconBell
              style={{
                width: "25px",
                height: "25px",
                marginLeft: "10px",
                strokeWidth: "1.7",
                color:
                  colorScheme === "dark"
                    ? theme.other?.components?.appIcon?.dark?.color || "#ffffff"
                    : theme.other?.components?.appIcon?.light?.color || "rgba(44, 44, 44, 1)",
              }}
            />
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
                  onClick={() =>
                    showNotification({
                      title: "Funzione bloccata",
                      message: "Questa funzione non è disponibile",
                      color: "yellow",
                    })
                  }
                  style={{ cursor: "not-allowed", opacity: 0.6 }}
                >
                  Impostazioni
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconSun size={14} />}
                  rightSection={<IconLock size={14} />}
                  onClick={() =>
                    showNotification({
                      title: "Funzione bloccata",
                      message: "Questa funzione non è disponibile",
                      color: "yellow",
                    })
                  }
                  style={{ cursor: "not-allowed", opacity: 0.6 }}
                >
                  Tema Chiaro
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Sezione anagrafica con avatar */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "24px",
            width: "100%",
            marginTop: "30px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: isMobile ? "100%" : "20%",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Avatar
                src={null}
                size={isMobile ? 120 : 160}
                radius="50%"
                alt="Immagine profilo"
              >
                {(nome || "").charAt(0)}
                {(cognome || "").charAt(0)}
              </Avatar>
              {/* Bottone rimosso: selezione immagine non disponibile */}
            </div>
          </div>

          {/* Campi input */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-nome"
                  label="Nome"
                  placeholder="--"
                  value={nome}
                  editable
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-cognome"
                  label="Cognome"
                  placeholder="--"
                  value={cognome}
                  editable
                  onChange={(e) => setCognome(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <Menu shadow="md" width={160} position="bottom-start">
                    <Menu.Target>
                      <div>
                        <AppInputField
                          id="utente-ruolo"
                          label="Ruolo"
                          placeholder="OPERATORE"
                          value={ruolo}
                          editable
                          onChange={(e) => setRuolo(e.target.value)}
                        />
                      </div>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => setRuolo('OPERATORE')}>OPERATORE</Menu.Item>
                      <Menu.Item onClick={() => setRuolo('STAFF')}>STAFF</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-data-nascita"
                  label="Data di Nascita"
                  placeholder="dd/MM/YYYY"
                  value={dataDiNascita}
                  editable
                  onChange={(e) => setDataDiNascita(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "10px" }}>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-luogo-nascita"
                  label="Luogo di Nascita"
                  placeholder="--"
                  value={luogoDiNascita}
                  editable
                  onChange={(e) => setLuogoDiNascita(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-residenza"
                  label="Residenza"
                  placeholder="--"
                  value={residenza}
                  editable
                  onChange={(e) => setResidenza(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "10px" }}>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-email"
                  label="Email"
                  placeholder="--"
                  value={email}
                  editable
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <AppInputField
                  id="utente-password"
                  label="Password"
                  placeholder="--"
                  value={password}
                  editable
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sezione entità associate */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "32px" : "12px",
            marginTop: "60px",
            width: "100%",
          }}
        >
          {/* Assenze */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" align="center" style={{ marginBottom: "12px" }}>
              <AppLargeText style={{ fontSize: "18px", fontWeight: "600" }}>Assenze</AppLargeText>
              <IconPlus
                style={{ cursor: "not-allowed", width: '22px', height: '22px', color: '#17BC6A', strokeWidth: '1.7' }}
                onClick={() =>
                  showNotification({
                    title: "Non disponibile",
                    message: "Aggiungi assenza disponibile dopo la creazione",
                    color: "yellow",
                  })
                }
              />
            </Group>
            <ScrollArea style={{ height: "40vh" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {assenzeSelezionate.length > 0 ? (
                  assenzeSelezionate.map((a) => (
                    <AppAssociationItem
                      key={a.id}
                      leftIcon={<IconCalendarEvent style={{ width: "25px", height: "25px", color: "#919293", strokeWidth: "1.7" }} />}
                      title={a.titolo || "Assenza"}
                      rightIcon={<IconTrash style={{ width: "25px", height: "25px", color: "#919293", strokeWidth: "1.7" }} />}
                    />
                  ))
                ) : (
                  <Text c="dimmed" ta="center" mt="md">
                    Nessuna assenza (disponibile dopo creazione)
                  </Text>
                )}
              </div>
            </ScrollArea>
          </div>

          {!isMobile && (
            <div style={{ width: "1px", background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
          )}

          {/* Attività */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" align="center" style={{ marginBottom: "12px" }}>
              <AppLargeText style={{ fontSize: "18px", fontWeight: "600" }}>Attività</AppLargeText>
              <IconPlus
                style={{ cursor: "not-allowed", width: '22px', height: '22px', color: '#17BC6A', strokeWidth: '1.7' }}
                onClick={() =>
                  showNotification({
                    title: "Non disponibile",
                    message: "Associa attività disponibile dopo la creazione",
                    color: "yellow",
                  })
                }
              />
            </Group>
            <ScrollArea style={{ height: "40vh" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {attivitaSelezionate.length > 0 ? (
                  attivitaSelezionate.map((att) => (
                    <AppAssociationItem
                      key={att.id}
                      leftText={`#${att.id}`}
                      title={att.titolo}
                      rightIcon={<IconTrash style={{ width: "25px", height: "25px", color: "#919293", strokeWidth: "1.7" }} />}
                    />
                  ))
                ) : (
                  <Text c="dimmed" ta="center" mt="md">
                    Nessuna attività (disponibile dopo creazione)
                  </Text>
                )}
              </div>
            </ScrollArea>
          </div>

          {!isMobile && (
            <div style={{ width: "1px", background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
          )}

          {/* Attestati */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" align="center" style={{ marginBottom: "12px" }}>
              <AppLargeText style={{ fontSize: "18px", fontWeight: "600" }}>Attestati</AppLargeText>
              <IconPlus
                style={{ cursor: "not-allowed", width: '22px', height: '22px', color: '#17BC6A', strokeWidth: '1.7' }}
                onClick={() =>
                  showNotification({
                    title: "Non disponibile",
                    message: "Aggiungi attestato disponibile dopo la creazione",
                    color: "yellow",
                  })
                }
              />
            </Group>
            <ScrollArea style={{ height: "40vh" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {attestatiSelezionati.length > 0 ? (
                  attestatiSelezionati.map((doc) => (
                    <AppAssociationItem
                      key={doc.id}
                      leftIcon={<IconFileTypePdf style={{ width: "25px", height: "25px", color: "#919293", marginRight: "10px", strokeWidth: "1.7" }} />}
                      title={doc.nome}
                      rightIcon={<IconTrash style={{ width: "25px", height: "25px", color: "#919293", strokeWidth: "1.7" }} />}
                    />
                  ))
                ) : (
                  <Text c="dimmed" ta="center" mt="md">
                    Nessun attestato (disponibile dopo creazione)
                  </Text>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Box>
    </Container>
    </RequireRole>
  );
}
