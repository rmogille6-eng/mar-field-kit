import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { PILARES_MAR, EMOCIONES_ACEPTA, type PilarCodigo, type DecisionACEPTA } from '@/types/mar';
import { toast } from 'sonner';

interface AceptaWizardProps {
  appState: any;
}

export function AceptaWizard({ appState }: AceptaWizardProps) {
  const {
    aceptaEstado,
    cancelarAcepta,
    avanzarPasoAcepta,
    retrocederPasoAcepta,
    setEmocionAcepta,
    setPilarAcepta,
    setInversionAcepta,
    setDecisionAcepta,
    setAjusteAcepta,
    completarAcepta,
    cronometro,
    formatearTiempo
  } = appState;

  const [emocionSeleccionada, setEmocionSeleccionada] = useState('');
  const [descripcionEmocion, setDescripcionEmocion] = useState('');
  const [pilarExpandido, setPilarExpandido] = useState<PilarCodigo | null>(null);
  const [puntuacionPilar, setPuntuacionPilar] = useState(3);
  const [contextoSituacion, setContextoSituacion] = useState('');
  const [ajusteEspecifico, setAjusteEspecifico] = useState('');

  const pasos = ['Aceptar', 'Contextualizar', 'Evaluar', 'Preguntar', 'Tomar', 'Ajustar'];
  const progreso = ((aceptaEstado.pasoActual + 1) / 6) * 100;

  const handleSiguiente = () => {
    // Validar paso actual
    switch (aceptaEstado.pasoActual) {
      case 0: // Aceptar
        if (!emocionSeleccionada) {
          toast.error('Selecciona una emoción');
          return;
        }
        setEmocionAcepta(emocionSeleccionada, descripcionEmocion);
        break;
      case 1: // Contextualizar
        if (!aceptaEstado.pilarSeleccionado) {
          toast.error('Selecciona un pilar MAR');
          return;
        }
        break;
      case 2: // Evaluar
        // Slider ya actualiza el estado
        break;
      case 3: // Preguntar
        // La pregunta se generó automáticamente
        break;
      case 4: // Tomar
        if (!aceptaEstado.decision) {
          toast.error('Selecciona una decisión');
          return;
        }
        break;
      case 5: // Ajustar
        if (!ajusteEspecifico.trim()) {
          toast.error('Escribe un ajuste específico');
          return;
        }
        setAjusteAcepta(ajusteEspecifico);
        completarAcepta();
        toast.success('Protocolo ACEPTA completado', { 
          description: 'Guardado en bitácora' 
        });
        return;
    }
    avanzarPasoAcepta();
  };

  const handleSeleccionarPilar = (pilar: PilarCodigo) => {
    setPilarAcepta(pilar, puntuacionPilar);
  };

  const handleCambiarPuntuacion = (valor: number[]) => {
    setPuntuacionPilar(valor[0]);
    if (aceptaEstado.pilarSeleccionado) {
      setPilarAcepta(aceptaEstado.pilarSeleccionado, valor[0]);
    }
  };

  const handleCambiarInversion = (valor: number[]) => {
    setInversionAcepta(valor[0]);
  };

  const handleSeleccionarDecision = (decision: DecisionACEPTA) => {
    setDecisionAcepta(decision);
  };

  const renderPaso = () => {
    switch (aceptaEstado.pasoActual) {
      case 0: // A - Aceptar
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">
                ¿Qué emoción está presente ahora?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona la emoción predominante que detectas en ti o en el alumno
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {EMOCIONES_ACEPTA.map((emocion) => (
                <button
                  key={emocion}
                  onClick={() => setEmocionSeleccionada(emocion)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emocionSeleccionada === emocion
                      ? 'border-[#C05621] bg-[#C05621]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{emocion}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué ocurrió específicamente? (máx. 280 caracteres)
              </label>
              <Textarea
                value={descripcionEmocion}
                onChange={(e) => setDescripcionEmocion(e.target.value.slice(0, 280))}
                placeholder="Describe la situación que generó esta emoción..."
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {descripcionEmocion.length}/280
              </p>
            </div>
          </div>
        );

      case 1: // C - Contextualizar
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">
                ¿En qué pilar MAR estás operando?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona el pilar más relevante para esta situación
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {PILARES_MAR.map((pilar) => (
                <div key={pilar.codigo} className="space-y-2">
                  <button
                    onClick={() => handleSeleccionarPilar(pilar.codigo)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      aceptaEstado.pilarSeleccionado === pilar.codigo
                        ? 'border-[#C05621] bg-[#C05621]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">{pilar.nombre}</span>
                      <Badge variant="secondary">{pilar.codigo}</Badge>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setPilarExpandido(pilarExpandido === pilar.codigo ? null : pilar.codigo)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-[#C05621]"
                  >
                    {pilarExpandido === pilar.codigo ? (
                      <><ChevronUp className="w-3 h-3" /> Ocultar definición</>
                    ) : (
                      <><ChevronDown className="w-3 h-3" /> Ver definición</>
                    )}
                  </button>
                  
                  {pilarExpandido === pilar.codigo && (
                    <div className="bg-gray-50 p-3 rounded-lg text-sm border-l-4 border-[#C05621]">
                      <p className="italic">"{pilar.definicion}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {aceptaEstado.pilarSeleccionado && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  ¿Cómo evalúas tu operación en este pilar? (1-5)
                </label>
                <Slider
                  value={[puntuacionPilar]}
                  onValueChange={handleCambiarPuntuacion}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-amber-600 mt-1">
                  <span>No opero</span>
                  <span className="font-bold text-lg">{puntuacionPilar}</span>
                  <span>Opero consistentemente</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contexto de la situación
              </label>
              <Textarea
                value={contextoSituacion}
                onChange={(e) => setContextoSituacion(e.target.value)}
                placeholder="Describe el contexto específico..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        );

      case 2: // E - Evaluar
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">
                Evalúa la inversión
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Qué porcentaje de tu inversión emocional has recibido de vuelta?
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-[#C05621]">
                  {aceptaEstado.inversionPorcentaje}%
                </span>
              </div>
              <Slider
                value={[aceptaEstado.inversionPorcentaje]}
                onValueChange={handleCambiarInversion}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0% (Nada recibido)</span>
                <span>100% (Equilibrado)</span>
              </div>
            </div>

            {aceptaEstado.inversionPorcentaje > 70 && (
              <Alert className="bg-red-50 border-red-300">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Alerta:</strong> Violación detectada de la Ley de Inversión. 
                  Estás invirtiendo significativamente más de lo que recibes.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Ley de Inversión</h4>
              <p className="text-sm text-blue-700">
                "La inversión emocional debe ser proporcional a la respuesta. 
                Desequilibrio genera incomodidad o desinterés."
              </p>
              <p className="text-sm text-blue-600 mt-2">
                <strong>Antídoto:</strong> Cuéntame tu perspectiva antes de seguir.
              </p>
            </div>
          </div>
        );

      case 3: // P - Preguntar
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">
                Pregunta generada automáticamente
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Basada en el pilar {aceptaEstado.pilarSeleccionado} seleccionado
              </p>
            </div>

            {aceptaEstado.preguntaGenerada && (
              <div className="bg-[#C05621]/10 p-6 rounded-lg border-2 border-[#C05621]/30">
                <p className="text-lg text-[#2D3748] italic leading-relaxed">
                  "{aceptaEstado.preguntaGenerada}"
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (aceptaEstado.preguntaGenerada) {
                    navigator.clipboard.writeText(aceptaEstado.preguntaGenerada);
                    toast.success('Pregunta copiada');
                  }
                }}
              >
                Copiar al portapapeles
              </Button>
              <Button variant="outline">
                Generar otra pregunta
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Consejo de aplicación</h4>
              <p className="text-sm text-gray-600">
                Esta pregunta está diseñada para crear pausa y reflexión. 
                No busques respuesta inmediata. El silencio después de la pregunta 
                es tan importante como la pregunta misma.
              </p>
            </div>
          </div>
        );

      case 4: // T - Tomar Decisión
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">
                ¿Qué decisión tomas?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona la acción más apropiada para esta situación
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'cese', label: 'Cese', desc: 'Detener toda interacción', color: 'red' },
                { key: 'reduccion', label: 'Reducción', desc: 'Disminuir inversión', color: 'amber' },
                { key: 'reentrada', label: 'Reentrada', desc: 'Volver a contactar', color: 'blue' },
                { key: 'continuar', label: 'Continuar', desc: 'Mantener curso', color: 'green' }
              ].map((opcion) => (
                <button
                  key={opcion.key}
                  onClick={() => handleSeleccionarDecision(opcion.key as DecisionACEPTA)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    aceptaEstado.decision === opcion.key
                      ? `border-${opcion.color}-500 bg-${opcion.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-lg">{opcion.label}</div>
                  <div className="text-sm text-gray-500">{opcion.desc}</div>
                </button>
              ))}
            </div>

            {aceptaEstado.decision === 'cese' && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Protocolo de Cese</h4>
                <p className="text-sm text-red-700">
                  Recuerda aplicar las 3 fases: Cese inmediato → Señal de Propósito (24-72h) → Reentrada (5-7 días)
                </p>
              </div>
            )}
          </div>
        );

      case 5: // A - Ajustar
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2">
                Define el ajuste específico
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Qué harás diferente la próxima vez?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script específico para la próxima vez
              </label>
              <Textarea
                value={ajusteEspecifico}
                onChange={(e) => setAjusteEspecifico(e.target.value)}
                placeholder="Escribe exactamente qué harás diferente..."
                className="resize-none"
                rows={4}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Resumen del protocolo ACEPTA</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Emoción:</strong> {aceptaEstado.emocion || '-'}</p>
                <p><strong>Pilar:</strong> {aceptaEstado.pilarSeleccionado || '-'}</p>
                <p><strong>Inversión:</strong> {aceptaEstado.inversionPorcentaje}%</p>
                <p><strong>Decisión:</strong> {aceptaEstado.decision || '-'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={cancelarAcepta} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver a Sesión
        </Button>
        <div className="text-sm text-gray-500">
          Paso {aceptaEstado.pasoActual + 1} de 6
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center justify-between mb-6">
        {pasos.map((paso, index) => (
          <div key={paso} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              index < aceptaEstado.pasoActual 
                ? 'bg-green-500 text-white'
                : index === aceptaEstado.pasoActual
                ? 'bg-[#C05621] text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {index < aceptaEstado.pasoActual ? (
                <Check className="w-5 h-5" />
              ) : (
                paso[0]
              )}
            </div>
            {index < 5 && (
              <div className={`w-12 h-1 mx-1 ${
                index < aceptaEstado.pasoActual ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Progress value={progreso} className="mb-6" />

      {/* Contenido del paso */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-xl">
            {pasos[aceptaEstado.pasoActual]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderPaso()}
        </CardContent>
      </Card>

      {/* Footer con navegación */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={retrocederPasoAcepta}
          disabled={aceptaEstado.pasoActual === 0}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>
        
        <div className="text-sm text-gray-500">
          Tiempo sesión: {formatearTiempo(cronometro.tiempoTotal - cronometro.tiempoRestante)}
        </div>
        
        <Button
          onClick={handleSiguiente}
          className="bg-[#C05621] hover:bg-[#A0522D] gap-2"
        >
          {aceptaEstado.pasoActual === 5 ? 'Completar' : 'Siguiente'}
          {aceptaEstado.pasoActual < 5 && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

export default AceptaWizard;
