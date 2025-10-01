"use client"

import React from 'react';
import { Table, Text, useMantineTheme, useMantineColorScheme, Menu, Title, Group, Box, TextInput } from '@mantine/core';
import { IconPlus, IconFilter, IconSearch } from '@tabler/icons-react';
import AppPaper from './AppPaper';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import AppNormalText from './AppNormalText';
import AppLargeText from './AppLargeText';
import AppTextInput from './AppTextInput';

/**
 * AppTable
 * Props:
 * - columns: array of { key, title }
 * - data: array of objects where keys match column.key
 * - style: optional wrapper style
 * - title: optional title for the table header (default: null - no header shown)
 * - iconActions: array of { label, action, icon? } for icon menu actions
 * - onHoverLineClick: function(row, index) called when hover line is clicked
 * - onAddClick: function called when plus icon is clicked
 * - onFilterClick: function called when filter icon is clicked
 * - onSearch: function(searchTerm) called when search input changes
 *
 * Note: Rows are not clickable for navigation. Only icons and hover line can be interactive.
 */
export default function AppTable({ 
  columns = [], 
  data = [], 
  style = {}, 
  title = null,
  idKey = 'id', 
  iconActions = [], 
  iconHoverColor = '#FF5555',
  onHoverLineClick,
  onAddClick,
  onFilterClick,
  onFilterChange,
  onSearch
}){
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Debug: log delle iconActions ricevute
  useEffect(() => {
    console.log('AppTable iconActions:', iconActions);
  }, [iconActions]);

  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.012)' : 'rgba(23,188,106,0.06)';
  // Header row
  const ths = (
    <tr style={{ background: '#242627'}}>
      {columns.map((col, index) => (
        <th key={col.key} style={{ 
          padding: index === 0 ? '10px 12px 10px 20px' : '10px 12px', 
          textAlign: 'left' 
        }}>
          <AppLargeText style={{fontSize:'15px', fontWeight: 600}} >{col.title}</AppLargeText>
        </th>
      ))}
      {/* Colonna invisibile per la linea dell'hover */}
      <th style={{ padding: '0', width: '4px', border: 'none' }}></th>
    </tr>
  );

  // Body rows (clickable, keyboard accessible)
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredIcon, setHoveredIcon] = useState(null); // { rowIndex }
  const [openedMenu, setOpenedMenu] = useState(null); // { rowIndex, colKey }
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]); // array di col.key per filtri multipli
  const searchTermRef = useRef(''); // ref per evitare loop infiniti
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [autoSelectDeselected, setAutoSelectDeselected] = useState(true);

  // Effetto per auto-selezionare "Deseleziona" quando non ci sono filtri
  useEffect(() => {
    setAutoSelectDeselected(selectedFilters.length === 0);
  }, [selectedFilters]);

  // Effetto per notificare il cambio filtro al componente padre
  useEffect(() => {
    if (onFilterChange) {
      // Passa sempre l'array dei filtri (vuoto se non ci sono filtri)
      onFilterChange(selectedFilters || []);
    }
  }, [selectedFilters, onFilterChange]);

  // Chiudi il menu quando si cambia riga o si preme ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenedMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Chiudi il menu quando si cambia riga hovered
  useEffect(() => {
    if (hoveredRow !== null && openedMenu && typeof openedMenu === 'string') {
      const menuRowIndex = openedMenu.split('-')[0];
      if (parseInt(menuRowIndex) !== hoveredRow) {
        setOpenedMenu(null);
      }
    }
  }, [hoveredRow, openedMenu]);

  const rows = data.map((row, idx) => {
    const rowId = row[idKey];

    const isHovered = hoveredRow === idx;

      return (
      <tr
        key={idx}
        onMouseEnter={(e) => {
          // Solo se non stiamo entrando nell'icona
          const tgt = e.target;
          const isInIconColumn = tgt && typeof tgt.closest === 'function'
            ? tgt.closest('td[data-icon-column="true"]')
            : false;
          if (!isInIconColumn) {
            setHoveredRow(idx);
          }
        }}
        onMouseLeave={(e) => {
          // Solo se non stiamo uscendo verso l'icona
          const rel = e.relatedTarget;
          const isRelatedIconColumn = rel && typeof rel.closest === 'function'
            ? rel.closest('td[data-icon-column="true"]')
            : false;
          if (!isRelatedIconColumn) {
            setHoveredRow(null);
          }
        }}
        onFocus={() => setHoveredRow(idx)}
        onBlur={() => setHoveredRow(null)}
        onClick={(e) => {
          // Evita conflitto con i click sulle icone/menu
          if (e.target && typeof e.target.closest === 'function' && e.target.closest('td[data-icon-column="true"]')) return;
          if (onHoverLineClick) onHoverLineClick(row, idx);
        }}
        style={{
          cursor: onHoverLineClick ? 'pointer' : 'default'
        }}
      >
        {columns.map((col, colIdx) => {
          const cellValue = row[col.key];
          
          const renderContent = () => {
            // Gestione speciale per la colonna dello stato
            if (col.key === 'stato') {
              const stato = String(cellValue).toUpperCase();
              let color = '#ADB5BD'; // grigio di default
              
              if (stato === 'PROGRAMMATA' || stato === 'PIANIFICATA') {
                color = '#FA5252'; // rosso
              } else if (stato === 'INIZIATA' || stato === 'IN_CORSO') {
                color = '#E29D14'; // arancione
              } else if (stato === 'TERMINATA' || stato === 'COMPLETATA') {
                color = '#17BC6A'; // verde
              }
              
              return (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start',
                  width: '100%',
                  height: '100%',
                  minHeight: '20px'
                }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      boxShadow: `0 0 0 2px ${color}20`
                    }}
                  />
                </div>
              );
            }
            
            // Se è un elemento React già renderizzato, usalo direttamente
            if (React.isValidElement(cellValue)) {
              return cellValue;
            }
            
            // Se è un componente React (funzione o oggetto con $$typeof)
            if (typeof cellValue === 'function' || 
                (cellValue && typeof cellValue === 'object' && cellValue.$$typeof)) {
              const IconComponent = cellValue;
              return <IconComponent size={20} />;
            }
            
            // Se è null, undefined o stringa vuota, mostra testo vuoto
            if (cellValue == null || cellValue === '') {
              return <Text size="sm">-</Text>;
            }
            
            // Se è un oggetto ma non un componente React, non renderizzarlo
            if (typeof cellValue === 'object') {
              return <Text size="sm">-</Text>;
            }
            
            // Altrimenti, è un valore primitivo (stringa, numero, etc.)
            return <Text size="sm">{String(cellValue)}</Text>;
          };
          
          // L'ultima colonna (icona) ha comportamento separato
          const isIconColumn = col.key === 'icona';
          const isIconHovered = hoveredIcon === idx;
          
          // Per la colonna icona con azioni, wrappa tutta la cella nel menu
          if (isIconColumn && iconActions && iconActions.length > 0) {
            const menuKey = `${idx}-${col.key}`;
            const isMenuOpen = openedMenu === menuKey;
            
            return (
              <td
                key={col.key}
                data-icon-column="true"
                style={{
                  padding: '0', // Rimuovi padding per far occupare tutto lo spazio al menu
                  position: 'relative',
                  zIndex: 1,
                  transition: 'background-color 120ms ease',
                  backgroundColor: isIconHovered ? hoverBg : 'transparent',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  setHoveredIcon(idx);
                  setHoveredRow(null);
                  e.stopPropagation();
                }}
                onMouseLeave={(e) => {
                  setHoveredIcon(null);
                  // Se il mouse esce dalla colonna icona ma è ancora sulla riga, ripristina l'hover della riga
                  if (e.relatedTarget && e.relatedTarget.closest('tr') === e.currentTarget.closest('tr')) {
                    setHoveredRow(idx);
                  }
                  e.stopPropagation();
                }}
              >
                <Menu 
                  shadow="md" 
                  width={200} 
                  opened={isMenuOpen}
                  onChange={(opened) => {
                    setOpenedMenu(opened ? menuKey : null);
                  }}
                  position="bottom-start"
                >
                  <Menu.Target>
                    <div 
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 12px', // Mantieni il padding qui
                        width: '100%',
                        height: '100%',
                        minHeight: '40px',
                        color: isIconHovered ? iconHoverColor : undefined // for text fallback
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Column clicked, current menu:', openedMenu, 'menuKey:', menuKey);
                        setOpenedMenu(isMenuOpen ? null : menuKey);
                      }}
                    >
                      {/**
                       * When cellValue is a valid React element, clone it to inject color prop/styles.
                       * When it's a component (function), create it with color prop.
                       * Otherwise render as text and apply color via style.
                       */}
                      {React.isValidElement(cellValue) ? (
                        React.cloneElement(cellValue, {
                          size: cellValue.props?.size ?? 20,
                          color: isIconHovered ? iconHoverColor : cellValue.props?.color,
                          stroke: isIconHovered ? iconHoverColor : cellValue.props?.stroke,
                          style: { ...(cellValue.props?.style || {}), color: isIconHovered ? iconHoverColor : cellValue.props?.style?.color, stroke: isIconHovered ? iconHoverColor : cellValue.props?.style?.stroke }
                        })
                      ) : (typeof cellValue === 'function' || (cellValue && typeof cellValue === 'object' && cellValue.$$typeof)) ? (
                        // cellValue is a component type
                        React.createElement(cellValue, { size: 20, color: isIconHovered ? iconHoverColor : undefined, stroke: isIconHovered ? iconHoverColor : undefined })
                      ) : (
                        <Text size="sm" style={{ color: isIconHovered ? iconHoverColor : undefined }}>{String(cellValue)}</Text>
                      )}
                    </div>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {iconActions.map((action, actionIdx) => (
                      <Menu.Item
                        key={actionIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Menu item clicked:', action.label);
                          action.action(row, idx);
                          setOpenedMenu(null);
                        }}
                      >
                        {action.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              </td>
            );
          }
          
          // Per tutte le altre colonne (normale)
          return (
            <td
              key={col.key}
              data-icon-column={isIconColumn ? "true" : undefined}
              style={{
                padding: colIdx === 0 ? '10px 12px 10px 20px' : '10px 12px',
                position: 'relative',
                zIndex: 1,
                transition: 'background-color 120ms ease',
                backgroundColor: isIconColumn ? (isIconHovered ? hoverBg : 'transparent') : (isHovered && !hoveredIcon ? hoverBg : 'transparent'),
                textAlign: col.key === 'icona' ? 'center' : 'left',
                cursor: isIconColumn && iconActions && iconActions.length > 0 ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                if (isIconColumn) {
                  setHoveredIcon(idx);
                  setHoveredRow(null);
                  e.stopPropagation();
                }
              }}
              onMouseLeave={(e) => {
                if (isIconColumn) {
                  setHoveredIcon(null);
                  // Se il mouse esce dalla colonna icona ma è ancora sulla riga, ripristina l'hover della riga
                  if (e.relatedTarget && e.relatedTarget.closest('tr') === e.currentTarget.closest('tr')) {
                    setHoveredRow(idx);
                  }
                  e.stopPropagation();
                }
              }}
            >
              {renderContent()}
            </td>
          );
        })}
        {/* Colonna della linea dell'hover */}
        <td
          style={{
            padding: '0',
            width: '4px',
            position: 'relative',
            cursor: onHoverLineClick ? 'pointer' : 'default',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 120ms ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onHoverLineClick) {
              onHoverLineClick(row, idx);
            }
          }}
        >
        </td>
      </tr>
    );
  });

  const handleSearchChange = (event) => {
    const value = event.currentTarget.value;
    setSearchTerm(value);
    searchTermRef.current = value; // mantieni il ref sincronizzato
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <AppPaper 
      style={{ 
        padding: 0, 
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        margin: 0, 
        borderRadius: '15px',
        border: isDark ? '1px solid #ffffff10' : '1px solid #00000010',
        ...style 
      }}
      sx={{
        padding: '0px !important',
        '& > *': {
          padding: 0
        }
      }}
    >
      {/* Header con titolo e controlli - solo se il titolo è fornito */}
      {title && (
        <Group justify="space-between" style={{ padding: '20px 20px 16px 20px', borderBottom: isDark ? '1px solid #373A40' : '1px solid #E5E7EB' }}>
          <Title order={3} size="h4" style={{ margin: 0, fontWeight: 600, fontSize: '16px', color: isDark ? '#EDEDED' : '#2C2C2C' }}>
            {title}
          </Title>
          
          <Group gap="sm">
            {/* Pulsante Plus */}
            {onAddClick && (
              <Box
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(23, 188, 106, 0.1)',
                  border: '1px solid #17BC6A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                onClick={onAddClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(23, 188, 106, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(23, 188, 106, 0.1)';
                }}
              >
                <IconPlus size={20} color="#17BC6A" />
              </Box>
            )}

            {/* Pulsante Filter -> apre un Menu con i titoli delle colonne per impostare il filtro */}
            {onFilterClick && (
              <Menu
                shadow="md"
                width={220}
                position="bottom-end"
                opened={isFilterMenuOpen}
                onChange={(open) => setIsFilterMenuOpen(open)}
              >
                <Menu.Target>
                  <Box
                    role="button"
                    aria-pressed={selectedFilters.length > 0}
                    onClick={(e) => {
                      // Toggle menu open state. Se il menu è aperto e ci sono filtri selezionati, cliccando il pulsante li cancella
                      if (isFilterMenuOpen) {
                        // deseleziona tutti i filtri se ce ne sono
                        if (selectedFilters.length > 0) {
                          setSelectedFilters([]);
                          setAutoSelectDeselected(true);
                          // NON resettare il termine di ricerca, mantieni quello corrente
                          // setSearchTerm('');
                          // searchTermRef.current = '';
                          // Rilancia la ricerca con il termine corrente ma senza filtri
                          if (onSearch && searchTermRef.current) {
                            console.log('Filter button clicked with active filters, re-triggering search with current term:', searchTermRef.current);
                            onSearch(searchTermRef.current);
                          } else if (onSearch) {
                            // Se non c'è termine di ricerca, esegui ricerca vuota
                            onSearch('');
                          }
                        }
                        setIsFilterMenuOpen(false);
                        return;
                      }
                      setIsFilterMenuOpen(true);
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: selectedFilters.length > 0 ? 'rgba(23, 188, 106, 0.12)' : '#242627',
                      border: selectedFilters.length > 0 ? '1px solid #17BC6A' : '0px solid rgba(255, 255, 255, 0.50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = selectedFilters.length > 0 ? 'rgba(23, 188, 106, 0.14)' : 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedFilters.length > 0 ? 'rgba(23, 188, 106, 0.12)' : '#242627';
                    }}
                  >
                    <IconFilter size={20} color={selectedFilters.length > 0 ? '#17BC6A' : 'rgba(255, 255, 255, 0.50)'} />
                  </Box>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Filtra per colonna</Menu.Label>
                  <Menu.Item
                    key="deseleziona"
                    onClick={() => {
                      const newFilters = [];
                      setSelectedFilters(newFilters);
                      setAutoSelectDeselected(true);
                      // NON resettare il termine di ricerca, mantieni quello corrente
                      // setSearchTerm('');
                      // searchTermRef.current = ''; 
                      
                      // Notifica immediatamente il cambio filtri al padre
                      if (onFilterChange) {
                        console.log('Deseleziona clicked, notifying parent with empty filters');
                        onFilterChange(newFilters);
                      }
                      
                      setIsFilterMenuOpen(false);
                      const input = document.querySelector('input[aria-label="app-table-search"]');
                      if (input) input.focus();
                    }}
                    style={autoSelectDeselected ? { color: '#17BC6A', fontWeight: 600 } : undefined}
                  >
                    Deseleziona
                  </Menu.Item>
                  {columns.map((col) => (
                    <Menu.Item
                      key={col.key}
                        onClick={() => {
                          // Toggle del filtro: aggiungi se non presente, rimuovi se presente
                          const isSelected = selectedFilters.includes(col.key);
                          const newFilters = isSelected 
                            ? selectedFilters.filter(f => f !== col.key)
                            : [...selectedFilters, col.key];
                          
                          // Aggiorna lo stato dei filtri
                          setSelectedFilters(newFilters);
                          
                          // Se non ci sono filtri selezionati, auto-seleziona "Deseleziona"
                          if (newFilters.length === 0) {
                            setAutoSelectDeselected(true);
                          } else {
                            setAutoSelectDeselected(false);
                          }
                          
                          // Notifica immediatamente il cambio filtri al padre
                          if (onFilterChange) {
                            console.log('Filter toggled, notifying parent with filters:', newFilters);
                            onFilterChange(newFilters);
                          }
                          
                          try { onFilterClick(col); } catch (e) { /* ignore */ }
                          
                          // Non chiudere il menu per permettere selezioni multiple
                          // setIsFilterMenuOpen(false);
                          
                          // focus the input if present
                          const input = document.querySelector('input[aria-label="app-table-search"]');
                          if (input) input.focus();
                        }}
                      style={selectedFilters.includes(col.key) ? { color: '#17BC6A', fontWeight: 600 } : undefined}
                    >
                      {col.title || col.key}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}

            {/* Barra di ricerca */}
            {onSearch && (
              <TextInput
                aria-label="app-table-search"
                // Do not use placeholder prop: mimic placeholder with actual text when not focused and empty
                value={isSearchFocused ? searchTerm : (searchTerm === '' ? 'Cerca...' : searchTerm)}
                onChange={handleSearchChange}
                onFocus={() => {
                  // Clear the displayed placeholder when focusing
                  setIsSearchFocused(true);
                  if (searchTerm === '') {
                    // ensure real input is empty on focus
                    setSearchTerm('');
                    searchTermRef.current = ''; // mantieni il ref sincronizzato
                  }
                }}
                onBlur={() => {
                  // Stop editing; if empty, the display will show 'cerca...'
                  setIsSearchFocused(false);
                }}
                leftSection={<IconSearch style={{ width: '20px', height: '20px', color: '#919293', marginLeft: '5px', strokeWidth: '1.7' }} />}
                styles={{
                  input: {
                    paddingLeft: '40px',
                    borderRadius: '20px',
                    border: `0px solid ${isDark ? '#373A40' : '#CED4DA'}`,
                    backgroundColor: isDark ? '#242627' : '#FFFFFF',
                    // If we're showing the faux-placeholder, use a muted color
                    color: !isSearchFocused && searchTerm === '' ? '#919293' : (isDark ? 'rgba(255, 255, 255, 0.5)' : '#2C2C2C'),
                    caretColor: isDark ? 'rgba(255, 255, 255, 0.5)' : '#000000',
                    fontStyle: !isSearchFocused && searchTerm === '' ? 'italic' : 'normal'
                  },
                }}
              />
            )}
          </Group>
        </Group>
      )}

      {/* Tabella senza padding */}
      <Table
        verticalSpacing="sm"
        highlightOnHover
        withRowBorders={false}
        style={{marginBottom: '15px'}}
        sx={{
          // Rimuovi completamente margin e padding dalla tabella
          margin: 0,
          width: '100%',
          // Ensure hover color is applied to table cells even if parent styles conflict
          'tbody tr': {
            // make tr a positioned container so we can draw a continuous pseudo-element
            position: 'relative',
          },
          'tbody tr td': {
            // make sure cells can show a background and sit above the pseudo-element
            position: 'relative',
            zIndex: 1,
            transition: 'background-color 120ms ease',
            backgroundColor: 'transparent',
          },
          // Rimuovi padding dalle prime e ultime celle per toccare i bordi
          'thead tr th:first-of-type, tbody tr td:first-of-type': {
            paddingLeft: '20px',
          },
          'thead tr th:last-of-type, tbody tr td:last-of-type': {
            paddingRight: '0px',
          },
          // Assicurati che la tabella occupi tutto lo spazio disponibile
          'table': {
            margin: 0,
            width: '100%',
          }
        }}
      >
        <thead>{ths}</thead>
        <tbody>{rows}</tbody>
      </Table>
    </AppPaper>
  )
}
