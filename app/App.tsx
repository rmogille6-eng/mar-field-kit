import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { 
  Target, 
  BookOpen, 
  Calculator, 
  ClipboardList,
  WifiOff,
  Shield
} from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAppState } from '@/hooks/useAppState';
import { SesionModule } from '@/sections/SesionModule';
import { LibrosModule } from '@/sections/LibrosModule';
import { HerramientasModule } from '@/sections/HerramientasModule';
import { BitacoraModule } from '@/sections/BitacoraModule';
import './App.css';

function App() {
  const database = useDatabase();
  const { isReady, error } = database;
  const appState = useAppState(database);
  const { tabActiva, setTabActiva, offline } = appState;

  // Cargar datos del instructor al inicio
  useEffect(() => {
    if (isReady) {
      console.log('MAR Field Kit - Sistema inicializado');
      console.log('SQLite nativo:', database.isNative ? 'SÍ' : 'NO (modo web)');
    }
  }, [isReady, database.isNative]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error de Inicialización</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#C05621] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#2D3748] mb-2">MAR Field Kit</h2>
          <p className="text-gray-500">Inicializando base de conocimiento...</p>
          <p className="text-xs text-gray-400 mt-2">
            {database.isNative ? 'SQLite nativo' : 'Modo web'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F7FAFC]">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C05621] rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#2D3748]">MAR Field Kit</h1>
            <p className="text-xs text-gray-500">Laboratorio Portátil MAR v1.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {offline && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">I</span>
          </div>
        </div>
      </header>

      {/* Contenido principal con tabs */}
      <Tabs 
        value={tabActiva} 
        onValueChange={(v) => setTabActiva(v as any)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-hidden">
          <TabsContent value="sesion" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <SesionModule appState={appState} database={database} />
          </TabsContent>
          <TabsContent value="libros" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <LibrosModule database={database} />
          </TabsContent>
          <TabsContent value="herramientas" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <HerramientasModule database={database} />
          </TabsContent>
          <TabsContent value="bitacora" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <BitacoraModule database={database} />
          </TabsContent>
        </div>

        {/* Bottom Tab Bar */}
        <TabsList className="w-full h-16 grid grid-cols-4 rounded-none border-t bg-white p-0">
          <TabsTrigger 
            value="sesion" 
            className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-[#C05621]/10 data-[state=active]:text-[#C05621]"
          >
            <Target className="w-5 h-5" />
            <span className="text-xs">Sesión</span>
          </TabsTrigger>
          <TabsTrigger 
            value="libros"
            className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-[#C05621]/10 data-[state=active]:text-[#C05621]"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Libros</span>
          </TabsTrigger>
          <TabsTrigger 
            value="herramientas"
            className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-[#C05621]/10 data-[state=active]:text-[#C05621]"
          >
            <Calculator className="w-5 h-5" />
            <span className="text-xs">Herramientas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="bitacora"
            className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-[#C05621]/10 data-[state=active]:text-[#C05621]"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Bitácora</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default App;
