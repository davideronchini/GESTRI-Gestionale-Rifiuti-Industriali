"use client"

import { useAuth } from "@/providers/authProvider";
import { useForm } from '@mantine/form';
import { 
  Container, 
  Box,
  Group,
  Loader,
  Center,
} from '@mantine/core';
import { useEffect } from 'react';
import Image from 'next/image';
import AppPaper from '@/components/ui/AppPaper';
import AppTextInput from '@/components/ui/AppTextInput';
import AppPasswordInput from '@/components/ui/AppPasswordInput';
import AppSubmitButton from '@/components/ui/AppSubmitButton';
import { IconLock, IconMail } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import AppSmallText from "@/components/ui/AppSmallText";
import { useRouter, useSearchParams } from "next/navigation";

const LOGIN_URL = '/api/login/'

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email non valida'),
      password: (value) => (value.length < 1 ? 'Password richiesta' : null),
    },
  });

  // Reindirizza gli utenti già autenticati
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      console.log('🔐 LoginPage: User already authenticated, redirecting');
      
      // Controlla se c'è un next parameter
      const nextParam = searchParams?.get('next');
      const decodedNext = nextParam ? decodeURIComponent(nextParam) : null;
      const invalidPages = ['/login', '/register', '/logout'];
      const isSafeNext = decodedNext && decodedNext.startsWith('/') && !invalidPages.includes(decodedNext);
      
      // Redirect alla pagina appropriata
      const redirectTo = isSafeNext ? decodedNext : '/';
      router.replace(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, searchParams]);

  // Mostra loading durante l'inizializzazione dell'auth o durante il redirect
  if (auth.isLoading || (!auth.isLoading && auth.isAuthenticated)) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  async function handleSubmit(values) {
    const jsonData = JSON.stringify(values);
    try {
      const response = await fetch(LOGIN_URL, {
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

      if (data?.loggedIn) {
        notifications.show({
          title: 'Login effettuato',
          message: `Benvenuto ${data.email}`,
          color: 'green',
        });
            // Do a single whoami check to confirm server-side session (no polling/delays).
            // If it fails, we still proceed to update client state because whoami is a best-effort
            // verification (the backend session/cookies are authoritative).
            try {
              const who = await fetch('/api/whoami', { method: 'GET', credentials: 'include' });
              if (!who.ok) {
                console.warn('Login: whoami returned not-ok status', who.status);
              }
            } catch (e) {
              console.warn('Login: whoami call failed', e);
            }

            auth.login(data?.email);
      } else {
        const errorMessage =
          (data && (data.error || data.detail || data.message)) ||
          (response.status >= 500
            ? 'Errore del server, riprova più tardi'
            : 'Credenziali non valide');
        notifications.show({
          title: 'Errore di login',
          message: errorMessage,
          color: 'red',
        });
      }
    } catch(error) {
      console.error("Login error", error);
      notifications.show({
        title: 'Errore',
        message: 'Si è verificato un errore durante il login',
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
              name="email"
              placeholder="Email"
              type="email"
              required
              style={{ marginTop: '60px' }}
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
              ACCEDI
            </AppSubmitButton>

            <Group justify="space-between" style={{ marginTop: '15px' }}>
              <AppSmallText>
                Non hai un account?{' '}
                <span onClick={() => router.push('/register')} style={{ textDecoration: 'underline', textUnderlineOffset: '5px', textDecorationThickness: '0.5px', cursor: 'pointer'}}>
                  Registrati
                </span>
              </AppSmallText>
              <AppSmallText>
                  Password dimenticata?
              </AppSmallText>
            </Group>
          </form>
        </AppPaper>
      </Container>
    </Box>
  );
}