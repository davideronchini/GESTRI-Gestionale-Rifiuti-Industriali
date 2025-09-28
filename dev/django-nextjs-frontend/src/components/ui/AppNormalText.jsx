"use client";
import React from 'react';
import { Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppNormalText
 * - Reusable Text component with consistent theming.
 * - Uses normal font size from theme.
 * - Applies default colors based on theme.
 */
export default function AppNormalText({
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
    fontSize: textTheme.normal,
    ...style,
  };

  return (
    <Text
      style={themedStyles}
      {...props}
    />
  );
}