import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

// SQL para crear todas las tablas
const SCHEMA_SQL = `
-- Tablas Estáticas (Contenido del Libro)
CREATE TABLE IF NOT EXISTS libros (
  id INTEGER PRIMARY KEY,
  titulo TEXT NOT NULL,
  orden INTEGER,
  descripcion_breve TEXT
);

CREATE TABLE IF NOT EXISTS capitulos (
  id INTEGER PRIMARY KEY,
  libro_id INTEGER REFERENCES libros(id),
  numero TEXT,
  titulo TEXT NOT NULL,
  contenido_markdown TEXT,
  tipo_contenido TEXT,
  referencia_libro TEXT
);

CREATE TABLE IF NOT EXISTS taxonomia_tpi (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE,
  nombre_completo TEXT,
  necesidad_principal TEXT,
  indicadores_contacto_visual TEXT,
  indicadores_volumen TEXT,
  indicadores_ritmo TEXT,
  miedo_subyacente TEXT,
  error_conexion TEXT,
  script_apertura TEXT,
  estrategia_fase_apertura TEXT,
  estrategia_fase_conexion TEXT,
  estrategia_fase_profundizacion TEXT,
  color_hex TEXT
);

CREATE TABLE IF NOT EXISTS leyes_interaccion (
  id INTEGER PRIMARY KEY,
  numero INTEGER,
  nombre TEXT,
  definicion TEXT,
  implicacion TEXT,
  violacion_comun TEXT,
  antidoto TEXT,
  script_equilibrio TEXT
);

CREATE TABLE IF NOT EXISTS pilares_mar (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE,
  nombre TEXT,
  definicion_operativa TEXT,
  pregunta_1 TEXT,
  pregunta_2 TEXT,
  pregunta_3 TEXT,
  pregunta_4 TEXT,
  pregunta_5 TEXT
);

CREATE TABLE IF NOT EXISTS casos_clinicos (
  id INTEGER PRIMARY KEY,
  nombre_codigo TEXT,
  edad INTEGER,
  profesion TEXT,
  diagnostico_mar_inicial TEXT,
  problema_clave TEXT,
  resolucion_aplicada TEXT,
  libro_ubicacion TEXT
);

CREATE TABLE IF NOT EXISTS scripts_6_preguntas (
  id INTEGER PRIMARY KEY,
  numero INTEGER,
  texto_exacto TEXT,
  contexto_uso TEXT,
  pilar_relacionado TEXT,
  tipo_crisis TEXT
);

CREATE TABLE IF NOT EXISTS role_plays (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE,
  titulo TEXT,
  setup TEXT,
  perfil_tpi_objetivo TEXT,
  script_apertura TEXT,
  metricas_exito TEXT,
  libro_referencia TEXT
);

-- Tablas Dinámicas (Usuario y Sesiones)
CREATE TABLE IF NOT EXISTS instructor_perfil (
  id INTEGER PRIMARY KEY,
  uuid TEXT UNIQUE,
  nombre TEXT,
  nivel_certificacion INTEGER,
  fecha_certificacion DATE,
  email_institucional TEXT,
  activo BOOLEAN DEFAULT 1,
  mar_minimo_operativo INTEGER DEFAULT 16
);

CREATE TABLE IF NOT EXISTS sesiones_dictadas (
  id INTEGER PRIMARY KEY,
  instructor_id INTEGER REFERENCES instructor_perfil(id),
  fecha_hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_hora_fin TIMESTAMP,
  alumno_codigo TEXT,
  estado_sesion TEXT,
  mar_alumno_pre INTEGER,
  pilar_trabajado TEXT,
  ley_violada_detectada TEXT,
  perfil_tpi_detectado TEXT,
  acepta_aplicado BOOLEAN,
  pregunta_numero_usada INTEGER,
  role_play_id INTEGER,
  alerta_etica BOOLEAN DEFAULT 0,
  descripcion_alerta TEXT,
  derivacion_realizada BOOLEAN,
  tarea_48h TEXT,
  fecha_limite_tarea DATE,
  notas_cierre TEXT
);

CREATE TABLE IF NOT EXISTS acepta_logs (
  id INTEGER PRIMARY KEY,
  sesion_id INTEGER REFERENCES sesiones_dictadas(id),
  timestamp_paso TIMESTAMP,
  paso_letra TEXT,
  emocion_nombre TEXT,
  emocion_intensidad INTEGER,
  pilar_seleccionado TEXT,
  puntuacion_pilar INTEGER,
  inversion_porcentaje INTEGER,
  decision_tomada TEXT,
  ajuste_especifico TEXT,
  completado BOOLEAN
);

CREATE TABLE IF NOT EXISTS mar_evaluaciones_diarias (
  id INTEGER PRIMARY KEY,
  instructor_id INTEGER REFERENCES instructor_perfil(id),
  fecha DATE UNIQUE,
  coherencia INTEGER,
  autonomia INTEGER,
  reciprocidad INTEGER,
  logica INTEGER,
  total_mar INTEGER,
  pilar_prioritario TEXT,
  contexto_emocional TEXT,
  declaracion_proposito_leida BOOLEAN
);

CREATE TABLE IF NOT EXISTS efecto_luna_fichas (
  id INTEGER PRIMARY KEY,
  instructor_id INTEGER REFERENCES instructor_perfil(id),
  sesion_id INTEGER REFERENCES sesiones_dictadas(id),
  fecha_evento DATE,
  fecha_procesamiento DATE,
  tipo TEXT,
  impacto_descripcion TEXT,
  impacto_emocion TEXT,
  impacto_intensidad INTEGER,
  reflexion_informacion TEXT,
  reflexion_patron_detectado BOOLEAN,
  reconstruccion_variable TEXT,
  reconstruccion_ajuste TEXT,
  expansion_fecha_proxima DATE,
  expansion_ajuste_aplicado BOOLEAN,
  expansion_resultado TEXT,
  ciclo_completado BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contenido_favoritos (
  id INTEGER PRIMARY KEY,
  instructor_id INTEGER,
  tipo_contenido TEXT,
  referencia_id INTEGER,
  nota_personal TEXT,
  fecha_marcado TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY,
  tabla_afectada TEXT,
  registro_id INTEGER,
  operacion TEXT,
  timestamp_local TIMESTAMP,
  datos_json TEXT,
  sincronizado BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY,
  instructor_id INTEGER,
  timestamp_sync TIMESTAMP,
  registros_subidos INTEGER,
  registros_bajados INTEGER,
  ip_origen TEXT,
  dispositivo_id TEXT
);

-- Tabla para persistencia del cronómetro
CREATE TABLE IF NOT EXISTS cronometro_estado (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sesion_activa BOOLEAN DEFAULT 0,
  timestamp_inicio INTEGER,
  tiempo_transcurrido INTEGER DEFAULT 0,
  alumno_codigo TEXT,
  alertas_mostradas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_capitulos_libro ON capitulos(libro_id, numero);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones_dictadas(fecha_hora_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_mar_fecha ON mar_evaluaciones_diarias(instructor_id, fecha DESC);
`;

