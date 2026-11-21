'use client';

import { ChartNoAxesCombined, LoaderCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

import type { Lectura } from '@/lib/types';
import type { PuntoHistorial } from './HumedadChart';

const HumedadChart = dynamic(() => import('./HumedadChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center gap-2 text-sm text-slate-400">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      Cargando gráfico…
    </div>
  ),
});

export default function HistoryChart({
  lecturas,
  umbral,
}: {
  lecturas: Lectura[];
  umbral: number;
}) {
  const [rango, setRango] = useState<20 | 50>(20);

  const datos = useMemo<PuntoHistorial[]>(
    () =>
      [...lecturas]
        .reverse()
        .slice(-rango)
        .map((lectura) => ({
          id: lectura.id,
          humedad: lectura.humedad,
          riego: lectura.estado_riego,
          estadoSuelo: lectura.estado_suelo,
          hora: new Date(lectura.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        })),
    [lecturas, rango],
  );

  const humedades = datos.map((punto) => punto.humedad);
  const promedio = humedades.length
    ? Math.round(humedades.reduce((suma, valor) => suma + valor, 0) / humedades.length)
    : 0;
  const minimo = humedades.length ? Math.min(...humedades) : 0;
  const maximo = humedades.length ? Math.max(...humedades) : 0;

  return (
    <section className="panel animate-fade-up p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <ChartNoAxesCombined className="h-[18px] w-[18px] text-brand-500" />
            Evolución de la humedad
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Historial de telemetría del sensor de suelo.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {([20, 50] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setRango(valor)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                rango === valor
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Últimas {valor}
            </button>
          ))}
        </div>
      </div>

      {datos.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
          <ChartNoAxesCombined className="h-8 w-8 opacity-40" />
          Aún no hay lecturas para graficar.
        </div>
      ) : (
        <HumedadChart datos={datos} umbral={umbral} />
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 dark:border-white/5">
        {[
          { etiqueta: 'Promedio', valor: `${promedio}%`, color: 'text-brand-600 dark:text-brand-400' },
          { etiqueta: 'Mínimo', valor: `${minimo}%`, color: 'text-rose-500' },
          { etiqueta: 'Máximo', valor: `${maximo}%`, color: 'text-sky-500' },
        ].map((item) => (
          <div key={item.etiqueta} className="text-center">
            <p className={`font-mono text-lg font-bold ${item.color}`}>{item.valor}</p>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{item.etiqueta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
