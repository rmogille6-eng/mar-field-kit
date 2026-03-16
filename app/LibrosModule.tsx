import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Bookmark,
  Mic,
  Copy,
  CheckCircle2,
  FileText
} from 'lucide-react';
import type { Libro, Capitulo } from '@/types/mar';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface LibroConCapitulos extends Libro {
  capitulos: Capitulo[];
  expandido: boolean;
}

interface LibrosModuleProps {
  database: any;
}

export function LibrosModule({ database }: LibrosModuleProps) {
  const { query, isReady } = database;
  const [libros, setLibros] = useState<LibroConCapitulos[]>([]);
  const [libroSeleccionado, setLibroSeleccionado] = useState<LibroConCapitulos | null>(null);
  const [capituloActivo, setCapituloActivo] = useState<Capitulo | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

  // Cargar libros y capítulos
  useEffect(() => {
    const cargarDatos = async () => {
      if (isReady) {
        const librosData: Libro[] = await query('SELECT * FROM libros ORDER BY orden');
        const capitulosData: Capitulo[] = await query('SELECT * FROM capitulos ORDER BY libro_id, id');
        
        const librosConCaps: LibroConCapitulos[] = librosData.map((libro: Libro) => ({
          ...libro,
          capitulos: capitulosData.filter((c: Capitulo) => c.libro_id === libro.id),
          expandido: libro.orden === 1 // Expandir el primer libro por defecto
        }));
        
        setLibros(librosConCaps);
        
        // Seleccionar primer libro y capítulo por defecto
        if (librosConCaps.length > 0) {
          setLibroSeleccionado(librosConCaps[0]);
          if (librosConCaps[0].capitulos.length > 0) {
            setCapituloActivo(librosConCaps[0].capitulos[0]);
          }
        }
      }
    };
    
    cargarDatos();
  }, [isReady, query]);

  const toggleLibro = (libroId: number) => {
    setLibros(prev => prev.map(l => 
      l.id === libroId ? { ...l, expandido: !l.expandido } : l
    ));
  };

  const seleccionarCapitulo = (libro: LibroConCapitulos, capitulo: Capitulo) => {
    setLibroSeleccionado(libro);
    setCapituloActivo(capitulo);
  };

  const handleCopiarContenido = () => {
    if (capituloActivo) {
      navigator.clipboard.writeText(capituloActivo.contenido_markdown);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      toast.success('Contenido copiado');
    }
  };

  const toggleFavorito = (capituloId: number) => {
    setFavoritos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(capituloId)) {
        nuevo.delete(capituloId);
        toast.info('Eliminado de favoritos');
      } else {
        nuevo.add(capituloId);
        toast.success('Agregado a favoritos');
      }
      return nuevo;
    });
  };

  const filtrarCapitulos = (capitulos: Capitulo[]) => {
    if (!busqueda.trim()) return capitulos;
    return capitulos.filter(c => 
      c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.contenido_markdown.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  return (
    <div className="h-full flex">
      {/* Panel izquierdo - Navegador */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        {/* Buscador */}
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar en MAR..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Badge variant="outline" className="text-xs">Modo Offline</Badge>
            <span>6 Libros | 20+ Capítulos</span>
          </div>
        </div>

        {/* Árbol de navegación */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {libros.map((libro) => (
              <div key={libro.id} className="mb-1">
                <button
                  onClick={() => toggleLibro(libro.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                    libroSeleccionado?.id === libro.id 
                      ? 'bg-[#C05621]/10 text-[#C05621]' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {libro.expandido ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium text-sm">{libro.titulo}</span>
                </button>
                
                {libro.expandido && (
                  <div className="ml-6 mt-1 space-y-1">
                    {filtrarCapitulos(libro.capitulos).map((capitulo) => (
                      <button
                        key={capitulo.id}
                        onClick={() => seleccionarCapitulo(libro, capitulo)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                          capituloActivo?.id === capitulo.id
                            ? 'bg-[#C05621] text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{capitulo.numero}: {capitulo.titulo}</span>
                        {favoritos.has(capitulo.id) && (
                          <Bookmark className="w-3 h-3 ml-auto fill-current" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Panel derecho - Contenido */}
      <div className="flex-1 flex flex-col bg-white">
        {capituloActivo ? (
          <>
            {/* Header del contenido */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span>{libroSeleccionado?.titulo}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{capituloActivo.numero}</span>
                </div>
                <h2 className="text-xl font-bold text-[#2D3748]">{capituloActivo.titulo}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorito(capituloActivo.id)}
                >
                  <Bookmark className={`w-4 h-4 ${favoritos.has(capituloActivo.id) ? 'fill-[#C05621] text-[#C05621]' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopiarContenido}
                >
                  {copiado ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contenido */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto prose prose-slate">
                <ReactMarkdown>{capituloActivo.contenido_markdown}</ReactMarkdown>
              </div>
              
              {/* Referencia del libro */}
              <div className="mt-8 pt-4 border-t text-sm text-gray-400">
                Referencia: {capituloActivo.referencia_libro}
              </div>
            </ScrollArea>

            {/* Navegación inferior */}
            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" size="sm">
                ← Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente →
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecciona un capítulo para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LibrosModule;