// Datos iniciales del sistema MAR
const DATOS_INICIALES = `
-- Libros
INSERT OR IGNORE INTO libros (id, titulo, orden, descripcion_breve) VALUES
(1, 'LIBRO I: FUNDAMENTOS', 1, 'Lo que eres antes de interactuar'),
(2, 'LIBRO II: LA OTRA PERSONA', 2, 'Perfiles y lectura atenta'),
(3, 'LIBRO III: LA DINÁMICA', 3, 'Leyes y fases de interacción'),
(4, 'LIBRO IV: EL RECHAZO', 4, 'Silencio digital y cese'),
(5, 'LIBRO V: ECOLOGÍA DIGITAL', 5, 'Arquitectura de perfil y mensajería'),
(6, 'LIBRO VI: ÉTICA', 6, 'Salvaguardas y límites');

-- Pilares MAR
INSERT OR IGNORE INTO pilares_mar (id, codigo, nombre, definicion_operativa, pregunta_1, pregunta_2, pregunta_3, pregunta_4, pregunta_5) VALUES
(1, 'COH', 'Coherencia', '¿Lo que digo coincide con lo que hago?', 
 '¿Mis acciones reflejan lo que digo creer?', '¿Hay contradicciones entre mis palabras y hechos?', 
 '¿Mantengo consistencia en diferentes contextos?', '¿Mis valores se traducen en comportamiento?', 
 '¿Reconozco cuando actúo fuera de mis principios?'),
(2, 'AUT', 'Autonomía', '¿Mi estado emocional depende de esta respuesta específica?',
 '¿Puedo estar bien independientemente de la respuesta?', '¿Mi autoestima fluctúa con las reacciones ajenas?',
 '¿Tengo recursos internos para regularme?', '¿Dependo de la validación externa para sentirme estable?',
 '¿Puedo tolerar la incertidumbre sin ansiedad?'),
(3, 'REC', 'Reciprocidad', '¿Ajusto mi inversión según la respuesta que recibo?',
 '¿Invierto proporcionalmente a lo que recibo?', '¿Detecto cuando hay desequilibrio en la relación?',
 '¿Puedo reducir inversión sin culpa?', '¿Reconozco señales de interés genuino?',
 '¿Evito sobre-invertir en interacciones unilaterales?'),
(4, 'LOG', 'Lógica', '¿Decido basado en metas claras o en impulsos del momento?',
 '¿Tengo objetivos definidos para esta interacción?', '¿Mis decisiones me acercan a mis metas?',
 '¿Evalúo consecuencias antes de actuar?', '¿Distingo entre deseo y estrategia?',
 '¿Reviso mis patrones de decisión regularmente?');

-- Taxonomía TPI
INSERT OR IGNORE INTO taxonomia_tpi (id, codigo, nombre_completo, necesidad_principal, indicadores_contacto_visual, indicadores_volumen, indicadores_ritmo, miedo_subyacente, error_conexion, script_apertura, estrategia_fase_apertura, estrategia_fase_conexion, estrategia_fase_profundizacion, color_hex) VALUES
(1, 'AR', 'Alta Receptividad', 'Estimulación, novedad, desafío', 'Sostenido, curioso', 'Variable, expresivo', 'Rápido, saltos lógicos', 'Aburrimiento', 'Simplificar, aburrir', 'Veo que mencionas [tema]. La pregunta incómoda es: ¿realmente crees eso o es conveniente creerlo?', 'Ofrecer complejidad, propuesta inusual', 'Mantener ritmo intelectual, no simplificar', 'Desafiar con respeto, profundidad conceptual', '#C05621'),
(2, 'SN', 'Seguridad Necesaria', 'Conexión genuina, confianza, calidez', 'Intermitente, buscando calidez', 'Suave, pausado', 'Lento, deliberado', 'Rechazo, abandono', 'Presionar, apresurar', 'Antes de que te cuente eso, ¿cómo llegaste tú a estar aquí hoy?', 'Mostrar vulnerabilidad controlada, escuchar', 'Validar emociones, no juzgar', 'Profundizar lentamente, consistencia', '#38A169'),
(3, 'DS', 'Dominancia Social', 'Reconocimiento, estatus, influencia', 'Directo, evaluador', 'Fuerte, seguro', 'Rápido, decisivo', 'Pérdida de control', 'Desafiar directamente, ignorar señales', 'Lo que me llamó la atención no fue [lo obvio], sino [detalle específico]', 'Reconocer algo no obvio, mostrar observación', 'No competir, complementar desde fortaleza', 'Ofrecer valor estratégico, no adulación', '#3182CE'),
(4, 'AN', 'Analítico-Reservado', 'Espacio, procesamiento, precisión', 'Evitativo o muy enfocado', 'Bajo, medido', 'Lento, pausado', 'Error, exposición', 'Presionar respuesta, llenar silencios', 'Noto que estás procesando. No necesitas responder ahora.', 'Dar espacio, no llenar silencios', 'Preguntas abiertas sin presión', 'Permitir tiempo, valorar profundidad', '#805AD5');

-- Leyes de Interacción
INSERT OR IGNORE INTO leyes_interaccion (id, numero, nombre, definicion, implicacion, violacion_comun, antidoto, script_equilibrio) VALUES
(1, 1, 'Ley de Asimetría', 'Quien menos necesita, más valor percibido tiene', 'La necesidad visible reduce valor percibido', 'Decir "realmente me gustas" muy pronto', 'Mostrar necesidad específica (no del resultado)', 'Disfruto esto. No necesito que sea más.'),
(2, 2, 'Ley de Inversión', 'La inversión emocional debe ser proporcional a la respuesta', 'Desequilibrio genera incomodidad o desinterés', 'Invertir más del 70% sin reciprocidad', 'Cuéntame tu perspectiva antes de seguir', 'Quiero entender primero tu punto de vista.'),
(3, 3, 'Ley de Escasez', 'Lo raro se valora, lo abundante se ignora', 'Disponibilidad excesiva reduce interés', 'Responder inmediatamente siempre', 'Escasez de acceso, no de claridad', 'Esto me interesa. Necesito tiempo para procesarlo.'),
(4, 4, 'Ley de Preselección', 'El valor social se transmite por asociación', 'Quien ya es elegido, es más elegible', 'Forzar demostraciones de valor', 'Que tu propósito genere conexiones reales', 'Mi propósito me conecta con personas interesantes.'),
(5, 5, 'Ley de Sincronización', 'Las emociones son contagiosas', 'Tu estado define el campo emocional', 'Contagiar ansiedad o urgencia', 'Sincronización selectiva, no contagio', 'Estoy tranquilo. Tomemos el tiempo que necesites.');

-- Las 6 Preguntas Salvadoras
INSERT OR IGNORE INTO scripts_6_preguntas (id, numero, texto_exacto, contexto_uso, pilar_relacionado, tipo_crisis) VALUES
(1, 1, 'Veo que sabes el concepto perfectamente. ¿Qué te impidió operar desde él en ese momento específico?', 'Resistencia técnica', 'COH', NULL),
(2, 2, 'Supongamos, solo por hipótesis, que esa persona no cambia nunca. ¿Qué variable de tu propio sistema aún podrías ajustar?', 'Víctima externa', 'AUT', NULL),
(3, 3, 'No necesitas nombrar el sentimiento todavía. Solo dime: ¿Tu cuerpo quiere acercarse, alejarse, o quedarse quieto?', 'Atasco emocional', 'REC', NULL),
(4, 4, 'Si te doy la frase ahora, te convierto en mi títere, no en operador MAR. ¿Qué detectaste en su perfil TPI?', 'Impulso técnico', 'LOG', NULL),
(5, 5, 'Interesante diagnóstico del otro. ¿Qué proyección tuya crees que estaba operando sin que te dieras cuenta?', 'Proyección extrema', 'COH', NULL),
(6, 6, 'No te diré si vas bien o mal. ¿Operaste hoy desde Coherencia, Autonomía, Reciprocidad y Lógica al menos una vez consciente?', 'Cierre de valor', 'LOG', NULL);

-- Role Plays
INSERT OR IGNORE INTO role_plays (id, codigo, titulo, setup, perfil_tpi_objetivo, script_apertura, metricas_exito, libro_referencia) VALUES
(1, 'RP-01', 'Apertura AR', 'Alumno con perfil Alta Receptividad. Te interrumpe constantemente. Necesita estimulación.', 'AR', 'Veo que mencionas [tema]. La pregunta incómoda es: ¿realmente crees eso o es conveniente creerlo?', '["Mantiene contacto visual", "Muestra curiosidad genuina", "No se aburre en 2 minutos"]', 'Libro II, Cap 6'),
(2, 'RP-02', 'Exploración SN', 'Alumno con perfil Seguridad Necesaria. Duda de sí mismo. Busca validación constante.', 'SN', 'Antes de que te cuente eso, ¿cómo llegaste tú a estar aquí hoy?', '["Se relaja visiblemente", "Comparte algo personal", "No pide validación externa"]', 'Libro II, Cap 6'),
(3, 'RP-03', 'Retroceso de fase', 'La sesión avanzaba bien pero el alumno retrocedió a defensas iniciales.', 'AR', 'Noto que algo cambió. ¿Qué detectaste diferente en este momento?', '["Reconoce el cambio", "No se defiende", "Vuelve a conectar"]', 'Libro III, Cap 9'),
(4, 'RP-04', 'Violación Ley Inversión', 'Alumno invirtió demasiado emocionalmente sin reciprocidad.', 'SN', 'Cuéntame tu perspectiva antes de seguir. Quiero entender primero.', '["Reduce intensidad", "Escucha activamente", "Ajusta inversión"]', 'Libro III, Cap 8'),
(5, 'RP-05', 'Confusión DS vs AN', 'No logras distinguir si es Dominancia Social o Analítico-Reservado.', 'DS', 'Lo que me llamó la atención no fue [lo obvio], sino [detalle específico]', '["El perfil se revela naturalmente", "No forzar etiqueta", "Adaptar estrategia"]', 'Libro II, Cap 6.5'),
(6, 'RP-06', 'Protocolo de Cese', 'Aplicar las 3 fases del Protocolo de Cese correctamente.', 'SN', 'Voy a tomar distancia para procesar esto mejor.', '["No envía mensajes de ansiedad", "Respeta el tiempo", "Reentrada adecuada"]', 'Libro IV, Cap 11'),
(7, 'RP-07', 'Auditoría de Perfil', 'Evaluar las 5 fotos de perfil de un alumno.', 'AN', 'Veo que has pensado en cómo presentarte. ¿Qué querías transmitir específicamente?', '["Detecta inconsistencias", "Identifica red flags", "Sugiere ajustes"]', 'Libro V, Cap 12'),
(8, 'RP-08', 'Crisis emocional', 'Alumno muestra signos de crisis emocional. Derivación necesaria.', 'SN', 'Esto parece ir más allá de lo que podemos trabajar aquí. ¿Tienes acceso a apoyo profesional?', '["No intenta ser terapeuta", "Deriva adecuadamente", "Documenta correctamente"]', 'Libro VI, Cap 15'),
(9, 'RP-09', 'Reciprocidad asimétrica', 'Alumno no ajusta inversión según respuesta recibida.', 'AR', '¿Ajustas tu inversión según la respuesta que recibes?', '["Reconoce desequilibrio", "Ajusta comportamiento", "No genera resentimiento"]', 'Libro I, Cap 2'),
(10, 'RP-10', 'Narrativa forzada', 'Alumno cuenta una historia que no parece genuina.', 'AN', 'Noto que estás procesando antes de responder. Tomate el tiempo.', '["No presiona", "Permite autenticidad", "Explora genuinamente"]', 'Libro III, Cap 10');

-- Capítulos de ejemplo (Libro I)
INSERT OR IGNORE INTO capitulos (id, libro_id, numero, titulo, contenido_markdown, tipo_contenido, referencia_libro) VALUES
(1, 1, 'Capítulo 1', 'El problema de la proyección', 
'# El Problema de la Proyección\n\n## Caso Martín\n\nMartín tenía 34 años, era arquitecto exitoso, y no entendía por qué cada relación que iniciaba terminaba en el mismo patrón: él entregándose completamente, ella distanciándose gradualmente.\n\n> "No entiendo qué hago mal. Soy atento, detallista, siempre disponible..."\n\n## El error fundamental\n\nMartín estaba proyectando: atribuyendo a las demás personas sus propias necesidades y valores. Él valoraba la disponibilidad, asumía que todos la valoraban igual.\n\n## Checklist: Auditoría de Proyección\n\n- [ ] ¿Qué asumo que el otro valora?\n- [ ] ¿De dónde saqué esa información?\n- [ ] ¿Hay evidencia contraria que ignoré?\n- [ ] ¿Mi comportamiento refleja mis supuestos?\n- [ ] ¿Qué pasaría si mis supuestos fueran incorrectos?', 
'teoria', 'p. 7'),
(2, 1, 'Capítulo 2', 'Los Cuatro Pilares MAR', 
'# Los Cuatro Pilares MAR\n\nEl sistema MAR se construye sobre cuatro pilares fundamentales que definen tu estabilidad operativa antes de cualquier interacción.\n\n## 1. Coherencia\n> "¿Lo que digo coincide con lo que hago?"\n\nLa coherencia es la base de la credibilidad. Cuando tus acciones reflejan tus palabras, generas confianza.\n\n## 2. Autonomía\n> "¿Mi estado emocional depende de esta respuesta específica?"\n\nLa autonomía te permite interactuar desde la abundancia, no desde la necesidad.\n\n## 3. Reciprocidad\n> "¿Ajusto mi inversión según la respuesta que recibo?"\n\nLa reciprocidad equilibrada mantiene relaciones saludables y sostenibles.\n\n## 4. Lógica Operativa\n> "¿Decido basado en metas claras o en impulsos del momento?"\n\nLa lógica te conecta con tu propósito a largo plazo.\n\n## Test de Autoevaluación\n\nCalifica cada pilar del 1 al 5:\n- 1 = No opero desde este pilar\n- 3 = Opero a veces\n- 5 = Opero consistentemente\n\n**Total: 4-20**\n- 17-20: Verde (Estable)\n- 12-16: Amarillo (Fricción detectable)\n- <12: Rojo (No interactuar)', 
'teoria', 'p. 9'),
(3, 1, 'Capítulo 3', 'Centrado de Propósito', 
'# Centrado de Propósito\n\nAntes de cualquier interacción significativa, necesitas claridad sobre quién eres y hacia dónde vas.\n\n## La Frase Oficial\n\n> "Independientemente de mi situación sentimental, estoy construyendo **[INPUT]** mediante **[INPUT]**, de modo que en cinco años habré logrado **[INPUT]**."\n\n## Ejemplos\n\n**Ejemplo 1:**\n"Independientemente de mi situación sentimental, estoy construyendo **una consultora de diseño sostenible** mediante **proyectos que combinen estética y responsabilidad ambiental**, de modo que en cinco años habré logrado **posicionarme como referente en Latinoamérica**."\n\n**Ejemplo 2:**\n"Independientemente de mi situación sentimental, estoy construyendo **una familia consciente y conectada** mediante **relaciones basadas en honestidad y crecimiento mutuo**, de modo que en cinco años habré logrado **ser la persona que mi hijo puede mirar con orgullo**."\n\n## Cuándo usarla\n\n- Al inicio de cada día\n- Antes de interacciones importantes\n- Cuando sientes que pierdes el rumbo\n- Como ancla emocional en momentos de duda', 
ejercicio', 'p. 12'),
(4, 1, 'Capítulo 4', 'Efecto Luna', 
'# Efecto Luna: Procesamiento de Eventos Significativos\n\nEl Efecto Luna es el protocolo MAR para procesar rechazos, fracasos o eventos emocionalmente significativos.\n\n## Las 4 Fases\n\n### 1. Impacto (Inmediato)\n- **¿Qué ocurrió?** (Hechos objetivos)\n- **¿Qué emoción sentí?** (Nombre específico)\n- **¿Con qué intensidad?** (1-10)\n\n### 2. Reflexión (24-48h)\n- **¿Qué información contiene este evento?**\n- **¿Detecto algún patrón recurrente?**\n\n### 3. Reconstrucción (48-72h)\n- **¿Qué variable específica puedo ajustar?**\n- **¿Qué acción concreta tomaré la próxima vez?**\n\n### 4. Expansión (5-7 días)\n- **¿Cuándo aplicaré este ajuste?**\n- **¿Qué resultado espero?**\n\n> ⚠️ **Alerta:** Si pasas más de 24h en fase Impacto sin avanzar a Reflexión, activa protocolo de apoyo.', 
'protocolo', 'p. 56');

-- Instructor de demo
INSERT OR IGNORE INTO instructor_perfil (id, uuid, nombre, nivel_certificacion, fecha_certificacion, email_institucional, activo, mar_minimo_operativo) VALUES
(1, 'MAR-INST-001', 'Instructor Demo', 3, '2024-01-15', 'instructor@mar-system.edu', 1, 16);

-- Inicializar estado del cronómetro
INSERT OR IGNORE INTO cronometro_estado (id, sesion_activa, timestamp_inicio, tiempo_transcurrido, alumno_codigo, alertas_mostradas) 
VALUES (1, 0, NULL, 0, '', '[]');
`;

