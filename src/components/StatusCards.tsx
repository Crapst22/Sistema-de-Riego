'use client';

import {
  Activity,
  Clock3,
  Droplets,
  Radio,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { ReactNode } from 'react';

import type { Configuracion, EstadoSuelo, Lectura } from '@/lib/types';

type Props = {
  lectura: Lectura | undefined;
  configuracion: Configuracion | null;
  ahora: number;
  realtime: boolean;
};

type HumedadEstado = {
  etiqueta: string;
  detalle: string;
  color: string;
  texto: string;
  fondo: string;
};

function estadoHumedad(
  humedad: number,
  umbral: number,
  estadoSuelo: EstadoSuelo = 'ok',
): HumedadEstado {
  if (estadoSuelo === 'exceso' || humedad > 85) {
    return {
      etiqueta: 'Exceso de agua',
      detalle: 'Por encima del rango ideal',
      color: '#3d7f92',
      texto: 'text-sky-600 dark:text-sky-400',
      fondo: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    };
  }
  if (estadoSuelo === 'seco' || humedad < umbral) {
    return {
      etiqueta: 'Suelo seco',
      detalle: 'Por debajo del umbral',
      color: '#dc7255',
      texto: 'text-rose-600 dark:text-rose-400',
      fondo: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    };
  }
  if (humedad < umbral + 25) {
    return {
      etiqueta: 'Humedad óptima',
      detalle: 'Dentro del rango ideal',
      color: '#6a9e3f',
      texto: 'text-brand-600 dark:text-brand-400',
      fondo: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
    };
  }
  return {
    etiqueta: 'Suelo húmedo',
    detalle: 'Por encima del rango ideal',
    color: '#3d7f92',
    texto: 'text-sky-600 dark:text-sky-400',
    fondo: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  };
}

function tiempoRelativo(ms: number): string {
  if (ms < 0) return 'sincronizando';
  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) return `hace ${segundos} s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}

function Tarjeta({
  icono,
  titulo,
  acento,
  children,
}: {
  icono: ReactNode;
  titulo: string;
  acento: string;
  children: ReactNode;
}) {
  return (
    <div className="panel panel-hover animate-fade-up p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {titulo}
        </span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${acento}`}>
          {icono}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function StatusCards({ lectura, configuracion, ahora, realtime }: Props) {
  const humedad = lectura?.humedad ?? 0;
  const umbral = configuracion?.umbral_humedad_minima ?? 30;
  const estado = estadoHumedad(humedad, umbral, lectura?.estado_suelo);
  const riego = lectura?.estado_riego ?? false;
  const alarma = lectura?.alarma_activa ?? false;
  const exceso = lectura?.estado_suelo === 'exceso' || (alarma && humedad > 85);
  const motivoAlarma = exceso ? 'Exceso de agua' : 'Sequía detectada';
  const timestamp = lectura ? new Date(lectura.created_at).getTime() : Number.NaN;
  const conexionMs = Number.isFinite(timestamp) ? ahora - timestamp : Number.NaN;
  const conectado = Number.isFinite(conexionMs) && conexionMs < 30000;
  const nivel = Math.min(100, Math.max(0, humedad));

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="panel panel-hover animate-fade-up p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Humedad del suelo
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Droplets className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-24 shrink-0">
            <svg
              viewBox="0 0 40 28"
              className="absolute -top-2 left-1/2 z-10 h-10 w-10 -translate-x-1/2 text-brand-500"
            >
              <path d="M20 27V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 18C12 18 8 13 8 7c7-1 12 4 12 11Z" fill="currentColor" opacity="0.85" />
              <path d="M20 16c8 0 12-5 12-11-7-1-12 4-12 11Z" fill="currentColor" opacity="0.6" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 top-5 overflow-hidden rounded-xl border border-slate-300/80 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-900">
              <div
                className="absolute inset-0 opacity-40 dark:opacity-30"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 25% 30%, rgba(87,63,38,0.28) 0 1.5px, transparent 2px), radial-gradient(circle at 70% 65%, rgba(87,63,38,0.22) 0 2px, transparent 2.5px), repeating-linear-gradient(180deg, rgba(87,63,38,0.12) 0 2px, transparent 2px 10px)',
                  backgroundSize: '18px 18px, 22px 22px, 100% 10px',
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 border-t-2 transition-all duration-700"
                style={{
                  height: `${nivel}%`,
                  borderColor: 'rgba(214,240,201,0.85)',
                  background: 'linear-gradient(to top, #3d7f92 0%, #529bad 45%, #82b953 100%)',
                }}
              />
              <div
                className="absolute inset-x-0 border-t-2 border-dashed border-rose-400"
                style={{ bottom: `${umbral}%` }}
              />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold leading-none tabular-nums">{humedad}</span>
              <span className="font-mono text-sm text-slate-400">%</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${estado.fondo}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {estado.etiqueta}
            </span>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {estado.detalle}
            </p>
            <p className="font-mono text-xs text-slate-400">Umbral: {umbral}%</p>
          </div>
        </div>
      </div>

      <Tarjeta
        titulo="Estado del riego"
        acento={
          riego
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
        }
        icono={<Droplets className="h-[18px] w-[18px]" />}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {riego && (
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-400" />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                riego ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          </span>
          <span className="text-2xl font-bold tracking-tight">{riego ? 'ACTIVO' : 'INACTIVO'}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {riego ? 'Bomba / LED D0 encendido' : 'Bomba / LED D0 apagado'}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${riego ? 'w-full bg-brand-500' : 'w-0'}`}
          />
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Alarma / Buzzer"
        acento={
          alarma
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
            : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
        }
        icono={alarma ? <Siren className="h-[18px] w-[18px]" /> : <ShieldCheck className="h-[18px] w-[18px]" />}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">
            {alarma ? 'ALERTA' : 'NORMAL'}
          </span>
          {alarma ? (
            <TriangleAlert className="h-5 w-5 animate-pulse text-rose-500" />
          ) : (
            <Activity className="h-5 w-5 text-brand-500" />
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {alarma ? `${motivoAlarma} · buzzer D1` : 'Sin incidencias · buzzer D1'}
        </p>
        <span
          className={`mt-4 inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
            alarma
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
              : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
          }`}
        >
          {alarma ? 'Requiere atención' : 'Todo bajo control'}
        </span>
      </Tarjeta>

      <Tarjeta
        titulo="Última conexión ESP8266"
        acento={
          conectado
            ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        }
        icono={conectado ? <Wifi className="h-[18px] w-[18px]" /> : <WifiOff className="h-[18px] w-[18px]" />}
      >
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-slate-400" />
          <span className="font-mono text-xl font-bold tabular-nums">
            {Number.isFinite(conexionMs) ? tiempoRelativo(conexionMs) : '—'}
          </span>
        </div>
        <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
          {lectura
            ? new Date(lectura.created_at).toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : 'Esperando la primera telemetría'}
        </p>
        <span
          className={`mt-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
            conectado
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
          }`}
        >
          {conectado ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {conectado ? 'Dispositivo en línea' : 'Sin señal reciente'}
        </span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Radio className="h-3 w-3" />
          {realtime ? 'Sincronización Realtime' : 'Sincronización por polling'}
        </span>
      </Tarjeta>
    </section>
  );
}
