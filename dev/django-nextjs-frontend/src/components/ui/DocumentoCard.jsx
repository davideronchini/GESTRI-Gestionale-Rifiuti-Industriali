"use client";
import React, { useMemo, useState } from 'react';
import { Box, Button, Group, Image, useMantineTheme } from '@mantine/core';
import { Document, Page, pdfjs } from 'react-pdf';
import AppPaper from './AppPaper';
import AppLargeText from './AppLargeText';
import AppNormalText from './AppNormalText';
import AppSubmitButton from './AppSubmitButton';

// Configura il worker di PDF.js usando CDN per la versione compatibile con react-pdf 9.2.1
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

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
  const [pdfError, setPdfError] = useState(false);
  
  // Determina se il file è un PDF
  const isPdf = useMemo(() => {
    if (!previewSrc || typeof previewSrc !== 'string') return false;
    const lowerSrc = previewSrc.toLowerCase();
    return lowerSrc.endsWith('.pdf') || lowerSrc.includes('.pdf?');
  }, [previewSrc]);

  // Reset dell'errore quando cambia il file sorgente
  React.useEffect(() => {
    setPdfError(false);
  }, [previewSrc]);
  
  return (
    <AppPaper
      p={0}
      style={{ height: '100%', display: 'flex', alignItems: 'stretch', background: "#1C1E1E", borderRadius: '15px', padding: '0px', flexWrap: 'nowrap', ...style }}
      {...props}
    >
      {/* Image area: behaves as left column on wide, full-width on small */}
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, overflow: 'hidden', flex: '0 0 auto', width: 'auto' }}>
        <Box style={{ padding: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box', minHeight: 0 }}>
          {isPdf && previewSrc && !pdfError ? (
            // Mostra prima pagina del PDF
            <Box
              style={{
                width: 140,
                height: 180,
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: theme.colors.gray[8],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                margin: '0 auto'
              }}
            >
              <Document
                key={previewSrc} // Forza il remount quando cambia il file
                file={previewSrc}
                onLoadError={(error) => {
                  // Ignora silenziosamente gli errori 404 che possono verificarsi durante il cambio file
                  if (!error.message.includes('Missing PDF')) {
                    console.warn('PDF non disponibile:', error.message);
                  }
                  setPdfError(true);
                }}
                loading={
                  <Box style={{ color: theme.colors.gray[5], fontSize: '12px' }}>
                    Caricamento...
                  </Box>
                }
              >
                <Page
                  pageNumber={1}
                  width={140}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </Box>
          ) : (isPdf && pdfError) ? (
            // Fallback quando il PDF ha un errore
            <Image
              src="/images/FIR-preview.png"
              alt="Anteprima documento non disponibile"
              fit="cover"
              style={{ width: 140, height: 180, maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', backgroundColor: theme.colors.gray[3], flexShrink: 0, margin: '0 auto' }}
            />
          ) : previewSrc ? (
            // Mostra immagine per altri tipi di file
            <Image
              src={previewSrc}
              alt={title}
              fit="cover"
              style={{ width: 140, height: 180, maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', padding: '0px', flexShrink: 0, margin: '0 auto' }}
              onError={(e) => {
                // Fallback se anche l'immagine fallisce
                e.currentTarget.src = "/images/FIR-preview.png";
              }}
            />
          ) : (
            // Placeholder se non c'è preview
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
