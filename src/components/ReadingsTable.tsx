'use client';

import { Droplets, Siren, TableProperties } from 'lucide-react';

import type { Lectura } from '@/lib/types';

export default function ReadingsTable({ lecturas }: { lecturas: Lectura[] }) {
  return (
    <section className="panel animate-fade-up overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/5 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <TableProperties className="h-[18px] w-[18px] text-brand-500" />
            Historial de lecturas
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Últimos eventos registrados por el microcontrolador.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {lecturas.length} registros
        </span>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-[10px] uppercase tracking-wider text-slate-400 backdrop-blur dark:bg-slate-900/95">
            <tr>
              <th className="px-5 py-3 font-semibold sm:px-6">Hora</th>
              <th className="px-3 py-3 font-semibold">Humedad</th>
              <th className="px-3 py-3 font-semibold">Riego</th>
              <th className="px-3 py-3 font-semibold">Alarma</th>
              <th className="px-5 py-3 text-right font-semibold sm:px-6">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {lecturas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                  Esperando telemetría del ESP8266…
                </td>
              </tr>
            )}
            {lecturas.map((lectura) => (
              <tr
                key={lectura.id}
                className="transition hover:bg-brand-50/50 dark:hover:bg-brand-500/5"
              >
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500 sm:px-6 dark:text-slate-400">
                  {new Date(lectura.created_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-10 font-mono font-semibold tabular-nums">{lectura.humedad}%</span>
                    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block dark:bg-slate-800">
                      <span
                        className={`block h-full rounded-full ${
                          lectura.humedad < 30
                            ? 'bg-rose-500'
                            : lectura.humedad < 65
                              ? 'bg-brand-500'
                              : 'bg-sky-500'
                        }`}
                        style={{ width: `${lectura.humedad}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                      lectura.estado_riego
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    <Droplets className="h-3 w-3" />
                    {lectura.estado_riego ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                      lectura.alarma_activa
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    <Siren className="h-3 w-3" />
                    {lectura.alarma_activa ? 'Alerta' : 'Normal'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs text-slate-400 sm:px-6">
                  #{lectura.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
