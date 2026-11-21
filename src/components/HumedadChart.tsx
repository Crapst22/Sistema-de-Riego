'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

export type PuntoHistorial = {
  id: number;
  hora: string;
  humedad: number;
  riego: boolean;
};

function TooltipRiego({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload as PuntoHistorial;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur">
      <p className="mb-1 font-mono text-[11px] text-slate-400">{label}</p>
      <p className="font-semibold text-brand-300">Humedad: {punto.humedad}%</p>
      <p className={punto.riego ? 'text-brand-400' : 'text-slate-400'}>
        Riego: {punto.riego ? 'activo' : 'inactivo'}
      </p>
    </div>
  );
}

export default function HumedadChart({
  datos,
  umbral,
}: {
  datos: PuntoHistorial[];
  umbral: number;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gradienteHumedad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6a9e3f" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#6a9e3f" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
          />
          <XAxis
            dataKey="hora"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            className="fill-slate-400"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(valor: number) => `${valor}%`}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="fill-slate-400"
          />
          <Tooltip content={<TooltipRiego />} cursor={{ stroke: '#6a9e3f', strokeDasharray: '4 4' }} />
          <ReferenceLine
            y={umbral}
            stroke="#dc7255"
            strokeDasharray="5 5"
            label={{ value: `Umbral ${umbral}%`, position: 'insideTopRight', fill: '#dc7255', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="humedad"
            stroke="#6a9e3f"
            strokeWidth={2.5}
            fill="url(#gradienteHumedad)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#6a9e3f' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
