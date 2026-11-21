#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#define PIN_BUZZER D1
#define PIN_LED    D0
#define PIN_SUELO  A0

const char* WIFI_SSID = "TU_NOMBRE_DE_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASENA_WIFI";
const char* SERVER_URL = "https://TU-PROYECTO.vercel.app/api/iot/telemetry";
const char* IOT_API_KEY = "LA_MISMA_CLAVE_DE_IOT_API_KEY";

int VALOR_SECO = 1000;
int VALOR_AGUA = 400;
const int UMBRAL_EXCESO = 85;
const int MARGEN_OK = 10;
const unsigned long INTERVALO_ENVIO_MS = 4000;

enum Estado { EST_OK, EST_SECO, EST_EXCESO };
Estado estado = EST_OK;

bool modoAutomatico = true;
bool riegoManualActivo = false;
int umbralHumedadMinima = 35;
bool riegoActivo = false;
bool alarmaActiva = false;

unsigned long ultimoEnvio = 0;
unsigned long ultimoParpadeo = 0;
unsigned long ultimoBeepAlarma = 0;
bool ledEstado = false;

const char* nombreEstado(Estado valor) {
  if (valor == EST_SECO) return "seco";
  if (valor == EST_EXCESO) return "exceso";
  return "ok";
}

void beep(int veces, int ms) {
  for (int i = 0; i < veces; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(ms);
    digitalWrite(PIN_BUZZER, LOW);
    delay(150);
  }
}

void titilar(int veces, int ms) {
  for (int i = 0; i < veces; i++) {
    digitalWrite(PIN_LED, HIGH);
    delay(ms);
    digitalWrite(PIN_LED, LOW);
    delay(ms);
  }
}

int leerSuelo(int &crudo) {
  long suma = 0;
  for (int i = 0; i < 10; i++) {
    suma += analogRead(PIN_SUELO);
    delay(10);
  }
  crudo = suma / 10;
  return constrain(map(crudo, VALOR_SECO, VALOR_AGUA, 0, 100), 0, 100);
}

void evaluarEstado(int suelo) {
  Estado anterior = estado;
  int umbralOk = umbralHumedadMinima + MARGEN_OK;

  if (suelo < umbralHumedadMinima) estado = EST_SECO;
  else if (estado == EST_SECO && suelo < umbralOk) estado = EST_SECO;
  else if (suelo > UMBRAL_EXCESO) estado = EST_EXCESO;
  else estado = EST_OK;

  if (estado != anterior) {
    if (estado == EST_SECO) beep(3, 400);
    else if (estado == EST_EXCESO) beep(2, 700);
    else beep(1, 800);
    ultimoBeepAlarma = millis();
  }
}

void actualizarLED() {
  if (!riegoActivo) {
    digitalWrite(PIN_LED, LOW);
    ledEstado = false;
    return;
  }

  if (!modoAutomatico) {
    digitalWrite(PIN_LED, HIGH);
    ledEstado = true;
    return;
  }

  if (millis() - ultimoParpadeo >= 150) {
    ultimoParpadeo = millis();
    ledEstado = !ledEstado;
    digitalWrite(PIN_LED, ledEstado ? HIGH : LOW);
  }
}

void actualizarBuzzer(unsigned long ahora) {
  if (alarmaActiva && ahora - ultimoBeepAlarma >= 1200) {
    ultimoBeepAlarma = ahora;
    beep(1, 120);
  }
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

void enviarTelemetria(int suelo, int crudo) {
  conectarWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure cliente;
  cliente.setInsecure();

  HTTPClient http;
  http.begin(cliente, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", IOT_API_KEY);
  http.setTimeout(6000);

  StaticJsonDocument<320> payload;
  payload["humedad"] = suelo;
  payload["estado_riego"] = riegoActivo;
  payload["alarma_activa"] = alarmaActiva;
  payload["estado_suelo"] = nombreEstado(estado);
  payload["lectura_cruda"] = crudo;

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
      umbralHumedadMinima = constrain(umbralHumedadMinima, 0, 100 - MARGEN_OK);
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
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED, LOW);

  titilar(3, 200);
  beep(2, 200);
  Serial.println("Sistema de riego iniciado");

  conectarWiFi();
}

void loop() {
  int crudo;
  int suelo = leerSuelo(crudo);
  evaluarEstado(suelo);

  if (modoAutomatico) {
    riegoActivo = (estado == EST_SECO);
    alarmaActiva = (estado == EST_SECO || estado == EST_EXCESO);
  } else {
    riegoActivo = riegoManualActivo;
    alarmaActiva = false;
  }

  actualizarLED();
  actualizarBuzzer(millis());

  Serial.print("Crudo: ");
  Serial.print(crudo);
  Serial.print("  Suelo: ");
  Serial.print(suelo);
  Serial.print(" %  Estado: ");
  Serial.print(nombreEstado(estado));
  Serial.print("  Modo: ");
  Serial.print(modoAutomatico ? "AUTO" : "MANUAL");
  Serial.print("  Riego: ");
  Serial.print(riegoActivo ? "ON" : "OFF");
  Serial.print("  Alarma: ");
  Serial.println(alarmaActiva ? "ON" : "OFF");

  if (millis() - ultimoEnvio >= INTERVALO_ENVIO_MS) {
    ultimoEnvio = millis();
    enviarTelemetria(suelo, crudo);
  }

  delay(50);
}
