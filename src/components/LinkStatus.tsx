'use client';

import { Check, Clock3, CloudOff, Radio, ServerOff } from 'lucide-react';
import type { ComponentType } from 'react';

import type { Configuracion, Lectura } from '@/lib/types';

type Props = {
  lectura: Lectura | undefined;
  configuracion: Configuracion | null;
  ahora: number;
  realtime: boolean;
  configurado: boolean;
  error: string | null;
};

type Tono = {
  texto: string;
  fondo: string;
  titulo: string;
  detalle: string;
  Icono: ComponentType<{ className?: string }>;
};

function tiempoRelativo(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  const segundos = Math.max(0, Math.floor(ms / 1000));
  if (segundos < 60) return `hace ${segundos} s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  return `hace ${Math.floor(minutos / 60)} h`;
}

function Nodo({
  etiqueta,
  detalle,
  ok,
}: {
  etiqueta: string;
  detalle: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          ok ? 'bg-brand-500 shadow-[0_0_0_3px_rgba(106,158,63,0.15)]' : 'bg-rose-400'
        }`}
      />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {etiqueta}
        </p>
        <p className="font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {detalle}
        </p>
      </div>
    </div>
  );
}

export default function LinkStatus({
  lectura,
  configuracion,
  ahora,
  realtime,
  configurado,
  error,
}: Props) {
  const nubeOk = configurado && !error;
  const marcaTelemetria = lectura ? new Date(lectura.created_at).getTime() : Number.NaN;
  const antiguedad = Number.isFinite(marcaTelemetria) ? ahora - marcaTelemetria : Number.POSITIVE_INFINITY;
  const dispositivoOk = antiguedad < 30000;
  const configPendiente = Boolean(
    configuracion &&
      Number.isFinite(marcaTelemetria) &&
      new Date(configuracion.updated_at).getTime() > marcaTelemetria,
  );

  const estados: Record<'nube' | 'esperando' | 'caido' | 'pendiente' | 'listo', Tono> = {
    nube: {
      texto: 'text-rose-600 dark:text-rose-400',
      fondo: 'bg-rose-50 dark:bg-rose-500/10',
      titulo: 'Sin conexión con Supabase',
      detalle: error ?? 'Revisa las variables de entorno y vuelve a desplegar.',
      Icono: CloudOff,
    },
    esperando: {
      texto: 'text-amber-600 dark:text-amber-400',
      fondo: 'bg-amber-50 dark:bg-amber-500/10',
      titulo: 'Esperando al controlador',
      detalle: 'La nube responde, pero todavía no llega telemetría del ESP8266.',
      Icono: Clock3,
    },
    caido: {
      texto: 'text-rose-600 dark:text-rose-400',
      fondo: 'bg-rose-50 dark:bg-rose-500/10',
      titulo: 'Controlador sin señal',
      detalle: `Última telemetría ${tiempoRelativo(antiguedad)}. Revisa el Wi-Fi y la alimentación.`,
      Icono: ServerOff,
    },
    pendiente: {
      texto: 'text-amber-600 dark:text-amber-400',
      fondo: 'bg-amber-50 dark:bg-amber-500/10',
      titulo: 'Configuración en camino',
      detalle: 'El controlador está en línea y aplicará el cambio en su próxima lectura.',
      Icono: Radio,
    },
    listo: {
      texto: 'text-brand-700 dark:text-brand-300',
      fondo: 'bg-brand-50 dark:bg-brand-500/10',
      titulo: 'Sistema conectado',
      detalle: 'El controlador envía datos y ya tiene la última configuración aplicada.',
      Icono: Check,
    },
  };

  const clave = !nubeOk
    ? 'nube'
    : !Number.isFinite(marcaTelemetria)
      ? 'esperando'
      : !dispositivoOk
        ? 'caido'
        : configPendiente
          ? 'pendiente'
          : 'listo';

  const tono = estados[clave];
  const Icono = tono.Icono;

  return (
    <section
      className="panel animate-fade-up flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tono.fondo} ${tono.texto}`}
        >
          <Icono className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Enlace con el controlador
          </p>
          <p className={`text-sm font-bold ${tono.texto}`}>{tono.titulo}</p>
          <p className="mt-0.5 max-w-xl text-xs text-slate-500 dark:text-slate-400">
            {tono.detalle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
        <Nodo etiqueta="Nube" detalle={realtime ? 'Realtime' : 'Polling'} ok={nubeOk} />
        <span aria-hidden className="text-slate-300 dark:text-slate-700">
          →
        </span>
        <Nodo
          etiqueta="ESP8266"
          detalle={tiempoRelativo(antiguedad)}
          ok={dispositivoOk}
        />
        <span aria-hidden className="text-slate-300 dark:text-slate-700">
          →
        </span>
        <Nodo
          etiqueta="Config"
          detalle={configPendiente ? 'Pendiente' : 'Aplicada'}
          ok={Boolean(configuracion) && !configPendiente}
        />
      </div>
    </section>
  );
}
