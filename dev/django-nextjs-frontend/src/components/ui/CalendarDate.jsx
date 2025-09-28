"use client";
import React from 'react';
import { Box, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import AppSmallText from './AppSmallText';

/**
 * CalendarDate
 * - Componente che mostra un giorno del calendario
 * - Container rettangolare con bordi arrotondati
 * - Mostra giorno della settimana e numero del giorno
 */
export default function CalendarDate({
  day,
  dayOfWeek,
  isSelected = false,
  onClick,
  style,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appIconTheme = theme.other.components.appIcon;
  
  const containerStyles = {
    backgroundColor: isSelected 
      ? theme.other.components.appSubmitButton.light.bg
      : isDark 
        ? '#1C1E1E'
        : 'rgba(0, 0, 0, 0.05)',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '50px',
    width: '50px',
    height: '75px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: isSelected 
        ? theme.other.components.appSubmitButton.light.hoverBg
        : isDark 
          ? '#1C1E1E' 
          : 'rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-1px)',
    },
    ...style,
  };

  const textColor = isSelected 
    ? '#ffffff'
    : '#17BC6A'

  return (
    <Box
      style={containerStyles}
      onClick={onClick}
      {...props}
    >
      <AppSmallText 
        style={{ 
          color: textColor, 
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '2px',
          textTransform: 'uppercase'
        }}
      >
        {dayOfWeek}
      </AppSmallText>
      <AppSmallText 
        style={{ 
          color: isSelected ? '#ffffff' : isDark ? appIconTheme.dark.color : appIconTheme.light.color, 
          fontSize: '20px',
          fontWeight: '600'
        }}
      >
        {day}
      </AppSmallText>
    </Box>
  );
}