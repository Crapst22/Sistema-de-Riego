'use client';

import {
  CircleAlert,
  CloudSun,
  Moon,
  Radio,
  RefreshCw,
  Sprout,
  Sun,
  Wifi,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import ControlPanel from '@/components/ControlPanel';
import HistoryChart from '@/components/HistoryChart';
import ReadingsTable from '@/components/ReadingsTable';
import StatusCards from '@/components/StatusCards';
import { supabaseBrowser } from '@/lib/supabase/client';
import {
  CONFIGURACION_PREDETERMINADA,
  type Configuracion,
  type ConfiguracionUpdate,
  type Lectura,
} from '@/lib/types';

export default function Dashboard() {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [pulseando, setPulseando] = useState(false);
  const [oscuro, setOscuro] = useState(true);
  const solicitud = useRef(0);
  const pulso = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const cargarDatos = useCallback(async () => {
    const supabase = supabaseBrowser();
    if (!supabase) {
      setCargando(false);
      return;
    }

    const id = ++solicitud.current;

    const [lecturasResult, configuracionResult] = await Promise.all([
      supabase
        .from('lecturas_sensor')
        .select('id, humedad, estado_riego, alarma_activa, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('configuracion_sistema')
        .select('id, modo_automatico, riego_manual_activo, umbral_humedad_minima, updated_at')
        .eq('id', 1)
        .maybeSingle(),
    ]);

    if (id !== solicitud.current) return;

    if (lecturasResult.error || configuracionResult.error) {
      setError(
        lecturasResult.error?.message ??
          configuracionResult.error?.message ??
          'Error al sincronizar con Supabase',
      );
    } else {
      setError(null);
    }

    if (lecturasResult.data) setLecturas(lecturasResult.data as Lectura[]);

    if (configuracionResult.data) {
      setConfiguracion(configuracionResult.data as Configuracion);
    } else {
      const { data: creada } = await supabase
        .from('configuracion_sistema')
        .upsert({ id: 1, ...CONFIGURACION_PREDETERMINADA, updated_at: new Date().toISOString() })
        .select('id, modo_automatico, riego_manual_activo, umbral_humedad_minima, updated_at')
        .single();
      if (creada) setConfiguracion(creada as Configuracion);
    }

    setActualizado(new Date());
    setCargando(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
  }, [oscuro]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) {
      setCargando(false);
      setError('Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    void cargarDatos();

    const canal = supabase
      .channel('plantita-riego')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lecturas_sensor' },
        () => void cargarDatos(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracion_sistema' },
        () => void cargarDatos(),
      )
      .subscribe((estado) => setRealtime(estado === 'SUBSCRIBED'));

    const sondeo = setInterval(() => void cargarDatos(), 5000);
    const reloj = setInterval(() => setAhora(Date.now()), 1000);

    return () => {
      clearInterval(sondeo);
      clearInterval(reloj);
      void supabase.removeChannel(canal);
    };
  }, [cargarDatos]);

  useEffect(() => {
    return () => {
      if (pulso.current) clearTimeout(pulso.current);
    };
  }, []);

  const enviarControl = useCallback(
    async (update: ConfiguracionUpdate) => {
      setBusy(true);
      setError(null);
      setConfiguracion((anterior) => (anterior ? { ...anterior, ...update } : anterior));

      try {
        const respuesta = await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        const resultado: { ok: boolean; error?: string; configuracion?: Configuracion } =
          await respuesta.json();

        if (!respuesta.ok || !resultado.configuracion) {
          setError(resultado.error ?? 'No se pudo guardar la configuración');
          await cargarDatos();
          return;
        }

        setConfiguracion(resultado.configuracion);
      } catch {
        setError('No se pudo contactar con el servidor.');
        await cargarDatos();
      } finally {
        setBusy(false);
      }
    },
    [cargarDatos],
  );

  async function forzarRiego() {
    if (pulseando) return;
    setPulseando(true);
    await enviarControl({ modo_automatico: false, riego_manual_activo: true });
    pulso.current = setTimeout(async () => {
      await enviarControl({ modo_automatico: true, riego_manual_activo: false });
      setPulseando(false);
    }, 10000);
  }

  const ultima = lecturas[0];
  const umbral = configuracion?.umbral_humedad_minima ?? 30;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-backdrop" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-500/5 blur-3xl"
      />

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-600/25">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Plantita <span className="text-brand-500">·</span> Riego Inteligente
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Monitoreo y control remoto · ESP8266 NodeMCU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${
                realtime
                  ? 'border-brand-500/30 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${realtime ? 'animate-pulse' : ''}`} />
              {realtime ? 'EN VIVO' : 'POLLING 5s'}
            </span>
            <button
              type="button"
              onClick={() => void cargarDatos()}
              aria-label="Actualizar datos"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
            >
              <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setOscuro((valor) => !valor)}
              aria-label="Cambiar tema"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
            >
              {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {!configurado && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Faltan credenciales de Supabase</p>
                <p className="mt-1 text-xs opacity-90">
                  Copia <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">.env.example</code>{' '}
                  a <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">.env.local</code>, pega tu URL y anon key y reinicia el servidor.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-300/60 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
            <span className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => void cargarDatos()}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <Wifi className="h-3.5 w-3.5" />
            Estado en tiempo real
          </h2>
          <span className="font-mono text-[11px] text-slate-400">
            {actualizado ? `Sync ${actualizado.toLocaleTimeString('es-ES')}` : 'Sin sincronizar'}
          </span>
        </div>

        <StatusCards
          lectura={ultima}
          configuracion={configuracion}
          ahora={ahora}
          realtime={realtime}
        />

        <ControlPanel
          configuracion={configuracion}
          onUpdate={enviarControl}
          onPulse={forzarRiego}
          pulseando={pulseando}
          busy={busy}
        />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <HistoryChart lecturas={lecturas} umbral={umbral} />
          </div>
          <div className="xl:col-span-2">
            <ReadingsTable lecturas={lecturas.slice(0, 12)} />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400 dark:border-white/5">
          <span className="flex items-center gap-1.5">
            <CloudSun className="h-3.5 w-3.5" />
            Plantita IoT · ESP8266 + Supabase Realtime + Vercel
          </span>
          <span>Datos simulados en vivo cada 3–5 s</span>
        </footer>
      </main>
    </div>
  );
}
