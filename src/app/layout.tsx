import type { Metadata } from 'next';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

export const metadata: Metadata = {
  title: 'MQ DS Collab Tool',
  description: 'MUI Design System Collaboration Tool — live prototype rendering and inspection',
};

/**
 * Root layout — provides the HTML document shell.
 *
 * InitColorSchemeScript is placed before children so it runs synchronously
 * before React hydration, setting data-mui-color-scheme on <html> from
 * localStorage. This prevents flash of wrong theme (FOWT) when the user
 * has a saved theme preference.
 *
 * The MUI ThemeProvider is NOT here — it's in (shell)/layout.tsx to avoid
 * wrapping non-shell routes like /preview/[id] which are Route Handlers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data-mui-color-scheme" />
        {children}
      </body>
    </html>
  );
}
