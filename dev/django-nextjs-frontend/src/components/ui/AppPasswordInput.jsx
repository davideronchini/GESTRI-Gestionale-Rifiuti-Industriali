"use client";

import React from 'react';
import { PasswordInput, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

/**
 * AppPasswordInput
 * - Reusable PasswordInput with consistent theming.
 * - Dark theme: dark background with light borders.
 * - Light theme: light background with subtle borders.
 */
export default function AppPasswordInput({
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
  };

  const leftSection = IconComponent ? <IconComponent style={{ width: '25px', height: '25px', color: themedStyles.color, marginLeft: '10px', strokeWidth: '1.7' }} /> : null;

  return (
    <PasswordInput
      styles={{
        input: themedStyles,
        rightSection: {
          marginRight: '25px',
        },
      }}
      rightSectionWidth={50}
      leftSection={leftSection}
      leftSectionWidth={IconComponent ? 55 : undefined}
      visibilityToggleIcon={({ reveal }) => reveal ? <IconEye style={{ width: '25px', height: '25px', color: themedStyles.color, strokeWidth: '1.7' }} /> : <IconEyeOff style={{ width: '25px', height: '25px', color: themedStyles.color, strokeWidth: '1.7' }} />}
      style={style}
      {...props}
    />
  );
}