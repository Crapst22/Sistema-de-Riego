# Plantita · Riego Inteligente

Dashboard IoT en Next.js 14 + TypeScript + Tailwind CSS + Supabase Realtime + Recharts para monitorear y controlar un ESP8266 (NodeMCU) con sensor de humedad de suelo, LED (bomba) y buzzer (alarma).

## Estructura

```text
src/app/api/iot/telemetry/route.ts  POST del ESP8266 (valida x-api-key, guarda lectura, devuelve configuración)
src/app/api/control/route.ts        POST del dashboard (modo, riego manual, umbral)
src/components/                     Dashboard, KPIs, panel de control, gráfico y tabla
src/lib/supabase/                   Clientes browser y servidor
supabase/schema.sql                 Tablas, RLS, trigger y Realtime
firmware/esp8266_riego.ino          Sketch Arduino para NodeMCU
```

## 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta todo el contenido de `supabase/schema.sql`.
3. En **Project Settings → API**, copia el **Project URL** y el **anon public key**.

El script crea `lecturas_sensor` y `configuracion_sistema` (fila `id = 1`), índice por fecha, trigger de `updated_at`, políticas RLS abiertas para prototipado y añade ambas tablas a la publicación `supabase_realtime`.

## 2. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
IOT_API_KEY=una-clave-larga-y-aleatoria
```

`IOT_API_KEY` debe ser exactamente la misma que pegues en el firmware. Usa la anon key **pública** (no la service_role) porque RLS ya está configurado para el prototipo.

## 3. Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Con el firmware apuntando a una URL local necesitas túnel (por ejemplo `npx vercel dev` o `ngrok http 3000`) porque el ESP8266 no puede ver `localhost`.

Verificación:

```bash
npm run lint
npm run typecheck
npm run build
```

## 4. Desplegar en Vercel

```bash
npm install -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add IOT_API_KEY production
npx vercel --prod
```

Cuando termines, `vercel` imprime la URL de producción; también está en `npx vercel ls`. Será algo como `https://aplicacion-plantita.vercel.app`. Usa `https://TU-DOMINIO.vercel.app/api/iot/telemetry` en el firmware.

Si actualizas variables de entorno después de desplegar, haz `npx vercel --prod` de nuevo para regenerar el build.

## 5. Firmware ESP8266

1. Instala Arduino IDE y la placa **ESP8266 Boards** (http://arduino.esp8266.com/stable/package_esp8266com_index.json).
2. Instala la librería **ArduinoJson** (versión 6.x) y usa las librerías incluidas `ESP8266WiFi`, `ESP8266HTTPClient` y `WiFiClientSecure`.
3. Abre `firmware/esp8266_riego.ino` y rellena arriba:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `SERVER_URL` con tu URL de Vercel + `/api/iot/telemetry`
   - `IOT_API_KEY` con el mismo valor de Vercel
4. Ajusta la calibración del sensor si hace falta: `VALOR_SENSOR_AIRE` (suelo seco) y `VALOR_SENSOR_AGUA` (suelo saturado). Para sensores capacitivos típicos, seco ≈ 760 y mojado ≈ 320 en A0; para sensores resistivos puede estar invertido (intercambia ambos valores).
5. Selecciona **NodeMCU 1.0 (ESP-12E Module)**, el puerto COM correcto y sube el sketch.

Conexiones: sensor → A0, LED con resistencia → D1 (GPIO5), buzzer → D2 (GPIO4), GND común y alimentación 3.3 V.

El sketch envía telemetría cada 4 s, aplica el modo automático (riego + alarma si `humedad < umbral`) o el modo manual, y con la respuesta de la nube actualiza modo, riego manual y umbral. `WiFiClientSecure.setInsecure()` se usa para simplificar HTTPS en el prototipo; en producción se recomienda fijar el certificado/SNI o el fingerprint.

## Endpoints

Telemetría (ESP8266):

```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/iot/telemetry \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: TU_IOT_API_KEY' \
  -d '{"humedad":24,"estado_riego":true,"alarma_activa":true}'
```

Respuesta:

```json
{
  "ok": true,
  "configuracion": {
    "id": 1,
    "modo_automatico": true,
    "riego_manual_activo": false,
    "umbral_humedad_minima": 30,
    "updated_at": "2026-11-20T12:00:00.000Z"
  }
}
```

Control (dashboard):

```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/control \
  -H 'Content-Type: application/json' \
  -d '{"modo_automatico":false,"riego_manual_activo":true}'
```

También acepta `{"umbral_humedad_minima": 35}`.

## Notas de seguridad

Las políticas RLS son abiertas (`using (true)`) para acelerar el prototipo: cualquiera con la anon key puede leer o modificar datos. Para un despliegue real, restringe las políticas por `auth.uid()`, mueve las escrituras sensibles a una service-role key solo en servidor y rota `IOT_API_KEY`.
