// ============================================
// TIPOS DEL SISTEMA MAR - MAR Field Kit
// ============================================

// --- PILARES MAR ---
export type PilarCodigo = 'COH' | 'AUT' | 'REC' | 'LOG';

export interface PilarMAR {
  id: number;
  codigo: PilarCodigo;
  nombre: string;
  definicion_operativa: string;
  pregunta_1: string;
  pregunta_2: string;
  pregunta_3: string;
  pregunta_4: string;
  pregunta_5: string;
}

export interface EvaluacionPilar {
  coherencia: number;
  autonomia: number;
  reciprocidad: number;
  logica: number;
}

// --- PERFILES TPI ---
export type PerfilTPICodigo = 'AR' | 'SN' | 'DS' | 'AN';

export interface TaxonomiaTPI {
  id: number;
  codigo: PerfilTPICodigo;
  nombre_completo: string;
  necesidad_principal: string;
  indicadores_contacto_visual: string;
  indicadores_volumen: string;
  indicadores_ritmo: string;
  miedo_subyacente: string;
  error_conexion: string;
  script_apertura: string;
  estrategia_fase_apertura: string;
  estrategia_fase_conexion: string;
  estrategia_fase_profundizacion: string;
  color_hex: string;
}

export interface PerfilHibrido {
  transicion: string;
  indicadores: string;
}

// --- LEYES DE INTERACCIÓN ---
export interface LeyInteraccion {
  id: number;
  numero: number;
  nombre: string;
  definicion: string;
  implicacion: string;
  violacion_comun: string;
  antidoto: string;
  script_equilibrio: string;
}

// --- LIBROS Y CAPÍTULOS ---
export interface Libro {
  id: number;
  titulo: string;
  orden: number;
  descripcion_breve: string;
}

export interface Capitulo {
  id: number;
  libro_id: number;
  numero: string;
  titulo: string;
  contenido_markdown: string;
  tipo_contenido: 'teoria' | 'caso' | 'ejercicio' | 'protocolo';
  referencia_libro: string;
}

// --- CASOS CLÍNICOS ---
export interface CasoClinico {
  id: number;
  nombre_codigo: string;
  edad: number;
  profesion: string;
  diagnostico_mar_inicial: string; // JSON
  problema_clave: string;
  resolucion_aplicada: string;
  libro_ubicacion: string;
}

// --- LAS 6 PREGUNTAS SALVADORAS ---
export interface ScriptPregunta {
  id: number;
  numero: number;
  texto_exacto: string;
  contexto_uso: string;
  pilar_relacionado: PilarCodigo;
  tipo_crisis: string | null;
}

// --- INSTRUCTOR ---
export interface InstructorPerfil {
  id: number;
  uuid: string;
  nombre: string;
  nivel_certificacion: 2 | 3 | 4;
  fecha_certificacion: string;
  email_institucional: string;
  activo: boolean;
  mar_minimo_operativo: number;
}

// --- SESIONES ---
export type EstadoSesion = 'completada' | 'interrumpida' | 'emergencia';
export type DecisionACEPTA = 'cese' | 'reduccion' | 'reentrada' | 'continuar';

export interface SesionDictada {
  id: number;
  instructor_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string | null;
  alumno_codigo: string;
  estado_sesion: EstadoSesion;
  mar_alumno_pre: number | null;
  pilar_trabajado: PilarCodigo | null;
  ley_violada_detectada: string | null;
  perfil_tpi_detectado: PerfilTPICodigo | null;
  acepta_aplicado: boolean;
  pregunta_numero_usada: number | null;
  role_play_id: number | null;
  alerta_etica: boolean;
  descripcion_alerta: string | null;
  derivacion_realizada: boolean;
  tarea_48h: string | null;
  fecha_limite_tarea: string | null;
  notas_cierre: string | null;
}

// --- LOGS ACEPTA ---
export type PasoACEPTA = 'A' | 'C' | 'E' | 'P' | 'T' | 'A2';

export interface AceptaLog {
  id: number;
  sesion_id: number;
  timestamp_paso: string;
  paso_letra: PasoACEPTA;
  emocion_nombre: string | null;
  emocion_intensidad: number | null;
  pilar_seleccionado: PilarCodigo | null;
  puntuacion_pilar: number | null;
  inversion_porcentaje: number | null;
  decision_tomada: DecisionACEPTA | null;
  ajuste_especifico: string | null;
  completado: boolean;
}

