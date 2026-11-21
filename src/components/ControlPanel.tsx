'use client';

import {
  Check,
  Droplets,
  Hand,
  LoaderCircle,
  Power,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Configuracion, ConfiguracionUpdate } from '@/lib/types';

type Props = {
  configuracion: Configuracion | null;
  onUpdate: (update: ConfiguracionUpdate) => void;
  onPulse: () => void;
  pulseando: boolean;
  busy: boolean;
};

export default function ControlPanel({
  configuracion,
  onUpdate,
  onPulse,
  pulseando,
  busy,
}: Props) {
  const modoAutomatico = configuracion?.modo_automatico ?? true;
  const riegoManual = configuracion?.riego_manual_activo ?? false;
  const umbralGuardado = configuracion?.umbral_humedad_minima ?? 30;
  const [umbral, setUmbral] = useState(umbralGuardado);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUmbral(umbralGuardado);
  }, [umbralGuardado]);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function cambiarUmbral(valor: number) {
    setUmbral(valor);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      onUpdate({ umbral_humedad_minima: valor });
    }, 450);
  }

  return (
    <section className="panel animate-fade-up p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <SlidersHorizontal className="h-[18px] w-[18px] text-brand-500" />
            Panel de control remoto
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Los cambios se envían al ESP8266 en su próxima telemetría.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {busy ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-brand-500" />
          )}
          {busy ? 'Guardando…' : 'Sincronizado'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Modo de operación
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800/80">
              <button
                type="button"
                disabled={busy}
                onClick={() => onUpdate({ modo_automatico: true })}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  modoAutomatico
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Automático
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onUpdate({ modo_automatico: false })}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  !modoAutomatico
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Hand className="h-4 w-4" />
                Manual
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Acción inmediata
            </p>
            <button
              type="button"
              disabled={busy || pulseando}
              onClick={modoAutomatico ? onPulse : () => onUpdate({ riego_manual_activo: !riegoManual })}
              className={`group flex w-full items-center justify-center gap-3 rounded-xl px-4 py-4 text-base font-bold text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                riegoManual || pulseando
                  ? 'bg-rose-600 shadow-rose-600/25 hover:bg-rose-700'
                  : 'bg-brand-600 shadow-brand-600/25 hover:bg-brand-700'
              }`}
            >
              {busy || pulseando ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : riegoManual || pulseando ? (
                <Power className="h-5 w-5" />
              ) : (
                <Droplets className="h-5 w-5 transition group-hover:scale-110" />
              )}
              {pulseando
                ? 'Riego forzado en curso…'
                : modoAutomatico
                  ? riegoManual
                    ? 'Detener riego'
                    : 'Forzar riego 10 s'
                  : riegoManual
                    ? 'Detener riego ahora'
                    : 'Activar riego ahora'}
              {modoAutomatico && !riegoManual && !pulseando && (
                <TimerReset className="h-4 w-4 opacity-70" />
              )}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
              {modoAutomatico
                ? 'El pulso cambia a manual 10 s y luego restaura el modo automático.'
                : 'El LED D1 permanece encendido hasta que lo detengas.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-white/5 dark:bg-slate-950/40">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Umbral mínimo de humedad
              </p>
              <span className="font-mono text-2xl font-bold text-brand-600 dark:text-brand-400">
                {umbral}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              El riego automático se activa cuando la humedad cae por debajo de este valor.
            </p>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={umbral}
              onChange={(event) => cambiarUmbral(Number(event.target.value))}
              aria-label="Umbral mínimo de humedad"
              className="mt-6 w-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #6a9e3f ${umbral}%, var(--slider-track) ${umbral}%)`,
              }}
            />
            <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-400">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-[11px] font-medium text-slate-400">Presets rápidos</p>
            <div className="flex gap-2">
              {[20, 30, 40, 50].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  disabled={busy}
                  onClick={() => cambiarUmbral(valor)}
                  className={`flex-1 rounded-lg border px-2 py-2 font-mono text-xs font-semibold transition disabled:opacity-60 ${
                    umbral === valor
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-400'
                  }`}
                >
                  {valor}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
