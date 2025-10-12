"use client";

import { useMemo } from "react";
import { Group, Box, Text, ActionIcon, useMantineTheme, rem } from "@mantine/core";
import AppPaper from "@/components/ui/AppPaper";
import RequireRole from "../RequireRole";

/**
 * AssociationItem
 * - sinistra: icona (leftIcon) OPPURE testo (leftText, es. "#104")
 * - centro: title
 * - destra: icona azione (rightIcon) con onRightIconClick che NON propaga il click della card
 */
export default function AppAssociationItem({
  leftIcon,
  leftText,
  title,
  rightIcon,
  onClick,
  onRightIconClick,
  disabled,
  className,
  style,
}) {
  const theme = useMantineTheme();
  const hasLeftText = useMemo(() => typeof leftText === "string" && leftText.length > 0, [leftText]);

  return (
    <AppPaper
      p={0}
      onClick={disabled ? undefined : onClick}
      className={className}
      style={{
        borderRadius: '15px',
        height: 'auto',
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        transition: "background-color .15s ease, transform .05s ease",
        ...(style || {}),
      }}
      onMouseDown={(e) => {
        (e.currentTarget).style.transform = "scale(1)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget).style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget).style.transform = "scale(1)";
      }}
    >
      <Group justify="space-between" wrap="nowrap" style={{ margin: '0px'}}>
        {/* left area: icon or left text (fixed) */}
        <Group gap="sm" wrap="nowrap" style={{ margin: '13px', alignItems: 'center' }}>
          {leftIcon && <Box aria-hidden>{leftIcon}</Box>}
          {!leftIcon && hasLeftText && (
            <Text
              fw={600}
              style={{
                fontSize: '16px',
                marginLeft: '5px',
                whiteSpace: "nowrap",
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {leftText}
            </Text>
          )}
        </Group>

        {/* center/title: flexible, takes remaining space */}
        <Box style={{ flex: 1, minWidth: 0, marginLeft: '8px', marginRight: '8px' }}>
          <Text
            fw={400}
            style={{
              whiteSpace: "nowrap",
              color: 'rgba(255, 255, 255, 0.5)',
              overflow: "hidden",
              fontSize: '16px',
              textOverflow: "ellipsis",
            }}
            title={typeof title === "string" ? title : undefined}
          >
            {title}
          </Text>
        </Box>

        {/* right area: fixed width so it doesn't affect title sizing */}
        <Box style={{ width: rem(48), display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0px' }}>
          {rightIcon && (
            <RequireRole allowedRoles={['STAFF']}>
            <ActionIcon
              size={35}
              style={{
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'unset',
                lineHeight: 1,
              }}
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                onRightIconClick && onRightIconClick();
              }}
              aria-label="azione elemento"
              disabled={disabled}
            >
              {rightIcon}
            </ActionIcon>
            </RequireRole>
          )}
        </Box>
      </Group>
    </AppPaper>
  );
}
