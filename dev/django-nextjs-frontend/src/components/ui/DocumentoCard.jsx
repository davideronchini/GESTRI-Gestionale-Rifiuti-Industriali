"use client";
import React from 'react';
import { Box, Button, Group, Image, useMantineTheme } from '@mantine/core';
import AppPaper from './AppPaper';
import AppLargeText from './AppLargeText';
import AppNormalText from './AppNormalText';
import AppSubmitButton from './AppSubmitButton';

export default function DocumentoCard({
  previewSrc,
  title,
  subtitle,
  documentId,
  onOpen,
  style,
  ...props
}) {
  const theme = useMantineTheme();
  return (
    <AppPaper
      p={0}
      style={{ height: '100%', display: 'flex', alignItems: 'stretch', background: "#1C1E1E", borderRadius: '15px', padding: '0px', flexWrap: 'nowrap', ...style }}
      {...props}
    >
      {/* Image area: behaves as left column on wide, full-width on small */}
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, overflow: 'hidden', flex: '0 0 auto', width: 'auto' }}>
        <Box style={{ padding: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box', minHeight: 0 }}>
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={title}
              fit="cover"
              style={{ width: 140, height: 180, maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', padding: '0px', flexShrink: 0, margin: '0 auto' }}
            />
          ) : (
            <Image
              src="/images/FIR-preview.png"
              alt="Anteprima documento"
              fit="cover"
              style={{ width: 140, height: 180, maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', backgroundColor: theme.colors.gray[3], flexShrink: 0, margin: '0 auto' }}
            />
          )}
        </Box>
      </Box>

      {/* Content area: grows and wraps; center alignment on wide, left alignment when stacked */}
  <Box style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', paddingRight: '30px', boxSizing: 'border-box', overflow: 'hidden' }}>

        <Box style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', minWidth: 0, overflow: 'hidden', marginTop: '35px' }}>
            <AppLargeText
              title={typeof title === 'string' ? title : undefined}
              style={{
                fontSize: 18,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '20px',
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              {title}
            </AppLargeText>
            <AppNormalText
              title={typeof documentId !== 'undefined' && documentId !== null ? `FIR#${documentId}` : undefined}
              style={{
                fontSize: 16,
                color: theme.colors.gray[6],
                marginTop: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                marginTop: '-2px',
              }}
            >
              FIR#{documentId ?? ''}
            </AppNormalText>
          </Box>

        <Box style={{ marginTop: '40px', width: '100%', alignSelf: 'stretch' }}>
          <Button
            onClick={onOpen}
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
            Apri
          </Button>
        </Box>
      </Box>
    </AppPaper>
  );
}
