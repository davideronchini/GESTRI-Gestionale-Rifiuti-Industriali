"use client";

import React from 'react';
import { Box, Group, Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppNavLink
 * - Custom NavLink completamente pulito per animazione fluida
 * - Nessuna transizione o hover che interferisce con l'animazione principale
 * - Tutto gestito dal parent AppNavBar
 */
export default function AppNavLink({
  icon: IconComponent,
  activeIcon: ActiveIconComponent,
  isActiveIndex = false,
  label,
  onClick,
  active, // Ignorato, usa isActiveIndex
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appNavLinkTheme = theme.other.components.appNavLink;
  const textTheme = theme.other.text;
  
  // Sceglie l'icona in base allo stato attivo
  const CurrentIconComponent = isActiveIndex && ActiveIconComponent ? ActiveIconComponent : IconComponent;
  
  // Colori fissi - nessuna logica hover
  const baseColor = isDark ? appNavLinkTheme.dark.color : appNavLinkTheme.light.color;
  const activeColor = '#ffffff'; // Bianco quando attivo
  
  return (
    <Box
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        paddingLeft: '25px',
        paddingTop: '15px',
        paddingBottom: '15px',
        backgroundColor: 'transparent',
        color: isActiveIndex ? activeColor : baseColor,
        fontWeight: isActiveIndex ? textTheme.medium : textTheme.regular,
        fontSize: textTheme.normal,
        zIndex: 3,
      }}
      {...props}
    >
      <Group wrap="nowrap">
        {CurrentIconComponent && (
          <CurrentIconComponent 
            style={{ 
              width: '25px', 
              height: '25px',
              strokeWidth: isActiveIndex ? '2' : '1.5',
              color: isActiveIndex ? activeColor : 'inherit'
            }} 
          />
        )}
        <Text 
          style={{ 
            color: 'inherit',
            fontWeight: textTheme.medium,
            fontSize: textTheme.normal,
            marginLeft: '-3px',
            marginTop: '3px',
          }}
        >
          {label}
        </Text>
      </Group>
    </Box>
  );
}