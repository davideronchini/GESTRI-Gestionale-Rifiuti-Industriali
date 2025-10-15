"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState, useRef, useEffect } from "react";
import { Container, Box, Group, useMantineTheme, Menu, Avatar, useMantineColorScheme, Image } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import AppLargeText from '@/components/ui/AppLargeText';
import { IconBell, IconMoon, IconSettings, IconSun, IconUser, IconArrowNarrowLeft, IconCheck, IconUpload, IconLock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import AppInputField from '@/components/ui/AppInputField';
import RequireRole from "@/components/RequireRole";

export default function CreaMezzoRimorchioPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 1050px)', false, { getInitialValueInEffect: true });

  // Mezzo
  const [targa, setTarga] = useState("");
  const [chilometraggio, setChilometraggio] = useState("");
  const [consumoCarburante, setConsumoCarburante] = useState("");
  const [scadenzaRevisione, setScadenzaRevisione] = useState("");
  const [scadenzaAssicurazione, setScadenzaAssicurazione] = useState("");
  const [statoMezzo, setStatoMezzo] = useState("DISPONIBILE");
  const [mezzoImageFile, setMezzoImageFile] = useState(null);
  const [mezzoImagePreview, setMezzoImagePreview] = useState(null);
  const mezzoImageInputRef = useRef(null);

  // Rimorchio
  const [rimorchioId, setRimorchioId] = useState("");
  const [rimorchioNome, setRimorchioNome] = useState("");
  const [rimorchioCapacita, setRimorchioCapacita] = useState("");
  const [rimorchioTipo, setRimorchioTipo] = useState("ALTRO");
  const [rimorchioImageFile, setRimorchioImageFile] = useState(null);
  const [rimorchioImagePreview, setRimorchioImagePreview] = useState(null);
  const rimorchioImageInputRef = useRef(null);

  const STATI_MEZZO_VALIDI = [
    { value: 'DISPONIBILE', label: 'Disponibile' },
    { value: 'OCCUPATO', label: 'Occupato' },
    { value: 'MANUTENZIONE', label: 'In manutenzione' }
  ];

  const TIPI_RIMORCHIO_VALIDI = [
    { value: 'RIBALTABILE', label: 'Ribaltabile' },
    { value: 'COMPATTANTE', label: 'Compattante' },
    { value: 'CISTERNA', label: 'Cisterna' },
    { value: 'PIANALE', label: 'Pianale' },
    { value: 'CASSONE', label: 'Cassone' },
    { value: 'SCARRABILE', label: 'Scarrabile' },
    { value: 'ALTRO', label: 'Altro' }
  ];

  const authGuard = useAuthGuard();
  // Rely on useAuthGuard internal redirect handling and use the early-return below

  const handleProfile = () => router.push('/profile');
  const handleSettings = () => router.push('/settings');
  const handleThemeToggle = () => toggleColorScheme();

  const formatDateToISO = (ddmmyyyy) => {
    if (!ddmmyyyy) return null;
    const [day, month, year] = ddmmyyyy.split('/');
    if (!day || !month || !year) return null;
    return `${year}-${month}-${day}`;
  };

  const uploadImage = async (file, entityType, entityId) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('immagine', file);
    try {
      const res = await fetch(`/api/${entityType}/${entityId}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.immagine;
    } catch {
      return null;
    }
  };

  const handleCreate = async () => {
    try {
      // Determine what the user actually filled in
      const mezzoFieldsFilled = (
        targa.trim() !== '' ||
        chilometraggio.trim() !== '' ||
        consumoCarburante.trim() !== '' ||
        scadenzaRevisione.trim() !== '' ||
        scadenzaAssicurazione.trim() !== '' ||
        mezzoImageFile !== null
      );

      const rimorchioFieldsFilled = (
        rimorchioId.toString().trim() !== '' ||
        rimorchioNome.trim() !== '' ||
        rimorchioCapacita.trim() !== '' ||
        rimorchioImageFile !== null
      );

      if (!mezzoFieldsFilled && !rimorchioFieldsFilled) {
        showNotification({ title: 'Errore', message: 'Devi inserire almeno un mezzo o un rimorchio', color: 'red' });
        return;
      }

      // If the user provided any mezzo information (other than targa), require targa
      const mezzoHasOnlyTarga = (targa.trim() !== '' && !(
        chilometraggio.trim() !== '' || consumoCarburante.trim() !== '' || scadenzaRevisione.trim() !== '' || scadenzaAssicurazione.trim() !== ''
      ));

      const requiresTarga = (
        mezzoHasOnlyTarga ? false : (
          (chilometraggio.trim() !== '' || consumoCarburante.trim() !== '' || scadenzaRevisione.trim() !== '' || scadenzaAssicurazione.trim() !== '')
        )
      );

      if (requiresTarga && !targa.trim()) {
        showNotification({ title: 'Errore', message: "La targa del mezzo è obbligatoria se inserisci informazioni del mezzo", color: 'red' });
        return;
      }

      // If the user provided rimorchio info but did NOT provide an existing rimorchioId, require rimorchio nome
      const rimIdTrim = rimorchioId.toString().trim();
      if (rimorchioFieldsFilled && !rimIdTrim && !rimorchioNome.trim()) {
        showNotification({ title: 'Errore', message: 'Il nome del rimorchio è obbligatorio se inserisci informazioni del rimorchio (a meno che non specifichi un ID rimorchio esistente)', color: 'red' });
        return;
      }

      // Build payload including only the entities the user provided
      const payload = {};
      if (mezzoFieldsFilled) {
        payload.mezzo = {
          targa: targa.trim().toUpperCase(),
          chilometraggio: chilometraggio ? parseInt(chilometraggio, 10) : 0,
          consumoCarburante: consumoCarburante ? parseFloat(consumoCarburante) : 0.0,
          scadenzaRevisione: formatDateToISO(scadenzaRevisione),
          scadenzaAssicurazione: formatDateToISO(scadenzaAssicurazione),
          statoMezzo: (statoMezzo || 'DISPONIBILE').toUpperCase(),
        };
      }

      if (rimorchioFieldsFilled) {
        const rimIdVal = rimorchioId.toString().trim();
        if (rimIdVal) {
          // If user provided an existing rimorchio id, pass it so the proxy can reuse it
          payload.rimorchio = { id: Number(rimIdVal) };
        } else {
          payload.rimorchio = {
            nome: rimorchioNome.trim(),
            capacitaDiCarico: rimorchioCapacita ? parseFloat(rimorchioCapacita) : 0.0,
            tipoRimorchio: (rimorchioTipo || 'ALTRO').toUpperCase(),
          };
        }
      }

      // Debug: log payload being sent
      console.debug('[CreaMezzo] payload', payload);

      const res = await fetch('/api/mezzo/crea', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let result = {};
      try { result = text && text.length > 0 ? JSON.parse(text) : {}; } catch(e) { result = { detail: text }; }

      console.debug('[CreaMezzo] response status', res.status, 'body', result);

      if (!res.ok) {
        throw new Error(result?.error || result?.message || result?.detail || `Errore creazione mezzo-rimorchio (${res.status})`);
      }

      // 4) Upload immagini (opzionali) using returned IDs
      const createdMezzoId = result?.mezzo?.id;
      const createdRimorchioId = result?.rimorchio?.id;
      const createdAssociazioneId = result?.associazione?.id;

      if (mezzoImageFile && createdMezzoId) {
        await uploadImage(mezzoImageFile, 'mezzi', createdMezzoId);
      }
      if (rimorchioImageFile && createdRimorchioId) {
        await uploadImage(rimorchioImageFile, 'rimorchi', createdRimorchioId);
      }

      // Success -> always redirect back to mezzi list/table
      showNotification({ title: 'Successo', message: 'Mezzo-Rimorchio creato', color: 'green' });
      router.push('/mezzi');
    } catch (error) {
      showNotification({ title: 'Errore', message: error?.message || 'Creazione fallita', color: 'red' });
    }
  };

  const handleMezzoImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMezzoImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setMezzoImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRimorchioImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRimorchioImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setRimorchioImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (authGuard.isLoading) return <div>Caricamento...</div>;
  if (!authGuard.isAuthenticated) return null;

  return (
    <RequireRole
                allowedRoles={['STAFF']}
                fallback={<div style={{ padding: '1rem', textAlign: 'start' }}>Non hai i permessi per visualizzare questa pagina.</div>}>
    <Container size="lg">
      <Box style={{marginTop: '24px'}}>
        <Group justify="space-between" align="center">
          <Group justify="start" align="center">
            <IconArrowNarrowLeft style={{ cursor: 'pointer', marginRight: '0px' }} onClick={() => router.back()} />
            <AppLargeText order={1}>Nuovo Mezzo-Rimorchio</AppLargeText>
            <IconCheck 
              style={{ 
                width: '25px', height: '25px', marginLeft: '12px', strokeWidth: '1.7', cursor: 'pointer',
                color: colorScheme === 'dark' 
                  ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                  : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)')
              }}
              onClick={handleCreate}
            />
          </Group>
          <Group>
            <IconBell style={{ width: '25px', height: '25px', marginLeft: '10px', strokeWidth: '1.7',
              color: colorScheme === 'dark' 
                ? (theme.other?.components?.appIcon?.dark?.color || '#ffffff')
                : (theme.other?.components?.appIcon?.light?.color || 'rgba(44, 44, 44, 1)') }} />
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Avatar color="blue" radius="xl" size={45} style={{ cursor: 'pointer' }}>
                  {authGuard.email ? authGuard.email.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />} onClick={handleProfile}>Profilo</Menu.Item>
                <Menu.Item leftSection={<IconSettings size={14} />} rightSection={<IconLock size={14} />} onClick={() => showNotification({ title: 'Funzione bloccata', message: 'Questa funzione non è disponibile', color: 'yellow' })} style={{ cursor: 'not-allowed', opacity: 0.6 }}>Impostazioni</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconSun size={14} />} rightSection={<IconLock size={14} />} onClick={() => showNotification({ title: 'Funzione bloccata', message: 'Questa funzione non è disponibile', color: 'yellow' })} style={{ cursor: 'not-allowed', opacity: 0.6 }}>
                  Tema Chiaro
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Sezione Mezzo */}
        <div style={{ 
          display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', width: '100%', marginTop: '30px', alignItems: 'flex-start' 
        }}>
          <div style={{ flex: isMobile ? 'none' : '0 0 45%', width: isMobile ? '100%' : '45%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AppInputField id="mezzo-targa" label="Targa" placeholder="--" value={targa} editable onChange={(e) => setTarga((e.target.value || '').toUpperCase())} />
            <AppInputField id="mezzo-chilometraggio" label="Chilometraggio" placeholder="0" value={chilometraggio} editable onChange={(e) => setChilometraggio(e.target.value)} />
            <AppInputField id="mezzo-consumo" label="Consumo Carburante (L/100km)" placeholder="0.0" value={consumoCarburante} editable onChange={(e) => setConsumoCarburante(e.target.value)} />
            <AppInputField id="mezzo-revisione" label="Scadenza Revisione" placeholder="dd/MM/yyyy" value={scadenzaRevisione} editable onChange={(e) => setScadenzaRevisione(e.target.value)} />
            <AppInputField id="mezzo-assicurazione" label="Scadenza Assicurazione" placeholder="dd/MM/yyyy" value={scadenzaAssicurazione} editable onChange={(e) => setScadenzaAssicurazione(e.target.value)} />
            <AppInputField
              id="mezzo-stato"
              label="Stato Mezzo"
              placeholder="DISPONIBILE"
              value={statoMezzo}
              editable
              onChange={(e) => setStatoMezzo(e.target.value)}
              onClick={() => showNotification({ title: 'Valori stato mezzo', message: 'Valori ammessi: DISPONIBILE, OCCUPATO, MANUTENZIONE', color: 'blue' })}
            />
          </div>
          <div style={{ flex: isMobile ? 'none' : '1', width: isMobile ? '100%' : 'auto', maxWidth: '100%', position: 'relative' }}>
            <input ref={mezzoImageInputRef} type="file" accept="image/*" onChange={handleMezzoImageChange} style={{ display: 'none' }} />
            <div
              onClick={() => mezzoImageInputRef.current?.click()}
              style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <IconUpload size={20} color="#ffffff" />
            </div>
            <Image src={mezzoImagePreview || '/images/login-bg.png'} alt="Immagine mezzo" radius="md" style={{ width: '100%', height: 'auto', objectFit: 'cover', cursor: 'pointer' }} onClick={() => mezzoImageInputRef.current?.click()} />
          </div>
        </div>

        {/* Sezione Rimorchio */}
        <AppLargeText style={{marginTop: '60px', fontSize: '18px', fontWeight: '600',}}>Rimorchio</AppLargeText>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', width: '100%', marginTop: '10px', alignItems: 'flex-start' }}>
          <div style={{ flex: isMobile ? 'none' : '0 0 45%', width: isMobile ? '100%' : '45%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AppInputField
              id="rimorchio-id"
              label="ID Rimorchio (opzionale)"
              placeholder="--"
              value={rimorchioId}
              editable={!rimorchioNome && !rimorchioCapacita}
              onChange={(e) => {
                const v = e.target.value;
                setRimorchioId(v);
                if (v && v.toString().trim() !== '') {
                  // if id provided, clear other rimorchio fields
                  setRimorchioNome('');
                  setRimorchioCapacita('');
                  setRimorchioTipo('ALTRO');
                }
              }}
            />
            <AppInputField
              id="rimorchio-nome"
              label="Nome"
              placeholder="--"
              value={rimorchioNome}
              editable={!rimorchioId}
              onChange={(e) => {
                const v = e.target.value;
                setRimorchioNome(v);
                if (v && v.toString().trim() !== '') {
                  // if some rimorchio field filled, clear id
                  setRimorchioId('');
                }
              }}
            />
            <AppInputField
              id="rimorchio-capacita"
              label="Capacità"
              placeholder="0.00"
              value={rimorchioCapacita}
              editable={!rimorchioId}
              onChange={(e) => {
                const v = e.target.value;
                setRimorchioCapacita(v);
                if (v && v.toString().trim() !== '') {
                  setRimorchioId('');
                }
              }}
            />
            <AppInputField
              id="rimorchio-tipo"
              label="Tipo"
              placeholder="ALTRO"
              value={rimorchioTipo}
              editable={!rimorchioId}
              onChange={(e) => {
                setRimorchioTipo(e.target.value);
                if (e.target.value && e.target.value.toString().trim() !== '') setRimorchioId('');
              }}
              onClick={() => showNotification({ title: 'Valori tipo rimorchio', message: 'Valori ammessi: RIBALTABILE, COMPATTANTE, CISTERNA, PIANALE, CASSONE, SCARRABILE, ALTRO', color: 'blue' })}
            />
          </div>
          <div style={{ flex: isMobile ? 'none' : '1', width: isMobile ? '100%' : 'auto', maxWidth: '100%', position: 'relative' }}>
            <input ref={rimorchioImageInputRef} type="file" accept="image/*" onChange={handleRimorchioImageChange} style={{ display: 'none' }} />
            <div
              onClick={() => rimorchioImageInputRef.current?.click()}
              style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <IconUpload size={20} color="#ffffff" />
            </div>
            <Image src={rimorchioImagePreview || '/images/login-bg.png'} alt="Immagine rimorchio" radius="md" style={{ width: '100%', height: 'auto', objectFit: 'cover', cursor: 'pointer' }} onClick={() => rimorchioImageInputRef.current?.click()} />
          </div>
        </div>
      </Box>
    </Container>
    </RequireRole>
  );
}
