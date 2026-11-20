export type Lectura = {
  id: number;
  humedad: number;
  estado_riego: boolean;
  alarma_activa: boolean;
  created_at: string;
};

export type Configuracion = {
  id: number;
  modo_automatico: boolean;
  riego_manual_activo: boolean;
  umbral_humedad_minima: number;
  updated_at: string;
};

export type TelemetryPayload = {
  humedad: number;
  estado_riego: boolean;
  alarma_activa: boolean;
};

export type TelemetryResponse = {
  ok: true;
  configuracion: Configuracion;
};

export type ConfiguracionUpdate = Partial<
  Pick<Configuracion, 'modo_automatico' | 'riego_manual_activo' | 'umbral_humedad_minima'>
>;

export type ApiError = { ok: false; error: string };

export type DashboardData = {
  lecturas: Lectura[];
  configuracion: Configuracion | null;
};

export const CONFIGURACION_PREDETERMINADA: Omit<Configuracion, 'id' | 'updated_at'> = {
  modo_automatico: true,
  riego_manual_activo: false,
  umbral_humedad_minima: 30,
};
