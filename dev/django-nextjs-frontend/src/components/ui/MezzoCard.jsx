"use client";
import React from 'react';
import { Box, Button, Image, useMantineTheme } from '@mantine/core';
import AppPaper from './AppPaper';
import AppLargeText from './AppLargeText';
import AppNormalText from './AppNormalText';
import AppSubmitButton from './AppSubmitButton';

export default function MezzoCard({
  previewSrc,
  id,
  stato = 'DISPONIBILE',
  onView,
  style,
  ...props
}) {
  const theme = useMantineTheme();

  const getStatusColor = (s) => {
    switch ((s || '').toUpperCase()) {
      case 'DISPONIBILE':
        return '#17BC6A';
      case 'MANUTENZIONE':
        return '#f59e0b';
      case 'OCCUPATO':
        return '#ef4444';
      default:
        return theme.colors.gray[5];
    }
  };

  const statusColor = getStatusColor(stato);

  return (
    <AppPaper
      p={0}
      style={{ height: '100%', display: 'flex', alignItems: 'stretch', background: "#1C1E1E", borderRadius: '15px', padding: '0px', flexWrap: 'nowrap', ...style }}
      {...props}
    >
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, overflow: 'hidden', flex: '0 0 auto', width: 'auto' }}>
        <Box style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box', minHeight: 0 }}>
          <Image
            src={previewSrc ?? '/images/login-bg.png'}
            alt={`Mezzo#${id}`}
            fit="cover"
            style={{ width: 120, height: 120, maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', padding: '0px', flexShrink: 0, margin: '0 auto' }}
          />
        </Box>
      </Box>

      <Box style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', paddingRight: '20px', boxSizing: 'border-box', overflow: 'hidden' }}>
        <Box style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', minWidth: 0, overflow: 'hidden', marginTop: '20px' }}>
          <AppLargeText style={{ fontSize: 18, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '6px', display: 'block', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            Mezzo#{id}
          </AppLargeText>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <AppNormalText style={{ fontSize: 14, color: theme.colors.gray[6] }}>
              Stato:
            </AppNormalText>
            <Box style={{ width: '10px', height: '10px', borderRadius: '999px', backgroundColor: statusColor }} />
          </Box>
        </Box>

        <Box style={{ marginTop: '16px', width: '100%', alignSelf: 'stretch' }}>
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
