"use client"

import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { 
  Container, 
  Box,
  Group,
} from '@mantine/core';
import Image from 'next/image';
import AppPaper from '@/components/ui/AppPaper';
import AppTextInput from '@/components/ui/AppTextInput';
import AppPasswordInput from '@/components/ui/AppPasswordInput';
import AppSubmitButton from '@/components/ui/AppSubmitButton';
import { IconLock, IconMail, IconUserSquareRounded } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import AppSmallText from "@/components/ui/AppSmallText";
import { useAuth } from "@/providers/authProvider";
import { useEffect } from "react";

const REGISTER_URL = '/api/register/'

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();

  // Redirect se già autenticato
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.replace('/');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  const form = useForm({
    initialValues: {
      nome: '',
      cognome: '',
      email: '',
      password: '',
    },
    validate: {
      nome: (value) => (value.length < 1 ? 'Nome richiesto' : null),
      cognome: (value) => (value.length < 1 ? 'Cognome richiesto' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email non valida'),
      password: (value) => (value.length < 1 ? 'Password richiesta' : null),
    },
  });

  // Mostra loading durante l'inizializzazione dell'auth
  if (auth.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se già autenticato, non mostrare la form (redirect in corso)
  if (auth.isAuthenticated) {
    return null;
  }

  async function handleSubmit(values) {
    const jsonData = JSON.stringify(values);
    try {
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: jsonData,
      });
      // Safely parse JSON; handle empty body or non-JSON gracefully
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (data?.registered) {
        notifications.show({
          title: 'Registrazione completata',
          message: 'Account creato con successo! Ora puoi effettuare il login.',
          color: 'green',
        });
        // Redirect al login dopo registrazione completata
        router.push('/login');
      } else {
        const errorMessage =
          (data && (data.error || data.detail || data.message)) ||
          (response.status >= 500
            ? 'Errore del server, riprova più tardi'
            : 'Dati di registrazione non validi');
        notifications.show({
          title: 'Errore di registrazione',
          message: errorMessage,
          color: 'red',
        });
      }
    } catch(error) {
      console.error("Registration error", error);
      notifications.show({
        title: 'Errore',
        message: 'Si è verificato un errore durante la registrazione',
        color: 'red',
      });
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        position: 'relative',
        backgroundImage: "url('/images/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--mantine-spacing-md)'
      }}
    >
      <Container w={530}>
        <AppPaper p="xl"  pos="relative" style={{ zIndex: 2}}>
          <Box style={{ display: 'flex', justifyContent: 'center', marginTop: '35px' }}>
            <Image src="/images/logo.png" alt="GESTRI logo" width={170} height={90} priority />
          </Box>

          <form onSubmit={form.onSubmit(handleSubmit)}>

            <AppTextInput
              name="nome"
              placeholder="Nome"
              type="text"
              required
              style={{ marginTop: '60px' }}
              icon={IconUserSquareRounded}
              {...form.getInputProps('nome')}
            />

            <AppTextInput
              name="cognome"
              placeholder="Cognome"
              type="text"
              required
              style={{ marginTop: '20px' }}
              icon={IconUserSquareRounded}
              {...form.getInputProps('cognome')}
            />

            <AppTextInput
              name="email"
              placeholder="Email"
              type="email"
              required
              style={{ marginTop: '20px' }}
              icon={IconMail}
              {...form.getInputProps('email')}
            />

            <AppPasswordInput
              name="password"
              placeholder="Password"
              required
              style={{ marginTop: '20px' }}
              icon={IconLock}
              {...form.getInputProps('password')}
            />

            <AppSubmitButton fullWidth type="submit" style={{ marginTop: '50px' }}>
              REGISTRATI
            </AppSubmitButton>

            <Group justify="center" style={{ marginTop: '15px' }}>
              <AppSmallText>
                Hai già un account?{' '}
                <span 
                  style={{ textDecoration: 'underline', textUnderlineOffset: '5px', textDecorationThickness: '0.5px', cursor: 'pointer'}}
                  onClick={() => router.push('/login')}
                >
                  Accedi
                </span>
              </AppSmallText>
            </Group>
          </form>
        </AppPaper>
      </Container>
    </Box>
  );
}