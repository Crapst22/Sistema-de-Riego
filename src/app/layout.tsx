import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google';

import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const body = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const data = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-data',
});

export const metadata: Metadata = {
  title: 'Plantita · Riego Inteligente',
  description: 'Monitoreo y control remoto de riego automático con ESP8266 y Supabase Realtime.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`dark ${display.variable} ${body.variable} ${data.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
