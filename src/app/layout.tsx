import type { Metadata } from 'next';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

export const metadata: Metadata = {
  title: 'MQ DS Collab Tool',
  description: 'MUI Design System Collaboration Tool — live prototype rendering and inspection',
};

/**
 * Root layout — provides the HTML document shell.
 *
 * InitColorSchemeScript runs synchronously before React hydration to set
 * data-mui-color-scheme on <html> from localStorage. This initializes
 * MUI's useColorScheme() hook and prevents flash of wrong theme.
 *
 * The MUI ThemeProvider is in (shell)/layout.tsx to avoid wrapping non-shell
 * routes like /preview/[id] which are Route Handlers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Body background: use MUI CSS variable after hydration, hardcoded #121212 for dark mode before hydration */}
        <style>{`
          body { margin: 0; background-color: var(--mui-palette-background-default, #fff); }
          html[data-mui-color-scheme="dark"] { color-scheme: dark; }
          html[data-mui-color-scheme="dark"] body { background-color: var(--mui-palette-background-default, #121212); }
        `}</style>
      </head>
      <body>
        <InitColorSchemeScript attribute="data-mui-color-scheme" />
        {children}
      </body>
    </html>
  );
}
