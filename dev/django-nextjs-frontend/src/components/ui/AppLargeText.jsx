"use client";
import React from 'react';
import { Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppLargeText
 * - Reusable Text component with consistent theming.
 * - Uses large font size from theme.
 * - Applies default colors based on theme.
 */
export default function AppLargeText({
  style,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appTextTheme = theme.other.components.appLargeText;
  const textTheme = theme.other.text;
  
  const themedStyles = {
    color: isDark ? appTextTheme.dark.color : appTextTheme.light.color,
    fontWeight: textTheme.medium,
    fontSize: textTheme.large,
    ...style,
  };

  return (
    <Text
      style={themedStyles}
      {...props}
    />
  );
}