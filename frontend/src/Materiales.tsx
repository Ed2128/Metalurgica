import { useState, useEffect, useRef } from 'react';
import { PackagePlus, Search, Pencil, Trash2, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx'; // Importamos la librería
import Swal from 'sweetalert2';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export default function Materiales() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Barra');
  const [precioBase, setPrecioBase] = useState('');
  const [tieneIva, setTieneIva] = useState(false);

  // Referencia oculta para abrir el explorador de archivos
  const archivoInputRef = useRef<HTMLInputElement>(null);

 const cargarMateriales = async () => {
    try {
      // 1. Obtenemos el token y limpiamos posibles comillas accidentales
      let token = localStorage.getItem('token') || '';
      token = token.replace(/^"|"$/g, ''); // Quita comillas al inicio y final si las hay

      // Para ver en la consola (F12) si el token realmente está en la variable
      console.log("Intentando enviar Token al servidor:", token.substring(0, 20) + "...");

      const respuesta = await fetch(`${API_URL}/materiales`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setMateriales(datos);
      } else {
        const error = await respuesta.json();
        console.error("El servidor rechazó el token. Motivo:", error);
        setMateriales([]); 
      }
    } catch (error) {
      console.error("Error de conexión al cargar materiales:", error);
      setMateriales([]);
    }
  };

  useEffect(() => { cargarMateriales(); }, []);

  const limpiarFormulario = () => {
    setIdEdicion(null);
    setDescripcion('');
    setUnidadMedida('Barra');
    setPrecioBase('');
    setTieneIva(false);
  };

  const guardarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = idEdicion ? 'PUT' : 'POST';
    // ✅ CORRECTO: Usando comillas invertidas y la variable API_URL
    const url = idEdicion 
      ? `${API_URL}/materiales/${idEdicion}` 
      : `${API_URL}/materiales`;

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json',
          // También le agregamos el replace al token por seguridad, igual que en clientes
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}`
        },
        // Aquí hacemos la "traducción" de nombres:
        // nombre_en_bd: nombre_en_react
        body: JSON.stringify({ 
          descripcion: descripcion,
          unidad_medida: unidadMedida,
          precio_base: Number(precioBase),
          tiene_iva_incluido: tieneIva
        })
      });

      if (respuesta.ok) {
        limpiarFormulario();
        cargarMateriales();
        Swal.fire({
          title: '¡Guardado!',
          text: 'El material se guardó correctamente.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      } else {
        const errorData = await respuesta.json();
        Swal.fire({
          title: 'Error',
          text: errorData.error || 'No se pudo guardar el material.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error('Error al guardar material:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo conectar con el servidor.',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const iniciarEdicion = (mat: any) => {
    setIdEdicion(mat.id);
    setDescripcion(mat.descripcion);
    setUnidadMedida(mat.unidad_medida);
    setPrecioBase(mat.precio_base.toString());
    setTieneIva(mat.tiene_iva_incluido);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

 const eliminarMaterial = async (id: number) => {
    // Reemplazamos el window.confirm por un modal de SweetAlert2
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer y podría afectar el historial si el material está en uso.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // red-500 de Tailwind
      cancelButtonColor: '#6b7280',  // gray-500 de Tailwind
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const respuesta = await fetch(`${API_URL}/materiales/${id}`, {
        method: 'DELETE'
      });

      if (respuesta.ok) {
        cargarMateriales();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El material ha sido borrado del catálogo.',
          icon: 'success',
          confirmButtonColor: '#2563eb' // blue-600
        });
      } else {
        const error = await respuesta.json();
        Swal.fire({
          title: 'Error',
          text: error.error || "No se pudo eliminar el material.",
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

// --- LÓGICA DE EXCEL MATRICIAL (Con lectura por ArrayBuffer) ---
  const procesarExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        // 1. EL CAMBIO CLAVE: Procesamos la memoria cruda en lugar de texto binario
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const datosRaw = XLSX.utils.sheet_to_json<any[]>(hoja, { header: 1 }); 

        const normalizarTexto = (str: string) => 
          String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        let filaEncabezados = -1;
        let colDesc = -1;
        let colPrecio = -1;

        // Escanear de arriba hacia abajo para encontrar la fila real de los títulos
        for (let i = 0; i < datosRaw.length; i++) {
          const fila = datosRaw[i];
          if (!Array.isArray(fila)) continue;

          // Usamos Array.from para rellenar los "huecos" fantasma del Excel
          const filaNormalizada = Array.from(fila).map(celda => celda ? normalizarTexto(celda) : '');

          // Agregamos el chequeo de seguridad (val && val.includes)
          const idxDesc = filaNormalizada.findIndex(val => 
            ['descripcion', 'desc', 'nombre', 'articulo', 'detalle'].some(pc => val && val.includes(pc))
          );
          
          const idxPrecio = filaNormalizada.findIndex(val => 
            ['precio x kg', 'sin descuento', 'importe', 'precio', 'costo'].some(pc => val && val.includes(pc))
          );

          if (idxDesc !== -1 && idxPrecio !== -1) {
            filaEncabezados = i;
            colDesc = idxDesc;
            colPrecio = idxPrecio;
            break; 
          }
        }

        if (filaEncabezados === -1) {
          alert("No se encontró la fila de encabezados. Verifica que existan columnas como 'Descripción' y 'Precio' en algún lugar de la hoja.");
          return;
        }

        const nombreColPrecio = normalizarTexto(String(datosRaw[filaEncabezados][colPrecio] || ''));
        const esPorKg = nombreColPrecio.includes('kg');

        const materialesFormateados = [];
        for (let i = filaEncabezados + 1; i < datosRaw.length; i++) {
          const fila = datosRaw[i];
          if (!Array.isArray(fila) || fila.length === 0) continue;

          const descRaw = fila[colDesc];
          const precioRaw = fila[colPrecio];

          const descripcion = descRaw ? String(descRaw).trim() : '';
          const precioLimpio = String(precioRaw).replace('$', '').replace(',', '.').trim();
          const precio_base = Number(precioLimpio) || 0;

          if (descripcion && descripcion !== 'Sin descripción' && precio_base > 0) {
            materialesFormateados.push({
              descripcion,
              unidad_medida: esPorKg ? 'Kg' : 'Unidad',
              precio_base,
              tiene_iva_incluido: false
            });
          }
        }

        if (materialesFormateados.length === 0) {
          Swal.fire({
            title: 'Formato incorrecto',
            text: 'No se encontró la fila de encabezados. Verifica que existan columnas como "Descripción" y "Precio".',
            icon: 'error',
            confirmButtonColor: '#2563eb'
          });
          return;
        }

        const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/materiales/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(materialesFormateados)
        });

        if (respuesta.ok) {
          const resultado = await respuesta.json();
          Swal.fire({
            title: '¡Importación Exitosa!',
            text: resultado.message,
            icon: 'success',
            confirmButtonColor: '#2563eb'
          });
          cargarMateriales(); 
        } else {
          Swal.fire({
            title: 'Error del Servidor',
            text: 'Hubo un problema al guardar los datos en la base.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
          });
        }
      } catch (error: any) {
        Swal.fire({
          title: 'Error de Lectura',
          text: 'El archivo Excel está dañado o tiene un formato ilegible.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
        console.error("DETALLE DEL ERROR:", error);
      }
    }
    
    // 2. EL OTRO CAMBIO CLAVE: Leemos como ArrayBuffer
    reader.readAsArrayBuffer(file);
  };
  const materialesFiltrados = materiales.filter((mat) =>
    mat.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <PackagePlus className="text-blue-600" size={32} />
        Catálogo de Materiales
      </h1>

      <div className={`p-6 rounded-xl shadow-sm border transition-colors ${idEdicion ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {idEdicion ? 'Editando Material' : 'Agregar Nuevo Insumo'}
          </h2>
          
          <div className="flex items-center gap-3">
            {idEdicion && (
              <button type="button" onClick={limpiarFormulario} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm mr-4">
                <X size={16} /> Cancelar edición
              </button>
            )}
            
            {/* Botón e Input oculto para Excel */}
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={archivoInputRef} 
              onChange={procesarExcel} 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => archivoInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-4 rounded-md transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              Importar Excel
            </button>
          </div>
        </div>

        <form onSubmit={guardarMaterial} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Descripción</label>
            <input type="text" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Ej. Caño Estructural 40x40" />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-600 mb-1">Unidad</label>
            <select value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 outline-none bg-white">
              <option value="Barra">Barra</option>
              <option value="Chapa">Chapa</option>
              <option value="Unidad">Unidad</option>
              <option value="Kg">Kg</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm text-gray-600 mb-1">Precio Base ($)</label>
            <input type="number" required value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="0.00" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" id="iva" checked={tieneIva} onChange={(e) => setTieneIva(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
            <label htmlFor="iva" className="text-sm text-gray-600 cursor-pointer">¿IVA y Tasas?</label>
          </div>
          <button type="submit" className={`${idEdicion ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-6 rounded-md transition-colors`}>
            {idEdicion ? 'Actualizar' : 'Guardar'}
          </button>
        </form>
      </div>

      {/* Tabla con Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" placeholder="Buscar material por descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-sm text-gray-600 uppercase">
              <th className="p-4 font-semibold">Descripción</th>
              <th className="p-4 font-semibold">Unidad</th>
              <th className="p-4 font-semibold text-right">Precio Costo</th>
              <th className="p-4 font-semibold text-right">Precio Final</th>
              <th className="p-4 font-semibold text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materialesFiltrados.map((mat) => (
              <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{mat.descripcion}</td>
                <td className="p-4 text-gray-600">{mat.unidad_medida}</td>
                <td className="p-4 text-right text-gray-600">${Number(mat.precio_base).toLocaleString('es-AR')}</td>
                <td className="p-4 text-right font-bold text-blue-600">${Number(mat.precio_final).toLocaleString('es-AR')}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => iniciarEdicion(mat)} className="text-gray-400 hover:text-orange-500 transition-colors" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => eliminarMaterial(mat.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {materialesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  {busqueda ? 'No se encontraron resultados.' : 'No hay materiales registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
