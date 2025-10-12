"use client";

import React from 'react';
import { 
  AppShell, 
  Stack,
  Box
} from '@mantine/core';
import {
  IconTruck,
  IconUsers,
  IconLogout,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconBriefcase2,
  IconBriefcase2Filled,
  IconClipboardText,
  IconClipboardTextFilled,
  IconTruckFilled
} from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/authProvider';
import { notifications } from '@mantine/notifications';
import Image from 'next/image';
import AppNavLink from './AppNavLink';
import RequireRole from '../RequireRole';

/**
 * AppNavBar
 * - Barra laterale di navigazione dell'applicazione
 * - Contiene logo, controlli utente e link di navigazione
 * - Si adatta al tema corrente
 * - Visibile solo per utenti autenticati
 */
export default function AppNavBar({ opened, toggle }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleLogout = async () => {
    try {
      await auth.logout();
      notifications.show({
        title: 'Logout effettuato',
        message: 'Arrivederci!',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Errore',
        message: 'Errore durante il logout',
        color: 'red',
      });
    }
  };

  // Nota: nav links sono espliciti per permettere di avvolgerli singolarmente con RequireRole

  // Sincronizza activeIndex con pathname (gestito più sotto con navRoutes)

  const handleNavClick = (href, index) => {
    setActiveIndex(index); // Cambia immediatamente lo stato visivo
    router.push(href); // Poi naviga
  };

  // Non mostrare la sidebar se l'utente non è autenticato
  if (!auth.isAuthenticated) {
    return null;
  }

  // Route esplicite corrispondenti ai NavLink (stesso ordine usato sotto)
  const navRoutes = ['/', '/attivita', '/documenti', '/mezzi', '/utenti'];

  React.useEffect(() => {
    const currentIndex = navRoutes.findIndex(r => r === pathname);
    if (currentIndex !== -1 && currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }
  }, [pathname]);

  return (
    <AppShell.Navbar p="md">
      <Stack h="100%" justify="space-between">
        {/* Header della sidebar */}
        <Box>
          {/* Logo - visibile solo su desktop */}
          <Box mb="xl" visibleFrom="sm" style={{ textAlign: 'center', marginLeft: '10px', marginTop: '30px'}}>
            <Image 
              src="/images/logo.png" 
              alt="GESTRI logo"
              width={120} 
              height={48} 
              priority 
            />
          </Box>
          
          {/* Links di navigazione */}
          <Box style={{ position: 'relative', marginTop: '50px', marginLeft: '-10px' }}>
            {/* Sfondo verde animato */}
            <Box
              style={{
                position: 'absolute',
                top: `${activeIndex * 66}px`, // NavLink (56px) + gap xs (10px) = 66px
                left: '-16px',
                right: '-16px',
                height: '56px', // Solo l'altezza del NavLink
                backgroundColor: '#17BC6A',
                borderRadius: '0px',
                transition: 'top 0.18s ease-in-out',
                zIndex: 1,
                opacity: 1,
              }}
            />
            
            <Stack gap="xs" style={{ position: 'relative', zIndex: 2 }}>
              {/* Home */}
              <RequireRole allowedRoles={['STAFF', 'OPERATORE', 'CLIENTE']}>
              <AppNavLink
                href={'/'}
                label={'Home'}
                icon={IconLayoutDashboard}
                activeIcon={IconLayoutDashboardFilled}
                active={activeIndex === 0}
                onClick={() => handleNavClick('/', 0)}
                isActiveIndex={activeIndex === 0}
              />
              </RequireRole>

              {/* Attività */}
              <RequireRole allowedRoles={['STAFF', 'OPERATORE', 'CLIENTE']}>
              <AppNavLink
                href={'/attivita'}
                label={'Attività'}
                icon={IconBriefcase2}
                activeIcon={IconBriefcase2Filled}
                active={activeIndex === 1}
                onClick={() => handleNavClick('/attivita', 1)}
                isActiveIndex={activeIndex === 1}
              />
              </RequireRole>

              {/* Documenti */}
              <RequireRole allowedRoles={['STAFF']}>
              <AppNavLink
                href={'/documenti'}
                label={'Documenti'}
                icon={IconClipboardText}
                activeIcon={IconClipboardTextFilled}
                active={activeIndex === 2}
                onClick={() => handleNavClick('/documenti', 2)}
                isActiveIndex={activeIndex === 2}
              />
              </RequireRole>

              {/* Mezzi */}
              <RequireRole allowedRoles={['STAFF']}>
              <AppNavLink
                href={'/mezzi'}
                label={'Mezzi'}
                icon={IconTruck}
                activeIcon={IconTruckFilled}
                active={activeIndex === 3}
                onClick={() => handleNavClick('/mezzi', 3)}
                isActiveIndex={activeIndex === 3}
              />
              </RequireRole>

              {/* Utenti */}
              <RequireRole allowedRoles={['STAFF']}>
              <AppNavLink
                href={'/utenti'}
                label={'Utenti'}
                icon={IconUsers}
                activeIcon={IconUsers}
                active={activeIndex === 4}
                onClick={() => handleNavClick('/utenti', 4)}
                isActiveIndex={activeIndex === 4}
              />
              </RequireRole>
            </Stack>
          </Box>
        </Box>

        {/* Footer della sidebar con logout */}
        <Box style={{ marginLeft: '-10px' }}>
          <AppNavLink
            label="Logout"
            icon={IconLogout}
            activeIcon={IconLogout}
            onClick={handleLogout}
            isActiveIndex={false}
          />
        </Box>
      </Stack>
    </AppShell.Navbar>
  );
}