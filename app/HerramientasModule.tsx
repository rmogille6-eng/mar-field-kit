import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  Users, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Play,
  BarChart3
} from 'lucide-react';
import type { RolePlay } from '@/types/mar';
import { PILARES_MAR, type PilarCodigo } from '@/types/mar';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HerramientasModuleProps {
  database: any;
}

export function HerramientasModule({ database }: HerramientasModuleProps) {
  const { query, isReady } = database;
  const [rolePlays, setRolePlays] = useState<RolePlay[]>([]);
  const [evaluacion, setEvaluacion] = useState<Record<PilarCodigo, number>>({
    COH: 3,
    AUT: 3,
    REC: 3,
    LOG: 3
  });
  const [historialMAR, setHistorialMAR] = useState<any[]>([]);
  const [rolePlayActivo, setRolePlayActivo] = useState<RolePlay | null>(null);
  const [diasCompletados, setDiasCompletados] = useState<number[]>([]);

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      if (isReady) {
        const rolePlaysData: RolePlay[] = await query('SELECT * FROM role_plays ORDER BY id');
        setRolePlays(rolePlaysData);

        // Generar datos de ejemplo para el historial
        const datosHistorial = Array.from({ length: 7 }, (_, i) => ({
          dia: `D${i + 1}`,
          mar: 16 + Math.floor(Math.random() * 4) - 2,
          coherencia: 3 + Math.floor(Math.random() * 3) - 1,
          autonomia: 4 + Math.floor(Math.random() * 2) - 1,
          reciprocidad: 3 + Math.floor(Math.random() * 3) - 1,
          logica: 4 + Math.floor(Math.random() * 2) - 1,
        }));
        setHistorialMAR(datosHistorial);
      }
    };
    
    cargarDatos();
  }, [isReady, query]);

  const calcularMAR = () => {
    const total = Object.values(evaluacion).reduce((a, b) => a + b, 0);
    return total;
  };

  const getEstadoMAR = (total: number) => {
    if (total >= 17) return { color: 'green', mensaje: 'ESTABLE', bg: 'bg-green-50', text: 'text-green-700' };
    if (total >= 12) return { color: 'amber', mensaje: 'FRICCIÓN DETECTABLE', bg: 'bg-amber-50', text: 'text-amber-700' };
    return { color: 'red', mensaje: 'NO INTERACTUAR', bg: 'bg-red-50', text: 'text-red-700' };
  };

  const getPilarPrioritario = (): PilarCodigo => {
    let minValor = 6;
    let pilarMin: PilarCodigo = 'COH';
    (Object.entries(evaluacion) as [PilarCodigo, number][]).forEach(([codigo, valor]) => {
      if (valor < minValor) {
        minValor = valor;
        pilarMin = codigo;
      }
    });
    return pilarMin;
  };

  const handleCambiarEvaluacion = (pilar: PilarCodigo, valor: number[]) => {
    setEvaluacion(prev => ({ ...prev, [pilar]: valor[0] }));
  };

  const handleGuardarEvaluacion = () => {
    const total = calcularMAR();
    const estado = getEstadoMAR(total);
    toast.success(`MAR guardado: ${total}/20`, { 
      description: estado.mensaje 
    });
  };

  const totalMAR = calcularMAR();
  const estadoMAR = getEstadoMAR(totalMAR);
  const pilarPrioritario = getPilarPrioritario();

  const toggleDia = (dia: number) => {
    setDiasCompletados(prev => {
      if (prev.includes(dia)) {
        return prev.filter(d => d !== dia);
      }
      return [...prev, dia];
    });
  };

  return (
    <div className="h-full p-4 overflow-auto">
      <Tabs defaultValue="calculadora" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculadora" className="gap-2">
            <Calculator className="w-4 h-4" />
            Calculadora MAR
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard 30 Días
          </TabsTrigger>
          <TabsTrigger value="roleplays" className="gap-2">
            <Users className="w-4 h-4" />
            Role-Plays
          </TabsTrigger>
        </TabsList>

        {/* Calculadora MAR */}
        <TabsContent value="calculadora" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Panel de evaluación */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#C05621]" />
                  Calculadora MAR Oficial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {PILARES_MAR.map((pilar) => (
                    <div key={pilar.codigo} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-[#2D3748]">{pilar.nombre}</h4>
                        <Badge variant="secondary">{pilar.codigo}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{pilar.definicion}</p>
                      <Slider
                        value={[evaluacion[pilar.codigo]]}
                        onValueChange={(v) => handleCambiarEvaluacion(pilar.codigo, v)}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>No opero (1)</span>
                        <span className="font-bold text-[#C05621]">{evaluacion[pilar.codigo]}</span>
                        <span>Consistente (5)</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                  <Button variant="outline">Ver ejercicio {pilarPrioritario}</Button>
                  <Button 
                    onClick={handleGuardarEvaluacion}
                    className="bg-[#C05621] hover:bg-[#A0522D]"
                  >
                    Guardar en Bitácora
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Panel de resultado */}
            <div className="space-y-4">
              <Card className={`${estadoMAR.bg} border-${estadoMAR.color}-200`}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Tu MAR Actual</p>
                    <div className={`text-6xl font-bold ${estadoMAR.text}`}>
                      {totalMAR}<span className="text-2xl text-gray-400">/20</span>
                    </div>
                    <Badge 
                      className={`mt-4 ${estadoMAR.bg} ${estadoMAR.text} border-${estadoMAR.color}-300`}
                    >
                      {estadoMAR.mensaje}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pilar Prioritario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-semibold">
                        {PILARES_MAR.find(p => p.codigo === pilarPrioritario)?.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {evaluacion[pilarPrioritario]}/5 - Necesita atención
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Historial (7 días)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historialMAR}>
                        <Line 
                          type="monotone" 
                          dataKey="mar" 
                          stroke="#C05621" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <XAxis dataKey="dia" hide />
                        <YAxis domain={[10, 20]} hide />
                        <Tooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tendencia: Estable pero {PILARES_MAR.find(p => p.codigo === pilarPrioritario)?.nombre.toLowerCase()} baja crónica
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Dashboard 30 Días */}
        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C05621]" />
                Dashboard de 30 Días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2 mb-6">
                {Array.from({ length: 30 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDia(i + 1)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      diasCompletados.includes(i + 1)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {diasCompletados.includes(i + 1) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      i + 1
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-600">Días completados</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {diasCompletados.length}/30
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-600">Pilar más trabajado</p>
                    <p className="text-2xl font-bold text-green-800">
                      Autonomía
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-600">Tasa de coherencia</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {Math.round((diasCompletados.length / 30) * 100)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-purple-600">Sesiones dictadas</p>
                    <p className="text-2xl font-bold text-purple-800">
                      12
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role-Plays */}
        <TabsContent value="roleplays" className="mt-4">
          {rolePlayActivo ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="mb-2">{rolePlayActivo.codigo}</Badge>
                    <CardTitle>{rolePlayActivo.titulo}</CardTitle>
                  </div>
                  <Button variant="outline" onClick={() => setRolePlayActivo(null)}>
                    Cerrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Setup</h4>
                  <p className="text-gray-600">{rolePlayActivo.setup}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Perfil TPI Objetivo</h4>
                  <Badge>{rolePlayActivo.perfil_tpi_objetivo}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Script de Apertura</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#C05621]">
                    <p className="italic text-gray-700">"{rolePlayActivo.script_apertura}"</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Métricas de Éxito</h4>
                  <ul className="space-y-2">
                    {JSON.parse(rolePlayActivo.metricas_exito).map((metrica: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {metrica}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-400">
                    Referencia: {rolePlayActivo.libro_referencia}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {rolePlays.map((rp) => (
                <Card key={rp.id} className="hover:border-[#C05621] transition-colors cursor-pointer"
                  onClick={() => setRolePlayActivo(rp)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{rp.codigo}</Badge>
                      <Badge>{rp.perfil_tpi_objetivo}</Badge>
                    </div>
                    <CardTitle className="text-lg">{rp.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{rp.setup}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-[#C05621]">
                      <Play className="w-4 h-4" />
                      Iniciar simulación
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HerramientasModule;
