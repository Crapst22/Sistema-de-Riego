import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Plantita · Riego Inteligente',
  description: 'Monitoreo y control remoto de riego automático con ESP8266 y Supabase Realtime.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
