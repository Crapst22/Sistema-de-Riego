import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';

import './globals.css';

const quicksand = Quicksand({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  title: 'Plantita · Riego Inteligente',
  description: 'Monitoreo y control remoto de riego automático con ESP8266 y Supabase Realtime.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`dark ${quicksand.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
