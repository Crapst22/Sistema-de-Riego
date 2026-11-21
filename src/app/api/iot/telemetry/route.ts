import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { supabaseServer } from '@/lib/supabase/server';
import {
  CONFIGURACION_PREDETERMINADA,
  type EstadoSuelo,
  type TelemetryPayload,
  type TelemetryResponse,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

function apiKeyValida(request: NextRequest): boolean {
  const esperada = process.env.IOT_API_KEY;
  const recibida = request.headers.get('x-api-key');

  if (!esperada || !recibida) return false;

  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);

  return a.length === b.length && timingSafeEqual(a, b);
}

function esTelemetryPayload(value: unknown): value is TelemetryPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;

  const estadoSueloValido =
    payload.estado_suelo === undefined ||
    (typeof payload.estado_suelo === 'string' &&
      ['ok', 'seco', 'exceso'].includes(payload.estado_suelo));

  return (
    typeof payload.humedad === 'number' &&
    Number.isInteger(payload.humedad) &&
    payload.humedad >= 0 &&
    payload.humedad <= 100 &&
    typeof payload.estado_riego === 'boolean' &&
    typeof payload.alarma_activa === 'boolean' &&
    estadoSueloValido
  );
}

export async function POST(request: NextRequest) {
  if (!process.env.IOT_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'IOT_API_KEY no configurada en el servidor' },
      { status: 500 },
    );
  }

  if (!apiKeyValida(request)) {
    return NextResponse.json({ ok: false, error: 'API key inválida' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  if (!esTelemetryPayload(body)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Se requiere { humedad: integer 0-100, estado_riego: boolean, alarma_activa: boolean, estado_suelo?: "ok" | "seco" | "exceso" }',
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

  const estadoSuelo: EstadoSuelo =
    body.estado_suelo ?? (body.humedad > 85 ? 'exceso' : body.humedad < 30 ? 'seco' : 'ok');

  const { error: insercionError } = await supabase.from('lecturas_sensor').insert({
    humedad: body.humedad,
    estado_riego: body.estado_riego,
    alarma_activa: body.alarma_activa,
    estado_suelo: estadoSuelo,
  });

  if (insercionError) {
    return NextResponse.json({ ok: false, error: insercionError.message }, { status: 500 });
  }

  await supabase
    .from('configuracion_sistema')
    .upsert({ id: 1, ...CONFIGURACION_PREDETERMINADA }, { onConflict: 'id', ignoreDuplicates: true });

  const { data: configuracion, error: configuracionError } = await supabase
    .from('configuracion_sistema')
    .select('id, modo_automatico, riego_manual_activo, umbral_humedad_minima, updated_at')
    .eq('id', 1)
    .maybeSingle();

  if (configuracionError || !configuracion) {
    return NextResponse.json(
      { ok: false, error: configuracionError?.message ?? 'No se pudo leer la configuración' },
      { status: 500 },
    );
  }

  const respuesta: TelemetryResponse = { ok: true, configuracion };
  return NextResponse.json(respuesta, { status: 201 });
}
