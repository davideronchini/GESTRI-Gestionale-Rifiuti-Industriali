"use client";
import React from 'react';
import { Box, Button, Image, useMantineTheme } from '@mantine/core';
import AppPaper from './AppPaper';
import AppLargeText from './AppLargeText';
import AppNormalText from './AppNormalText';

export default function UtenteCard({ previewSrc, id, nome, ruolo = '', stato = 'ATTIVO', onView, style, ...props }) {
  const theme = useMantineTheme();

  const getStatusColor = (s) => {
    switch ((s || '').toUpperCase()) {
      case 'ATTIVO':
        return '#17BC6A';
      case 'ASSENTE':
        return '#f59e0b';
      case 'BLOCCATO':
        return '#ef4444';
      default:
        return theme.colors.gray[5];
    }
  };

  const statusColor = getStatusColor(stato);

  return (
    <AppPaper
      p={0}
      style={{ height: '150px', minWidth: '350px', display: 'flex', alignItems: 'stretch', background: "#1C1E1E", borderRadius: '15px', padding: '0px', flexWrap: 'nowrap', ...style }}
      {...props}
    >
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, overflow: 'hidden', flex: '0 0 auto', width: 'auto' }}>
        <Box style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box', minHeight: 0 }}>
          <Image
            src={previewSrc ?? '/images/generic-user.png'}
            alt={nome ? nome : `Utente#${id}`}
            fit="cover"
            style={{ width: '120px', height: '120px', maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', padding: '0px', flexShrink: 0, margin: '0 auto' }}
          />
        </Box>
      </Box>

  <Box style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', paddingRight: '20px', boxSizing: 'border-box', overflow: 'hidden' }}>
        <Box style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', minWidth: 0, overflow: 'hidden', marginTop: '20px' }}>
          <AppLargeText style={{ fontSize: 18, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0px', display: 'block', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            {nome ? nome : `Utente#${id}`}
          </AppLargeText>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0px' }}>
            <AppNormalText style={{ fontSize: 14, color: theme.colors.gray[6] }}>
              {`ID: ${id}`}
            </AppNormalText>
          </Box>
        </Box>

        <Box style={{ marginTop: '20px', width: '100%', alignSelf: 'stretch' }}>
          <Button
            onClick={onView}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: 'transparent',
              borderRadius: '10px',
              border: `1px solid #17BC6A`,
              fontWeight: 400,
              fontSize: 14,
              color: '#17BC6A',
              padding: '8px 12px'
            }}
          >
            Vedi
          </Button>
        </Box>
      </Box>
    </AppPaper>
  );
}
