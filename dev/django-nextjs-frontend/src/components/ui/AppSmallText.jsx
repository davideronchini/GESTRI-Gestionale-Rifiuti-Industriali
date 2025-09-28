"use client";

import React from 'react';
import { Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppText
 * - Reusable Text component with consistent theming.
 * - Applies default colors based on theme.
 */
export default function AppSmallText({
  style,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appTextTheme = theme.other.components.appSmallText;
  const textTheme = theme.other.text;
  
  const themedStyles = {
    color: isDark ? appTextTheme.dark.color : appTextTheme.light.color,
    fontWeight: textTheme.regular,
    fontSize: textTheme.small,
    ...style,
  };

  return (
    <Text
      style={themedStyles}
      {...props}
    />
  );
}