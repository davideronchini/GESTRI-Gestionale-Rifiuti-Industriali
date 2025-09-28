"use client";
import React from 'react';
import { Box, Group, useMantineColorScheme, useMantineTheme, Menu, ActionIcon } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { IconBriefcase2, IconHourglassHigh, IconShoppingBag } from '@tabler/icons-react';
import AppNormalText from './AppNormalText';
import AppSmallText from './AppSmallText';
import AppLargeText from './AppLargeText';
import AppPaper from './AppPaper';

/**
 * AttivitaCard
 * - Componente per mostrare un'attività con orario, durata e dettagli
 * - Layout: orario e durata a sinistra, AppPaper con dettagli a destra
 * - Icona bag colorata del verde dei bottoni submit
 */
export default function AttivitaCard({
  id, // optional; used for navigation
  orario,
  durata,
  titolo,
  operatori,
  isSelected = false,
  style,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: '0px',
        paddingTop: '0px',
        paddingBottom: '10px',
        ...style
      }}
      {...props}
    >
      {/* Sezione sinistra: Orario e Durata */}
      <Box style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: '100px',
      }}>
        {/* Orario */}
        <AppLargeText style={{
          fontSize: '26px',
          fontWeight: '800',
        }}>
          {orario}
        </AppLargeText>

        {/* Durata con icona clessidra - allineati agli estremi */}
        <Group gap={6} position="apart" align="center">
          <IconHourglassHigh 
            style={{ width: '17px', height: '17px', color:'#919293', strokeWidth: '1.7' }}
          />
          <AppSmallText style={{ 
            fontSize: '12px',
            fontWeight: '400'
          }}>
            {durata}
          </AppSmallText>
        </Group>
      </Box>

      {/* Sezione destra: AppPaper con dettagli attività */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <AppPaper 
        h={65}
        p={'md'}
        style={{
          // Force no gradient overlay so explicit backgroundColor is visible
          backgroundImage: 'none',
          backgroundColor: "#1C1E1E",
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flex: 1,
          minWidth: 0,
          borderRadius: '15px',
          // show selection border only on the right-side AppPaper
          border: isSelected ? '2px solid #17BC6A' : '2px solid transparent',
          boxSizing: 'border-box',
        }}>
          {/* Icona Bag colorata */}
          <IconBriefcase2 
            style={{
              width: '26px',
              height: '28px',
              color: isSelected ? '#17BC6A' : '#BBBBBB',
              strokeWidth: '1.7',
              flexShrink: 0
            }}
          />

          {/* Dettaglio testo */}

          {/* Dettagli attività */}
          <Box style={{ flex: 1, align: 'center', minWidth: 0 }}>
            {/* Titolo attività */}
            <AppLargeText style={{
              fontSize: '15px',
              fontWeight: '600',
              paddingBottom: '0px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {titolo}
            </AppLargeText>

            {/* Operatori */}
            <AppSmallText style={{
              fontSize: '13px',
              fontWeight: '400',
              paddingTop: '0px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {operatori}
            </AppSmallText>
          </Box>

          {/* Menu a tre puntini */}
          <Box style={{ flexShrink: 0 }}>
            <Menu withArrow position="bottom-end">
              <Menu.Target>
                <ActionIcon aria-label="menu-attivita" variant="subtle" style={{ marginTop:'10px',}}>
                  <IconDots style={{
                  width: '28px',
                  height: '28px',
                  color: isSelected ? '#17BC6A' : '#BBBBBB',
                  strokeWidth: '1.7',
                  flexShrink: 0
                }} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => { if (id) router.push(`/attivita/${id}`); }}>
                  Apri attività
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        </AppPaper>
      </Box>
    </Box>
  );
}