// Verificar si estamos en plataforma nativa
const isNative = () => Capacitor.isNativePlatform();

export function useDatabase() {
  const [db, setDb] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sqliteRef = useRef<SQLiteConnection | null>(null);
  const webDbRef = useRef<Database | null>(null);

  // Inicializar la base de datos
  useEffect(() => {
    const initDb = async () => {
      try {
        if (isNative()) {
          // Usar SQLite nativo de Capacitor
          console.log('Inicializando SQLite nativo...');
          const sqlite = new SQLiteConnection(CapacitorSQLite);
          sqliteRef.current = sqlite;
          
          const dbName = 'mar_field_kit_db';
          const isConn = await sqlite.isConnection(dbName, false);
          
          let database;
          if (isConn.result) {
            database = await sqlite.retrieveConnection(dbName, false);
          } else {
            database = await sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
            await database.open();
          }
          
          // Crear tablas si no existen
          await database.execute(SCHEMA_SQL);
          
          // Verificar si hay datos iniciales
          const librosCount = await database.query('SELECT COUNT(*) as count FROM libros');
          if (librosCount.values && librosCount.values[0].count === 0) {
            // Insertar datos iniciales
            const statements = DATOS_INICIALES.split(';').filter(s => s.trim());
            for (const stmt of statements) {
              if (stmt.trim()) {
                try {
                  await database.execute(stmt + ';');
                } catch (e) {
                  // Ignorar errores de duplicados
                }
              }
            }
          }
          
          setDb(database);
          setIsReady(true);
          console.log('SQLite nativo inicializado correctamente');
        } else {
          // Fallback a sql.js para web
          console.log('Inicializando sql.js (modo web)...');
          const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
          });
          
          const database = new SQL.Database();
          database.run(SCHEMA_SQL);
          database.run(DATOS_INICIALES);
          
          webDbRef.current = database;
          setDb(database);
          setIsReady(true);
          console.log('sql.js inicializado correctamente');
        }
      } catch (err) {
        console.error('Error inicializando base de datos:', err);
        setError('Error al inicializar la base de datos: ' + (err as Error).message);
      }
    };

    initDb();
  }, []);

  // Función para ejecutar consultas SELECT
  const query = useCallback(async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
    if (!db) return [];
    
    try {
      if (isNative()) {
        // SQLite nativo
        const result = await db.query(sql, params);
        return result.values || [];
      } else {
        // sql.js
        const stmt = db.prepare(sql);
        if (params) {
          stmt.bind(params);
        }
        
        const results: T[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject() as T);
        }
        stmt.free();
        
        return results;
      }
    } catch (err) {
      console.error('Error en query:', err);
      return [];
    }
  }, [db]);

  // Función para ejecutar comandos (INSERT, UPDATE, DELETE)
  const execute = useCallback(async (sql: string, params?: any[]): Promise<boolean> => {
    if (!db) return false;
    
    try {
      if (isNative()) {
        // SQLite nativo
        await db.run(sql, params);
        return true;
      } else {
        // sql.js
        db.run(sql, params);
        return true;
      }
    } catch (err) {
      console.error('Error en execute:', err);
      return false;
    }
  }, [db]);

  // Función para ejecutar con retorno de cambios
  const executeWithChanges = useCallback(async (sql: string, params?: any[]): Promise<{ success: boolean; changes?: number }> => {
    if (!db) return { success: false };
    
    try {
      if (isNative()) {
        const result = await db.run(sql, params);
        return { success: true, changes: result.changes?.changes || 0 };
      } else {
        db.run(sql, params);
        return { success: true };
      }
    } catch (err) {
      console.error('Error en executeWithChanges:', err);
      return { success: false };
    }
  }, [db]);

  // Función para obtener un solo registro
  const queryOne = useCallback(async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
    const results = await query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }, [query]);

  // Funciones específicas para el cronómetro persistente
  const guardarEstadoCronometro = useCallback(async (estado: {
    sesionActiva: boolean;
    timestampInicio: number | null;
    tiempoTranscurrido: number;
    alumnoCodigo: string;
    alertasMostradas: number[];
  }): Promise<boolean> => {
    return execute(
      `UPDATE cronometro_estado SET 
        sesion_activa = ?, 
        timestamp_inicio = ?, 
        tiempo_transcurrido = ?, 
        alumno_codigo = ?, 
        alertas_mostradas = ? 
       WHERE id = 1`,
      [
        estado.sesionActiva ? 1 : 0,
        estado.timestampInicio,
        estado.tiempoTranscurrido,
        estado.alumnoCodigo,
        JSON.stringify(estado.alertasMostradas)
      ]
    );
  }, [execute]);

  const cargarEstadoCronometro = useCallback(async (): Promise<{
    sesionActiva: boolean;
    timestampInicio: number | null;
    tiempoTranscurrido: number;
    alumnoCodigo: string;
    alertasMostradas: number[];
  } | null> => {
    const result = await queryOne<any>('SELECT * FROM cronometro_estado WHERE id = 1');
    if (!result) return null;
    
    return {
      sesionActiva: result.sesion_activa === 1,
      timestampInicio: result.timestamp_inicio,
      tiempoTranscurrido: result.tiempo_transcurrido,
      alumnoCodigo: result.alumno_codigo,
      alertasMostradas: JSON.parse(result.alertas_mostradas || '[]')
    };
  }, [queryOne]);

  return {
    db,
    isReady,
    error,
    query,
    execute,
    executeWithChanges,
    queryOne,
    guardarEstadoCronometro,
    cargarEstadoCronometro,
    isNative: isNative()
  };
}

export default useDatabase;
