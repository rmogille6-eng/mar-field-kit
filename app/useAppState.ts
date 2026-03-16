import { useState, useCallback, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { 
  TabActiva, 
  SesionDictada, 
  InstructorPerfil,
  AceptaEstado,
  CronometroSesion,
  DecisionACEPTA,
  PilarCodigo
} from '@/types/mar';
import { 
  DURACION_SESION_MINUTOS, 
  ALERTAS_CRONOMETRO
} from '@/types/mar';

// Estado inicial de ACEPTA
const initialAceptaState: AceptaEstado = {
  pasoActual: 0,
  emocion: null,
  descripcionEmocion: '',
  pilarSeleccionado: null,
  puntuacionPilar: 3,
  inversionPorcentaje: 50,
  preguntaGenerada: null,
  decision: null,
  ajuste: ''
};

// Estado inicial del cronómetro
const initialCronometroState: CronometroSesion = {
  tiempoTotal: DURACION_SESION_MINUTOS * 60,
  tiempoRestante: DURACION_SESION_MINUTOS * 60,
  activo: false,
  alertasMostradas: []
};

// Verificar si estamos en plataforma nativa
const isNative = () => Capacitor.isNativePlatform();

export function useAppState(database?: any) {
  // Estado principal
  const [tabActiva, setTabActiva] = useState<TabActiva>('sesion');
  const [instructor, setInstructor] = useState<InstructorPerfil | null>(null);
  const [sesionActiva, setSesionActiva] = useState<SesionDictada | null>(null);
  const [offline, setOffline] = useState(true);
  
  // Estado del cronómetro
  const [cronometro, setCronometro] = useState<CronometroSesion>(initialCronometroState);
  const cronometroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cronometroStartTimeRef = useRef<number | null>(null);
  
  // Estado de ACEPTA
  const [aceptaEstado, setAceptaEstado] = useState<AceptaEstado>(initialAceptaState);
  const [aceptaActivo, setAceptaActivo] = useState(false);

  // Alertas del cronómetro
  const [alertaActiva, setAlertaActiva] = useState<{minuto: number, mensaje: string} | null>(null);

  // Cargar estado del cronómetro al iniciar
  useEffect(() => {
    const cargarEstadoPersistido = async () => {
      if (database?.isReady && database.cargarEstadoCronometro) {
        try {
          const estadoGuardado = await database.cargarEstadoCronometro();
          if (estadoGuardado && estadoGuardado.sesionActiva && estadoGuardado.timestampInicio) {
            // Calcular tiempo transcurrido
            const ahora = Date.now();
            const tiempoTranscurridoMs = ahora - estadoGuardado.timestampInicio;
            const tiempoTranscurridoSeg = Math.floor(tiempoTranscurridoMs / 1000) + estadoGuardado.tiempoTranscurrido;
            
            const nuevoTiempoRestante = Math.max(0, initialCronometroState.tiempoTotal - tiempoTranscurridoSeg);
            
            setCronometro(prev => ({
              ...prev,
              tiempoRestante: nuevoTiempoRestante,
              alertasMostradas: estadoGuardado.alertasMostradas || []
            }));
            
            // Si queda tiempo, reiniciar el cronómetro
            if (nuevoTiempoRestante > 0) {
              cronometroStartTimeRef.current = ahora;
              iniciarCronometro();
            }
            
            console.log('Cronómetro restaurado:', nuevoTiempoRestante, 'segundos restantes');
          }
        } catch (err) {
          console.error('Error cargando estado del cronómetro:', err);
        }
      }
    };
    
    cargarEstadoPersistido();
  }, [database?.isReady]);

  // Guardar estado del cronómetro cuando cambia
  const persistirEstadoCronometro = useCallback(async () => {
    if (database?.guardarEstadoCronometro) {
      try {
        await database.guardarEstadoCronometro({
          sesionActiva: cronometro.activo,
          timestampInicio: cronometroStartTimeRef.current,
          tiempoTranscurrido: cronometro.tiempoTotal - cronometro.tiempoRestante,
          alumnoCodigo: sesionActiva?.alumno_codigo || '',
          alertasMostradas: cronometro.alertasMostradas
        });
      } catch (err) {
        console.error('Error guardando estado del cronómetro:', err);
      }
    }
  }, [cronometro, sesionActiva, database]);

  // Listener de appStateChange para persistir al minimizar
  useEffect(() => {
    if (isNative()) {
      const handleAppStateChange = async ({ isActive }: { isActive: boolean }) => {
        console.log('App state changed:', isActive ? 'active' : 'background');
        
        if (!isActive) {
          // App va a background - guardar estado
          if (cronometro.activo && cronometroStartTimeRef.current) {
            const tiempoTranscurrido = Math.floor((Date.now() - cronometroStartTimeRef.current) / 1000);
            await database?.guardarEstadoCronometro?.({
              sesionActiva: true,
              timestampInicio: cronometroStartTimeRef.current,
              tiempoTranscurrido: (cronometro.tiempoTotal - cronometro.tiempoRestante) + tiempoTranscurrido,
              alumnoCodigo: sesionActiva?.alumno_codigo || '',
              alertasMostradas: cronometro.alertasMostradas
            });
          }
        } else {
          // App vuelve a foreground - recalcular tiempo
          if (cronometro.activo && cronometroStartTimeRef.current) {
            const ahora = Date.now();
            const tiempoTranscurridoMs = ahora - cronometroStartTimeRef.current;
            const tiempoTranscurridoSeg = Math.floor(tiempoTranscurridoMs / 1000);
            const tiempoTotalTranscurrido = (cronometro.tiempoTotal - cronometro.tiempoRestante) + tiempoTranscurridoSeg;
            const nuevoTiempoRestante = Math.max(0, cronometro.tiempoTotal - tiempoTotalTranscurrido);
            
            setCronometro(prev => ({
              ...prev,
              tiempoRestante: nuevoTiempoRestante
            }));
            
            // Actualizar tiempo de inicio para seguir contando
            cronometroStartTimeRef.current = ahora;
          }
        }
      };

      App.addListener('appStateChange', handleAppStateChange);
      
      return () => {
        App.removeAllListeners();
      };
    }
  }, [cronometro.activo, cronometro.tiempoRestante, cronometro.tiempoTotal, cronometro.alertasMostradas, sesionActiva, database]);

  // ============ CRONÓMETRO ============
  
  const iniciarCronometro = useCallback(() => {
    if (cronometroIntervalRef.current) return;
    
    cronometroStartTimeRef.current = Date.now();
    
    setCronometro(prev => ({ ...prev, activo: true }));
    
    cronometroIntervalRef.current = setInterval(() => {
      setCronometro(prev => {
        const nuevoTiempo = prev.tiempoRestante - 1;
        
        // Verificar alertas
        const minutoActual = Math.floor((prev.tiempoTotal - nuevoTiempo) / 60);
        const alerta = ALERTAS_CRONOMETRO.find(a => a.minuto === minutoActual);
        
        if (alerta && !prev.alertasMostradas.includes(minutoActual)) {
          setAlertaActiva(alerta);
          // Vibrar si es nativo
          if (isNative() && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          return {
            ...prev,
            tiempoRestante: nuevoTiempo,
            alertasMostradas: [...prev.alertasMostradas, minutoActual]
          };
        }
        
        if (nuevoTiempo <= 0) {
          if (cronometroIntervalRef.current) {
            clearInterval(cronometroIntervalRef.current);
            cronometroIntervalRef.current = null;
          }
          // Vibrar al finalizar
          if (isNative() && navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
          persistirEstadoCronometro();
          return { ...prev, tiempoRestante: 0, activo: false };
        }
        
        return { ...prev, tiempoRestante: nuevoTiempo };
      });
    }, 1000);
  }, [persistirEstadoCronometro]);

  const pausarCronometro = useCallback(() => {
    if (cronometroIntervalRef.current) {
      clearInterval(cronometroIntervalRef.current);
      cronometroIntervalRef.current = null;
    }
    setCronometro(prev => ({ ...prev, activo: false }));
    persistirEstadoCronometro();
  }, [persistirEstadoCronometro]);

  const resetearCronometro = useCallback(() => {
    if (cronometroIntervalRef.current) {
      clearInterval(cronometroIntervalRef.current);
      cronometroIntervalRef.current = null;
    }
    cronometroStartTimeRef.current = null;
    setCronometro(initialCronometroState);
    setAlertaActiva(null);
    persistirEstadoCronometro();
  }, [persistirEstadoCronometro]);

  const descartarAlerta = useCallback(() => {
    setAlertaActiva(null);
  }, []);

  const formatearTiempo = useCallback((segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ============ ACEPTA WIZARD ============
  
  const iniciarAcepta = useCallback(() => {
    setAceptaEstado(initialAceptaState);
    setAceptaActivo(true);
  }, []);

  const cancelarAcepta = useCallback(() => {
    setAceptaActivo(false);
    setAceptaEstado(initialAceptaState);
  }, []);

  const avanzarPasoAcepta = useCallback(() => {
    setAceptaEstado(prev => ({ ...prev, pasoActual: Math.min(prev.pasoActual + 1, 5) }));
  }, []);

  const retrocederPasoAcepta = useCallback(() => {
    setAceptaEstado(prev => ({ ...prev, pasoActual: Math.max(prev.pasoActual - 1, 0) }));
  }, []);

  const setEmocionAcepta = useCallback((emocion: string, descripcion: string) => {
    setAceptaEstado(prev => ({ ...prev, emocion, descripcionEmocion: descripcion }));
  }, []);

  const setPilarAcepta = useCallback((pilar: PilarCodigo, puntuacion: number) => {
    // Generar pregunta basada en el pilar
    const preguntasPorPilar: Record<PilarCodigo, string[]> = {
      'COH': [
        '¿Qué contradicción detectas entre lo que dices y lo que haces en esta situación?',
        'Si alguien observara solo tus acciones, ¿qué conclusión sacaría sobre tus valores?'
      ],
      'AUT': [
        '¿Qué necesitarías sentir para estar bien independientemente del resultado?',
        '¿De qué recurso interno podrías nutrirte en este momento?'
      ],
      'REC': [
        '¿Has estado invirtiendo más de lo que recibes? ¿Cómo lo sabes?',
        '¿Qué señal de interés genuino has ignorado o minimizado?'
      ],
      'LOG': [
        '¿Esta decisión te acerca o te aleja de tu propósito a largo plazo?',
        '¿Qué criterio objetivo estás usando para evaluar esta situación?'
      ]
    };
    const preguntas = preguntasPorPilar[pilar];
    const preguntaGenerada = preguntas[Math.floor(Math.random() * preguntas.length)];
    
    setAceptaEstado(prev => ({ 
      ...prev, 
      pilarSeleccionado: pilar, 
      puntuacionPilar: puntuacion,
      preguntaGenerada
    }));
  }, []);

  const setInversionAcepta = useCallback((porcentaje: number) => {
    setAceptaEstado(prev => ({ ...prev, inversionPorcentaje: porcentaje }));
  }, []);

  const setDecisionAcepta = useCallback((decision: DecisionACEPTA) => {
    setAceptaEstado(prev => ({ ...prev, decision }));
  }, []);

  const setAjusteAcepta = useCallback((ajuste: string) => {
    setAceptaEstado(prev => ({ ...prev, ajuste }));
  }, []);

  const completarAcepta = useCallback(() => {
    setAceptaActivo(false);
    return { ...aceptaEstado, completado: true };
  }, [aceptaEstado]);

  // ============ SESIONES ============
  
  const iniciarSesion = useCallback((alumnoCodigo: string) => {
    const nuevaSesion: Partial<SesionDictada> = {
      alumno_codigo: alumnoCodigo,
      fecha_hora_inicio: new Date().toISOString(),
      estado_sesion: 'completada',
      acepta_aplicado: false,
      alerta_etica: false,
      derivacion_realizada: false
    };
    setSesionActiva(nuevaSesion as SesionDictada);
    cronometroStartTimeRef.current = Date.now();
    iniciarCronometro();
  }, [iniciarCronometro]);

  const finalizarSesion = useCallback(() => {
    pausarCronometro();
    setSesionActiva(prev => prev ? {
      ...prev,
      fecha_hora_fin: new Date().toISOString()
    } : null);
    persistirEstadoCronometro();
  }, [pausarCronometro, persistirEstadoCronometro]);

  // ============ INSTRUCTOR ============
  
  const cargarInstructor = useCallback((instructorData: InstructorPerfil) => {
    setInstructor(instructorData);
  }, []);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (cronometroIntervalRef.current) {
        clearInterval(cronometroIntervalRef.current);
      }
      persistirEstadoCronometro();
    };
  }, [persistirEstadoCronometro]);

  return {
    // Estado general
    tabActiva,
    setTabActiva,
    instructor,
    sesionActiva,
    offline,
    setOffline,
    
    // Cronómetro
    cronometro,
    iniciarCronometro,
    pausarCronometro,
    resetearCronometro,
    formatearTiempo,
    alertaActiva,
    descartarAlerta,
    
    // ACEPTA
    aceptaEstado,
    aceptaActivo,
    iniciarAcepta,
    cancelarAcepta,
    avanzarPasoAcepta,
    retrocederPasoAcepta,
    setEmocionAcepta,
    setPilarAcepta,
    setInversionAcepta,
    setDecisionAcepta,
    setAjusteAcepta,
    completarAcepta,
    
    // Sesiones
    iniciarSesion,
    finalizarSesion,
    cargarInstructor,
    
    // Utilidades
    persistirEstadoCronometro
  };
}

export default useAppState;
