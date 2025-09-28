"use client";

import React from 'react';
import { Button, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppSubmitButton
 * - Reusable Button with consistent theming for submit actions.
 * - Dark theme: consistent styling.
 * - Light theme: consistent styling.
 */
export default function AppSubmitButton({
  style,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appSubmitButtonTheme = theme.other.components.appSubmitButton;
  const textTheme = theme.other.text;
  
  const themedStyles = {
    backgroundColor: isDark ? appSubmitButtonTheme.dark.bg : appSubmitButtonTheme.light.bg,
    color: isDark ? appSubmitButtonTheme.dark.color : appSubmitButtonTheme.light.color,
    fontWeight: textTheme.bold,
    fontSize: textTheme.normal,
    borderRadius: '15px',
    height: '48px',
  };

  return (
    <Button
      styles={{
        root: themedStyles,
      }}
      style={style}
      {...props}
    />
  );
}