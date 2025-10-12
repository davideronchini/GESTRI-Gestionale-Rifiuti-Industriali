"use client";
import React from 'react';
import { Box, Button, Image, useMantineTheme, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import AppPaper from './AppPaper';
import { DJANGO_MEDIA_URL } from '@/config/config';
import AppLargeText from './AppLargeText';
import AppNormalText from './AppNormalText';
import AppSubmitButton from './AppSubmitButton';

export default function MezzoCard({
  previewSrc,
  id,
  stato = 'DISPONIBILE',
  onView,
  onDelete,
  // prop that controls whether the card shows edit/delete controls
  isEditable = false,
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
      style={{ height: '150px', minWidth: '350px', display: 'flex', alignItems: 'stretch', background: "#1C1E1E", borderRadius: '15px', padding: '0px', flexWrap: 'nowrap', ...style }}
      {...props}
    >
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, overflow: 'hidden', flex: '0 0 auto', width: 'auto' }}>
        <Box style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box', minHeight: '0'}}>
          <Image
            src={(() => {
              // Debug: log incoming previewSrc
              try { console.debug('MezzoCard previewSrc:', previewSrc); } catch (e) {}

              if (previewSrc === null || previewSrc === undefined) return '/images/login-bg.png';

              // Normalize strings
              if (typeof previewSrc === 'string') {
                const trimmed = previewSrc.trim();
                if (!trimmed || trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'null') {
                  return '/images/login-bg.png';
                }
              }

              // If previewSrc is an object like { name: 'file.jpg' }
              let srcValue = previewSrc;
              if (typeof previewSrc === 'object' && previewSrc !== null) {
                if (previewSrc.name) srcValue = previewSrc.name;
                else return '/images/login-bg.png';
              }

              // Absolute URL
              if (typeof srcValue === 'string' && /^https?:\/\//i.test(srcValue)) {
                try { console.debug('MezzoCard resolved absolute URL:', srcValue); } catch (e) {}
                return srcValue;
              }

              // Already root-anchored path
              if (typeof srcValue === 'string' && srcValue.startsWith('/')) {
                try { console.debug('MezzoCard resolved root path:', srcValue); } catch (e) {}
                return srcValue;
              }

              // If backend returns 'media/...' prefix, strip it
              if (typeof srcValue === 'string' && srcValue.startsWith('media/')) {
                const resolved = `${DJANGO_MEDIA_URL}${srcValue.replace(/^media\//, '')}`;
                try { console.debug('MezzoCard resolved media/ prefixed path:', resolved); } catch (e) {}
                return resolved;
              }

              // Default: treat as media filename and prepend DJANGO_MEDIA_URL
              const resolvedDefault = `${DJANGO_MEDIA_URL}${srcValue}`;
              try { console.debug('MezzoCard resolved default media URL:', resolvedDefault); } catch (e) {}
              return resolvedDefault;
            })()}
            alt={`Mezzo#${id}`}
            fit="cover"
            onError={(e) => {
              // fallback to placeholder if image cannot be loaded
              try { e.currentTarget.src = '/images/login-bg.png'; } catch (err) { /* ignore */ }
            }}
            style={{ width: '120px', height: '120px', maxWidth: '100%', objectFit: 'cover', borderRadius: '8px', padding: '0px', flexShrink: 0, margin: '0 auto', boxSizing: 'border-box' }}
          />
        </Box>
      </Box>

      <Box style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', paddingRight: '20px', boxSizing: 'border-box', overflow: 'hidden' }}>
        <Box style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', minWidth: 0, overflow: 'hidden', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <AppLargeText style={{ fontSize: 18, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0px', display: 'block', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              Mezzo#{id}
            </AppLargeText>
            {isEditable && typeof onDelete === 'function' && (
              <ActionIcon
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                variant="transparent"
                title="Rimuovi mezzo"
                style={{ marginLeft: '8px' }}
              >
                <IconTrash style={{ width: '25px', height: '25px', color: '#919293', strokeWidth: '1.7' }} />
              </ActionIcon>
            )}
          </div>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0px' }}>
            <AppNormalText style={{ fontSize: 14, color: theme.colors.gray[6] }}>
              Stato:
            </AppNormalText>
            <Box style={{ width: '10px', height: '10px', borderRadius: '999px', backgroundColor: statusColor }} />
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
