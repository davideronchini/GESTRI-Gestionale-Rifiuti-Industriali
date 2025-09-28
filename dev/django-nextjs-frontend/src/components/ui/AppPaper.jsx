"use client";

import React from 'react';
import { Paper, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppPaper
 * - Reusable Paper with consistent radius and themed background.
 * - Dark theme: frosted glass (backdrop blur) + diagonal white gradient overlay.
 * - Light theme: subtle surface color (configurable) with optional border.
 */
export default function AppPaper({
  children,
  radius = 'md',
  p = 'xl',
  withBorder = true,
  style,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appPaperTheme = theme.other.components.appPaper;
  
  const darkStyles = {
    // Base translucent fill color
    backgroundColor: appPaperTheme.dark.bg,
    // Diagonal gradient overlay
    backgroundImage: appPaperTheme.dark.gradientOverlay,
    // Frosted glass
    backdropFilter: `blur(${appPaperTheme.dark.backdropBlur})`,
    WebkitBackdropFilter: `blur(${appPaperTheme.dark.backdropBlur})`,
    // Slight inner border to enhance glass look
    border: appPaperTheme.dark.border,
  };

  const lightStyles = {
    // Base translucent fill color
    backgroundColor: appPaperTheme.light.bg,
    // Diagonal gradient overlay
    backgroundImage: appPaperTheme.light.gradientOverlay,
    // Frosted glass
    backdropFilter: `blur(${appPaperTheme.light.backdropBlur})`,
    WebkitBackdropFilter: `blur(${appPaperTheme.light.backdropBlur})`,
    // Slight inner border to enhance glass look
    border: appPaperTheme.light.border,
  };

  return (
    <Paper
      radius={radius}
      p={p}
      withBorder={withBorder}
      style={{ ...(isDark ? darkStyles : lightStyles), ...style }}
      {...props}
    >
      {children}
    </Paper>
  );
}
