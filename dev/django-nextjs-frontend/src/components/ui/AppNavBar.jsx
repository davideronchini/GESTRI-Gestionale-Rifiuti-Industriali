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
      router.push('/login');
    } catch (error) {
      notifications.show({
        title: 'Errore',
        message: 'Errore durante il logout',
        color: 'red',
      });
    }
  };

  // Configurazione nav links
  const navLinks = [
    { href: '/', label: 'Home', icon: IconLayoutDashboard, activeIcon: IconLayoutDashboardFilled },
    { href: '/attivita', label: 'Attività', icon: IconBriefcase2, activeIcon: IconBriefcase2Filled },
    { href: '/documenti', label: 'Documenti', icon: IconClipboardText, activeIcon: IconClipboardTextFilled },
    { href: '/mezzi', label: 'Mezzi', icon: IconTruck, activeIcon: IconTruckFilled },
    { href: '/utenti', label: 'Utenti', icon: IconUsers, activeIcon: IconUsers },
  ];

  // Sincronizza activeIndex con pathname
  React.useEffect(() => {
    const currentIndex = navLinks.findIndex(link => link.href === pathname);
    if (currentIndex !== -1 && currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }
  }, [pathname]);

  const handleNavClick = (href, index) => {
    setActiveIndex(index); // Cambia immediatamente lo stato visivo
    router.push(href); // Poi naviga
  };

  // Non mostrare la sidebar se l'utente non è autenticato
  if (!auth.isAuthenticated) {
    return null;
  }

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
              {navLinks.map((link, index) => (
                <AppNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  activeIcon={link.activeIcon}
                  active={activeIndex === index}
                  onClick={() => handleNavClick(link.href, index)}
                  isActiveIndex={activeIndex === index}
                />
              ))}
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