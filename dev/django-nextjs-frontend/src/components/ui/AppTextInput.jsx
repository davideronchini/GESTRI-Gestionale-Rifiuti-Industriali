"use client";

import React from 'react';
import { TextInput, useMantineColorScheme, useMantineTheme } from '@mantine/core';

/**
 * AppTextInput
 * - Reusable TextInput with consistent theming.
 * - Dark theme: dark background with light borders.
 * - Light theme: light background with subtle borders.
 */
export default function AppTextInput({
  style,
  icon: IconComponent,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get styling from centralized theme
  const appTextInputTheme = theme.other.components.appTextInput;
  const textTheme = theme.other.text;
  
  const themedStyles = {
    backgroundColor: isDark ? appTextInputTheme.dark.bg : appTextInputTheme.light.bg,
    border: isDark ? appTextInputTheme.dark.border : appTextInputTheme.light.border,
    color: isDark ? appTextInputTheme.dark.color : appTextInputTheme.light.color,
    fontWeight: textTheme.medium,
    fontSize: textTheme.normal,
    borderRadius: '15px',
    height: '52px',
    paddingLeft: IconComponent ? '55px' : '15px',
    paddingRight: '15px',
    '&:focus': {
      border: isDark ? appTextInputTheme.dark.focusBorder : appTextInputTheme.light.focusBorder,
    },
  };

  const leftSection = IconComponent ? <IconComponent style={{ width: '25px', height: '25px', color: themedStyles.color, marginLeft: '10px', strokeWidth: '1.7' }} /> : null;

  return (
    <TextInput
      styles={{
        input: themedStyles,
      }}
      leftSection={leftSection}
      leftSectionWidth={IconComponent ? 55 : undefined}
      style={style}
      {...props}
    />
  );
}