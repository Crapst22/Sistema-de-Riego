#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "TU_NOMBRE_DE_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASENA_WIFI";
const char* SERVER_URL = "https://TU-PROYECTO.vercel.app/api/iot/telemetry";
const char* IOT_API_KEY = "LA_MISMA_CLAVE_DE_IOT_API_KEY";

const uint8_t PIN_SENSOR = A0;
const uint8_t PIN_LED_RIEGO = D1;
const uint8_t PIN_BUZZER = D2;

const int VALOR_SENSOR_AIRE = 760;
const int VALOR_SENSOR_AGUA = 320;
const int LED_ENCENDIDO = HIGH;
const int BUZZER_ENCENDIDO = HIGH;
const unsigned long INTERVALO_ENVIO_MS = 4000;

bool modoAutomatico = true;
bool riegoManualActivo = false;
int umbralHumedadMinima = 30;
bool riegoActivo = false;
bool alarmaActiva = false;
unsigned long ultimoEnvio = 0;

int leerHumedad() {
  long suma = 0;
  for (int i = 0; i < 10; i++) {
    suma += analogRead(PIN_SENSOR);
    delay(20);
  }
  int promedio = suma / 10;
  int humedad = map(promedio, VALOR_SENSOR_AIRE, VALOR_SENSOR_AGUA, 0, 100);
  return constrain(humedad, 0, 100);
}

void aplicarSalidas(bool riego, bool alarma) {
  digitalWrite(PIN_LED_RIEGO, riego ? LED_ENCENDIDO : !LED_ENCENDIDO);
  digitalWrite(PIN_BUZZER, alarma ? BUZZER_ENCENDIDO : !BUZZER_ENCENDIDO);
}

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi");
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 60) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi conectado. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("No se pudo conectar a WiFi");
  }
}

void enviarTelemetria(int humedad) {
  conectarWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure cliente;
  cliente.setInsecure();

  HTTPClient http;
  http.begin(cliente, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", IOT_API_KEY);
  http.setTimeout(6000);

  StaticJsonDocument<256> payload;
  payload["humedad"] = humedad;
  payload["estado_riego"] = riegoActivo;
  payload["alarma_activa"] = alarmaActiva;

  String cuerpo;
  serializeJson(payload, cuerpo);

  int codigo = http.POST(cuerpo);
  if (codigo > 0) {
    String respuesta = http.getString();
    Serial.printf("HTTP %d: %s\n", codigo, respuesta.c_str());

    StaticJsonDocument<512> documento;
    DeserializationError error = deserializeJson(documento, respuesta);

    if (!error && documento["ok"] == true) {
      JsonObject config = documento["configuracion"];
      modoAutomatico = config["modo_automatico"] | modoAutomatico;
      riegoManualActivo = config["riego_manual_activo"] | riegoManualActivo;
      umbralHumedadMinima = config["umbral_humedad_minima"] | umbralHumedadMinima;
      umbralHumedadMinima = constrain(umbralHumedadMinima, 0, 100);
    } else {
      Serial.println("No se pudo interpretar la configuracion recibida");
    }
  } else {
    Serial.printf("Error HTTP: %s\n", http.errorToString(codigo).c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SENSOR, INPUT);
  pinMode(PIN_LED_RIEGO, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  aplicarSalidas(false, false);
  conectarWiFi();
}

void loop() {
  if (millis() - ultimoEnvio >= INTERVALO_ENVIO_MS) {
    ultimoEnvio = millis();

    int humedad = leerHumedad();

    if (modoAutomatico) {
      bool sequia = humedad < umbralHumedadMinima;
      riegoActivo = sequia;
      alarmaActiva = sequia;
    } else {
      riegoActivo = riegoManualActivo;
      alarmaActiva = false;
    }

    aplicarSalidas(riegoActivo, alarmaActiva);

    Serial.printf(
      "Humedad: %d%% | Modo: %s | Umbral: %d%% | Riego: %s | Alarma: %s\n",
      humedad,
      modoAutomatico ? "AUTO" : "MANUAL",
      umbralHumedadMinima,
      riegoActivo ? "ON" : "OFF",
      alarmaActiva ? "ON" : "OFF"
    );

    enviarTelemetria(humedad);
  }

  delay(100);
}
