import { NextResponse, type NextRequest } from 'next/server';

import { supabaseServer } from '@/lib/supabase/server';
import type { Configuracion, ConfiguracionUpdate } from '@/lib/types';

export const dynamic = 'force-dynamic';

function esConfiguracionUpdate(value: unknown): value is ConfiguracionUpdate {
  if (typeof value !== 'object' || value === null) return false;
  const update = value as Record<string, unknown>;
  const keys = Object.keys(update);

  if (keys.length === 0) return false;

  const permitidas = new Set([
    'modo_automatico',
    'riego_manual_activo',
    'umbral_humedad_minima',
  ]);

  return keys.every((key) => {
    if (!permitidas.has(key)) return false;
    const field = update[key];
    if (key === 'umbral_humedad_minima') {
      return typeof field === 'number' && Number.isInteger(field) && field >= 0 && field <= 100;
    }
    return typeof field === 'boolean';
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  if (!esConfiguracionUpdate(body)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Se requiere al menos uno de: modo_automatico (boolean), riego_manual_activo (boolean), umbral_humedad_minima (integer 0-100)',
      },
      { status: 400 },
    );
  }

  const supabase = supabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase no configurado en el servidor' },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .update(body)
    .eq('id', 1)
    .select('id, modo_automatico, riego_manual_activo, umbral_humedad_minima, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    const { data: creada, error: creacionError } = await supabase
      .from('configuracion_sistema')
      .upsert({ id: 1, ...body })
      .select('id, modo_automatico, riego_manual_activo, umbral_humedad_minima, updated_at')
      .single();

    if (creacionError || !creada) {
      return NextResponse.json(
        { ok: false, error: creacionError?.message ?? 'No se pudo crear la configuración' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, configuracion: creada as Configuracion });
  }

  return NextResponse.json({ ok: true, configuracion: data as Configuracion });
}
