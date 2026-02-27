import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MQ DS Collab Tool',
  description: 'MUI Design System Collaboration Tool — live prototype rendering and inspection',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
