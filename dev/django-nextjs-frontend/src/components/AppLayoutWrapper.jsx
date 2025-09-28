"use client";

import React from 'react';
import { AppShell, Group, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/providers/authProvider';
import { usePathname } from 'next/navigation';
import { IconMenu2, IconSun } from '@tabler/icons-react';
import Image from 'next/image';
import { useMantineColorScheme } from '@mantine/core';
import AppNavBar from '@/components/ui/AppNavBar';

/**
 * AppLayoutWrapper
 * - Wrapper per il layout dell'applicazione con AppShell
 * - Gestisce la navbar laterale e l'header
 * - Mostra la navbar solo per utenti autenticati
 * - Nasconde la navbar su pagine pubbliche come login/register
 */
export default function AppLayoutWrapper({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const auth = useAuth();
  const pathname = usePathname();
  const { colorScheme } = useMantineColorScheme();

  // Pagine dove non mostrare la navbar (pagine pubbliche)
  const publicPages = ['/login', '/register', '/logout'];
  const isPublicPage = publicPages.includes(pathname);

  // Se è una pagina pubblica, mostra solo il contenuto senza AppShell
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Se l'utente non è autenticato e non è una pagina pubblica, 
  // mostra solo il contenuto senza navbar
  if (!auth.isAuthenticated) {
    return (
      <AppShell padding="md">
        <AppShell.Main style={{ backgroundColor: colorScheme === 'dark' ? '#1C1E1E' : undefined }}>
          {children}
        </AppShell.Main>
      </AppShell>
    );
  }

  // Layout completo per utenti autenticati
  return (
    <AppShell
      header={{ height: { base: 80, sm: 0 } }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      {/* Header mobile - visibile solo su schermi piccoli */}
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={toggle}
            >
              <IconMenu2 size="1.125rem" />
            </ActionIcon>
            <Image 
              src="/images/logo.png" 
              alt="GESTRI logo"
              width={100} 
              height={40} 
              priority 
            />
          </Group>
          
          {/* Toggle tema mobile - rimosso per UI mobile pulita */}
        </Group>
      </AppShell.Header>

      <AppNavBar opened={opened} toggle={toggle} />
      
      <AppShell.Main style={{ backgroundColor: colorScheme === 'dark' ? '#181919' : '#d5e0e0ff' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}