// --- EVALUACIONES DIARIAS MAR ---
export interface MarEvaluacionDiaria {
  id: number;
  instructor_id: number;
  fecha: string;
  coherencia: number;
  autonomia: number;
  reciprocidad: number;
  logica: number;
  total_mar: number;
  pilar_prioritario: PilarCodigo | null;
  contexto_emocional: string | null;
  declaracion_proposito_leida: boolean;
}

// --- EFECTO LUNA ---
export type TipoLuna = 'romantico' | 'profesional' | 'social';

export interface EfectoLunaFicha {
  id: number;
  instructor_id: number;
  sesion_id: number | null;
  fecha_evento: string;
  fecha_procesamiento: string | null;
  tipo: TipoLuna;
  impacto_descripcion: string;
  impacto_emocion: string;
  impacto_intensidad: number;
  reflexion_informacion: string | null;
  reflexion_patron_detectado: boolean;
  reconstruccion_variable: string | null;
  reconstruccion_ajuste: string | null;
  expansion_fecha_proxima: string | null;
  expansion_ajuste_aplicado: boolean;
  expansion_resultado: string | null;
  ciclo_completado: boolean;
}

// --- FAVORITOS ---
export interface ContenidoFavorito {
  id: number;
  instructor_id: number;
  tipo_contenido: 'capitulo' | 'ley' | 'tpi' | 'script';
  referencia_id: number;
  nota_personal: string | null;
  fecha_marcado: string;
}

// --- SYNC ---
export interface SyncQueue {
  id: number;
  tabla_afectada: string;
  registro_id: number;
  operacion: 'insert' | 'update';
  timestamp_local: string;
  datos_json: string;
  sincronizado: boolean;
}

// --- ROLE PLAYS ---
export interface RolePlay {
  id: number;
  codigo: string;
  titulo: string;
  setup: string;
  perfil_tpi_objetivo: PerfilTPICodigo;
  script_apertura: string;
  metricas_exito: string; // JSON array
  libro_referencia: string;
}

// --- DASHBOARD ---
export interface DashboardInstructor {
  instructor_id: number;
  nombre: string;
  mar_actual: number | null;
  sesiones_hoy: number;
  lunas_pendientes: number;
  mar_minimo_operativo: number;
  estado_operativo: 'OPERATIVO' | 'NO_OPERAR';
}

// --- ESTADO DE LA APP ---
export type TabActiva = 'sesion' | 'libros' | 'herramientas' | 'bitacora';

export interface AppState {
  tabActiva: TabActiva;
  instructor: InstructorPerfil | null;
  sesionActiva: SesionDictada | null;
  cronometroActivo: boolean;
  tiempoRestante: number; // segundos
  offline: boolean;
}

// --- PROTOCOLO ACEPTA ESTADO ---
export interface AceptaEstado {
  pasoActual: number;
  emocion: string | null;
  descripcionEmocion: string;
  pilarSeleccionado: PilarCodigo | null;
  puntuacionPilar: number;
  inversionPorcentaje: number;
  preguntaGenerada: string | null;
  decision: DecisionACEPTA | null;
  ajuste: string;
}

// --- CRONÓMETRO ---
export interface CronometroSesion {
  tiempoTotal: number; // 90 minutos = 5400 segundos
  tiempoRestante: number;
  activo: boolean;
  alertasMostradas: number[];
}

// Constantes
export const ALERTAS_CRONOMETRO = [
  { minuto: 10, mensaje: 'Calibración de 90 segundos' },
  { minuto: 35, mensaje: 'Diagnóstico MAR del alumno completado?' },
  { minuto: 50, mensaje: 'Ajuste específico definido' },
  { minuto: 70, mensaje: 'Role-play simulado' },
  { minuto: 85, mensaje: 'Cierre operativo, tarea asignada' },
];

export const DURACION_SESION_MINUTOS = 90;

// Emociones para dropdown
export const EMOCIONES_ACEPTA = ['Ira', 'Tristeza', 'Vergüenza', 'Confusión', 'Alivio'];

// Pilares para selector
export const PILARES_MAR: { codigo: PilarCodigo; nombre: string; definicion: string }[] = [
  {
    codigo: 'COH',
    nombre: 'Coherencia',
    definicion: '¿Lo que digo coincide con lo que hago?'
  },
  {
    codigo: 'AUT',
    nombre: 'Autonomía',
    definicion: '¿Mi estado emocional depende de esta respuesta específica?'
  },
  {
    codigo: 'REC',
    nombre: 'Reciprocidad',
    definicion: '¿Ajusto mi inversión según la respuesta que recibo?'
  },
  {
    codigo: 'LOG',
    nombre: 'Lógica',
    definicion: '¿Decido basado en metas claras o en impulsos del momento?'
  }
];
