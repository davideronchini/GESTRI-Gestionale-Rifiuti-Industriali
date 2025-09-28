// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import { createTheme, MantineProvider, AppShell } from '@mantine/core';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';

import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';

import '@fontsource/poppins';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/800.css';
import "./globals.css";
import '@/theme/autofill-styles.css';
import { AuthProvider } from "@/providers/authProvider";
import appTheme from '@/theme/theme';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

export const metadata = {
  title: 'GESTRI',
  description: 'Gestionale Rifiuti Industriali',
};

// Create theme merging our config with Mantine's theme
const theme = createTheme(appTheme);

export default function RootLayout({ children }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <AuthProvider>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <Notifications />
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
