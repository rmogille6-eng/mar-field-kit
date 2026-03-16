import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Moon, 
  Calendar, 
  TrendingUp, 
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Target
} from 'lucide-react';
import type { SesionDictada, EfectoLunaFicha, MarEvaluacionDiaria } from '@/types/mar';
import { PILARES_MAR, type PilarCodigo } from '@/types/mar';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BitacoraModuleProps {
  database: any;
}

export function BitacoraModule({ database }: BitacoraModuleProps) {
  const { query, isReady } = database;
  
  const [sesiones, setSesiones] = useState<SesionDictada[]>([]);
  const [lunas, setLunas] = useState<EfectoLunaFicha[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<MarEvaluacionDiaria[]>([]);
  
  // Formulario MAR diario
  const [marDiario, setMarDiario] = useState<Record<PilarCodigo, number>>({
    COH: 4,
    AUT: 4,
    REC: 4,
    LOG: 4
  });
  const [contextoEmocional, setContextoEmocional] = useState('');
  
  // Formulario Efecto Luna
  const [lunaForm, setLunaForm] = useState({
    impactoDescripcion: '',
    impactoEmocion: '',
    impactoIntensidad: 5,
    tipo: 'romantico' as const
  });

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      if (isReady) {
        const sesionesData: SesionDictada[] = await query(
          'SELECT * FROM sesiones_dictadas ORDER BY fecha_hora_inicio DESC LIMIT 10'
        );
        const lunasData: EfectoLunaFicha[] = await query(
          'SELECT * FROM efecto_luna_fichas ORDER BY fecha_evento DESC LIMIT 10'
        );
        const evaluacionesData: MarEvaluacionDiaria[] = await query(
          'SELECT * FROM mar_evaluaciones_diarias ORDER BY fecha DESC LIMIT 7'
        );
        
        setSesiones(sesionesData);
        setLunas(lunasData);
        setEvaluaciones(evaluacionesData);
      }
    };
    
    cargarDatos();
  }, [isReady, query]);

  const handleGuardarMAR = () => {
    const total = Object.values(marDiario).reduce((a, b) => a + b, 0);
    toast.success(`MAR diario guardado: ${total}/20`);
  };

  const handleGuardarLuna = () => {
    toast.success('Efecto Luna registrado');
  };

  const datosGrafico = evaluaciones.map(e => ({
    fecha: e.fecha.slice(5),
    total: e.total_mar,
    coherencia: e.coherencia,
    autonomia: e.autonomia,
    reciprocidad: e.reciprocidad,
    logica: e.logica
  })).reverse();

  return (
    <div className="h-full p-4 overflow-auto">
      <Tabs defaultValue="mar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mar" className="gap-2">
            <Target className="w-4 h-4" />
            Mi MAR Diario
          </TabsTrigger>
          <TabsTrigger value="luna" className="gap-2">
            <Moon className="w-4 h-4" />
            Mis Efectos Luna
          </TabsTrigger>
          <TabsTrigger value="sesiones" className="gap-2">
            <Calendar className="w-4 h-4" />
            Sesiones Dictadas
          </TabsTrigger>
          <TabsTrigger value="evolucion" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Evolución
          </TabsTrigger>
        </TabsList>

        {/* Mi MAR Diario */}
        <TabsContent value="mar" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#C05621]" />
                  Evaluación MAR de Hoy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PILARES_MAR.map((pilar) => (
                  <div key={pilar.codigo} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pilar.nombre}</span>
                      <span className="text-2xl font-bold text-[#C05621]">
                        {marDiario[pilar.codigo]}
                      </span>
                    </div>
                    <Slider
                      value={[marDiario[pilar.codigo]]}
                      onValueChange={(v) => setMarDiario(prev => ({ 
                        ...prev, 
                        [pilar.codigo]: v[0] 
                      }))}
                      min={1}
                      max={5}
                      step={1}
                    />
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contexto emocional
                  </label>
                  <Textarea
                    value={contextoEmocional}
                    onChange={(e) => setContextoEmocional(e.target.value)}
                    placeholder="¿Cómo te sientes hoy? ¿Qué influyó en tu evaluación?"
                    className="resize-none"
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleGuardarMAR}
                  className="w-full bg-[#C05621] hover:bg-[#A0522D]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar en Bitácora
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-green-600 mb-2">Tu MAR Hoy</p>
                    <div className="text-5xl font-bold text-green-700">
                      {Object.values(marDiario).reduce((a, b) => a + b, 0)}
                      <span className="text-2xl text-green-500">/20</span>
                    </div>
                    <Badge className="mt-4 bg-green-100 text-green-700">
                      OPERATIVO
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Últimas evaluaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {evaluaciones.slice(0, 5).map((eval_) => (
                      <div 
                        key={eval_.id} 
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{eval_.fecha}</span>
                        <Badge variant={eval_.total_mar >= 16 ? 'default' : 'secondary'}>
                          {eval_.total_mar}/20
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Efectos Luna */}
        <TabsContent value="luna" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-[#C05621]" />
                  Nueva Ficha Efecto Luna
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de evento
                  </label>
                  <div className="flex gap-2">
                    {['romantico', 'profesional', 'social'].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setLunaForm(prev => ({ ...prev, tipo: tipo as any }))}
                        className={`px-4 py-2 rounded-lg border-2 capitalize ${
                          lunaForm.tipo === tipo
                            ? 'border-[#C05621] bg-[#C05621]/10'
                            : 'border-gray-200'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Qué ocurrió? (Fase Impacto)
                  </label>
                  <Textarea
                    value={lunaForm.impactoDescripcion}
                    onChange={(e) => setLunaForm(prev => ({ 
                      ...prev, 
                      impactoDescripcion: e.target.value 
                    }))}
                    placeholder="Describe el evento objetivamente..."
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoción principal
                  </label>
                  <Input
                    value={lunaForm.impactoEmocion}
                    onChange={(e) => setLunaForm(prev => ({ 
                      ...prev, 
                      impactoEmocion: e.target.value 
                    }))}
                    placeholder="Ej: Vergüenza, Ira, Tristeza..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intensidad (1-10)
                  </label>
                  <Slider
                    value={[lunaForm.impactoIntensidad]}
                    onValueChange={(v) => setLunaForm(prev => ({ 
                      ...prev, 
                      impactoIntensidad: v[0] 
                    }))}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="text-center text-lg font-bold text-[#C05621] mt-1">
                    {lunaForm.impactoIntensidad}
                  </div>
                </div>

                <Button 
                  onClick={handleGuardarLuna}
                  className="w-full bg-[#C05621] hover:bg-[#A0522D]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Ficha
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efectos Luna Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lunas.filter(l => !l.ciclo_completado).length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay efectos luna pendientes</p>
                    </div>
                  ) : (
                    lunas.filter(l => !l.ciclo_completado).map((luna) => (
                      <div 
                        key={luna.id} 
                        className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge>{luna.tipo}</Badge>
                          <span className="text-sm text-gray-500">{luna.fecha_evento}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {luna.impacto_descripcion}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            Fase: Impacto → Reflexión
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sesiones Dictadas */}
        <TabsContent value="sesiones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C05621]" />
                Historial de Sesiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sesiones.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay sesiones registradas aún</p>
                  </div>
                ) : (
                  sesiones.map((sesion) => (
                    <div 
                      key={sesion.id} 
                      className="p-4 border rounded-lg hover:border-[#C05621] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{sesion.alumno_codigo}</span>
                        </div>
                        <Badge variant={sesion.estado_sesion === 'completada' ? 'default' : 'secondary'}>
                          {sesion.estado_sesion}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(sesion.fecha_hora_inicio).toLocaleDateString()}</span>
                        {sesion.mar_alumno_pre && (
                          <span>MAR: {sesion.mar_alumno_pre}/20</span>
                        )}
                        {sesion.pilar_trabajado && (
                          <span>Pilar: {sesion.pilar_trabajado}</span>
                        )}
                        {sesion.perfil_tpi_detectado && (
                          <span>TPI: {sesion.perfil_tpi_detectado}</span>
                        )}
                      </div>
                      {sesion.acepta_aplicado && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            ACEPTA aplicado
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolución */}
        <TabsContent value="evolucion" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#C05621]" />
                Evolución de tu MAR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="coherencia" 
                      stroke="#3182CE" 
                      name="Coherencia"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="autonomia" 
                      stroke="#38A169" 
                      name="Autonomía"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reciprocidad" 
                      stroke="#D69E2E" 
                      name="Reciprocidad"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="logica" 
                      stroke="#805AD5" 
                      name="Lógica"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">Coherencia</p>
                </div>
                <div className="text-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">Autonomía</p>
                </div>
                <div className="text-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">Reciprocidad</p>
                </div>
                <div className="text-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">Lógica</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BitacoraModule;
