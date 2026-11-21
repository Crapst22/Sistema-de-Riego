'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function rolDelJwt(clave: string): string | null {
  const parte = clave.split('.')[1];
  if (!parte) return null;

  const normalizada = parte.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = normalizada.padEnd(Math.ceil(normalizada.length / 4) * 4, '=');

  try {
    const payload = JSON.parse(globalThis.atob(relleno)) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function motivoConfiguracionSupabase(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !clave) {
    return 'Faltan NEXT_PUBLIC_SUPABASE_URL y/o la clave pública de Supabase.';
  }

  const esSecreta = clave.startsWith('sb_secret_') || rolDelJwt(clave) === 'service_role';
  if (esSecreta) {
    return 'Estás usando una clave secreta en la variable pública de Supabase. Usa la clave publishable/anon (sb_publishable_... o JWT con role=anon) y vuelve a desplegar.';
  }

  if (!clave.startsWith('sb_publishable_') && rolDelJwt(clave) !== 'anon') {
    return 'La clave pública de Supabase no parece ser publishable/anon.';
  }

  return null;
}

export function supabaseBrowser(): SupabaseClient | null {
  if (motivoConfiguracionSupabase()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const clave = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as string;

  if (!client) {
    client = createClient(url, clave, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }

  return client;
}
