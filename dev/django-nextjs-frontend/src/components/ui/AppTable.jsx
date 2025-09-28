"use client"

import React from 'react';
import { Table, Text } from '@mantine/core';
import AppPaper from './AppPaper';

/**
 * AppTable
 * Props:
 * - columns: array of { key, title }
 * - data: array of objects where keys match column.key
 * - style: optional wrapper style
 */
export default function AppTable({ columns = [], data = [], style = {} }){
  // Header row
  const ths = (
    <tr style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
      {columns.map(col => (
        <th key={col.key} style={{ padding: '10px 12px', textAlign: 'left' }}>
          <Text weight={600} size="sm">{col.title}</Text>
        </th>
      ))}
    </tr>
  );

  // Body rows
  const rows = data.map((row, idx) => (
    <tr key={idx}>
      {columns.map(col => (
        <td key={col.key} style={{ padding: '10px 12px' }}>
          <Text size="sm">{row[col.key] ?? ''}</Text>
        </td>
      ))}
    </tr>
  ));

  return (
    <AppPaper style={{ padding: 12, ...style }}>
      <Table verticalSpacing="sm">
        <thead>{ths}</thead>
        <tbody>{rows}</tbody>
      </Table>
    </AppPaper>
  )
}
