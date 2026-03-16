import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  User, 
  Target, 
  MessageSquare, 
  AlertTriangle,
  Save,
  ChevronRight,
  Copy,
  CheckCircle2
} from 'lucide-react';
import type { ScriptPregunta, TaxonomiaTPI, InstructorPerfil } from '@/types/mar';
import { AceptaWizard } from './AceptaWizard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SesionModuleProps {
  appState: any;
  database: any;
}

export function SesionModule({ appState, database }: SesionModuleProps) {
  const { 
    cronometro, 
    iniciarCronometro, 
    pausarCronometro, 
    resetearCronometro,
    formatearTiempo,
    alertaActiva,
    descartarAlerta,
    aceptaActivo,
    iniciarAcepta,
    iniciarSesion
  } = appState;
  
  const { query, isReady } = database;
  const [preguntas, setPreguntas] = useState<ScriptPregunta[]>([]);
  const [perfilesTPI, setPerfilesTPI] = useState<TaxonomiaTPI[]>([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<TaxonomiaTPI | null>(null);
  const [instructorData, setInstructorData] = useState<InstructorPerfil | null>(null);
  const [copiada, setCopiada] = useState<number | null>(null);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [alumnoCodigo, setAlumnoCodigo] = useState('');
  const [sesionIniciada, setSesionIniciada] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      if (isReady) {
        const preguntasData: ScriptPregunta[] = await query('SELECT * FROM scripts_6_preguntas ORDER BY numero');
        const tpiData: TaxonomiaTPI[] = await query('SELECT * FROM taxonomia_tpi ORDER BY id');
        const instructorData: InstructorPerfil[] = await query('SELECT * FROM instructor_perfil WHERE activo = 1 LIMIT 1');
        
        setPreguntas(preguntasData);
        setPerfilesTPI(tpiData);
        if (instructorData.length > 0) {
          setInstructorData(instructorData[0]);
        }
      }
    };
    
    cargarDatos();
  }, [isReady, query]);

  const handleIniciarSesion = () => {
    const codigo = alumnoCodigo || `AL-${Date.now().toString().slice(-6)}`;
    setAlumnoCodigo(codigo);
    iniciarSesion(codigo);
    setSesionIniciada(true);
    toast.success('Sesión iniciada', { description: `Alumno: ${codigo}` });
  };

  const handleCopiarPregunta = async (pregunta: ScriptPregunta, index: number) => {
    try {
      await navigator.clipboard.writeText(pregunta.texto_exacto);
      setCopiada(index);
      setTimeout(() => setCopiada(null), 2000);
      toast.success('Pregunta copiada al portapapeles');
    } catch (err) {
      toast.error('Error al copiar');
    }
  };

  const handleSeleccionarPerfil = (perfil: TaxonomiaTPI) => {
    setPerfilSeleccionado(perfil);
    setShowPerfilModal(true);
  };

  const progresoTiempo = ((cronometro.tiempoTotal - cronometro.tiempoRestante) / cronometro.tiempoTotal) * 100;

  // Si el wizard ACEPTA está activo, mostrarlo
  if (aceptaActivo) {
    return <AceptaWizard appState={appState} />;
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto">
      {/* Header con estado del instructor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-[#2D3748]">
              {instructorData?.nombre || 'Instructor'}
            </h2>
            <p className="text-sm text-gray-500">
              Nivel {instructorData?.nivel_certificacion} | MAR: 18/20
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Modo Offline
        </Badge>
      </div>

      {/* Alerta del cronómetro */}
      {alertaActiva && (
        <Alert className="bg-amber-50 border-amber-300 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 font-medium">
            {alertaActiva.mensaje}
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={descartarAlerta}
            className="ml-auto"
          >
            Descartar
          </Button>
        </Alert>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-3 gap-4">
        {/* Cronómetro de Sesión */}
        <Card className="col-span-1 border-2 border-[#C05621]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Cronómetro Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!sesionIniciada ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Código del alumno (opcional)"
                  value={alumnoCodigo}
                  onChange={(e) => setAlumnoCodigo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <Button 
                  onClick={handleIniciarSesion}
                  className="w-full bg-[#C05621] hover:bg-[#A0522D]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className={`text-5xl font-mono font-bold ${
                  cronometro.activo ? 'text-[#C05621]' : 'text-gray-400'
                }`}>
                  {formatearTiempo(cronometro.tiempoRestante)}
                </div>
                <div className="text-sm text-gray-500">
                  / {formatearTiempo(cronometro.tiempoTotal)}
                </div>
                <Progress value={progresoTiempo} className="h-2" />
                <div className="flex gap-2 justify-center">
                  {!cronometro.activo ? (
                    <Button size="sm" onClick={iniciarCronometro} className="bg-[#C05621]">
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={pausarCronometro} variant="outline">
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" onClick={resetearCronometro} variant="outline">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MAR Alumno */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              MAR Alumno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2D3748]">--/20</div>
              <p className="text-sm text-gray-500">Prioridad: --</p>
            </div>
            <Button variant="outline" className="w-full" size="sm">
              Ver Test Completo
            </Button>
          </CardContent>
        </Card>

        {/* TPI Rápido */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4" />
              TPI Rápido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {perfilesTPI.map((perfil) => (
                <button
                  key={perfil.codigo}
                  onClick={() => handleSeleccionarPerfil(perfil)}
                  className="p-3 rounded-lg border-2 border-gray-200 hover:border-[#C05621] hover:bg-[#C05621]/5 transition-all text-center"
                  style={{ borderColor: perfilSeleccionado?.codigo === perfil.codigo ? perfil.color_hex : undefined }}
                >
                  <div className="font-bold text-lg" style={{ color: perfil.color_hex }}>
                    {perfil.codigo}
                  </div>
                  <div className="text-xs text-gray-600">{perfil.nombre_completo}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocolo ACEPTA */}
      <Card className="border-2 border-[#C05621]/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#2D3748]">
            Protocolo ACEPTA (Wizard Rápido)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {['A', 'C', 'E', 'P', 'T', 'A'].map((letra, index) => (
              <div key={letra} className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                  {letra}
                </div>
                {index < 5 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={iniciarAcepta}
              className="bg-[#C05621] hover:bg-[#A0522D]"
            >
              Iniciar ACEPTA
            </Button>
            <Button variant="outline">
              Última sesión: Martín - RP-03
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Las 6 Preguntas Salvadoras */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#2D3748] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#C05621]" />
            Las 6 Preguntas Salvadoras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {preguntas.map((pregunta, index) => (
              <div 
                key={pregunta.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C05621] transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    P{pregunta.numero}
                  </Badge>
                  <button
                    onClick={() => handleCopiarPregunta(pregunta, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiada === index ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-700 line-clamp-3">
                  {pregunta.texto_exacto}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {pregunta.contexto_uso}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Bitácora
        </Button>
        <Button variant="destructive" className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          Protocolo Rojo
        </Button>
      </div>

      {/* Modal de Perfil TPI */}
      <Dialog open={showPerfilModal} onOpenChange={setShowPerfilModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: perfilSeleccionado?.color_hex }}
              >
                {perfilSeleccionado?.codigo}
              </span>
              {perfilSeleccionado?.nombre_completo}
            </DialogTitle>
          </DialogHeader>
          {perfilSeleccionado && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Necesidad Principal</h4>
                <p className="text-sm">{perfilSeleccionado.necesidad_principal}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Script de Apertura</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm italic border-l-4 border-[#C05621]">
                  "{perfilSeleccionado.script_apertura}"
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">Error Típico</h4>
                  <p className="text-sm text-red-600">{perfilSeleccionado.error_conexion}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">Miedo Subyacente</h4>
                  <p className="text-sm">{perfilSeleccionado.miedo_subyacente}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Indicadores</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Contacto visual:</strong> {perfilSeleccionado.indicadores_contacto_visual}</p>
                  <p><strong>Volumen:</strong> {perfilSeleccionado.indicadores_volumen}</p>
                  <p><strong>Ritmo:</strong> {perfilSeleccionado.indicadores_ritmo}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SesionModule;
