import { useState, useEffect, useRef } from 'react';
import { PackagePlus, Search, Pencil, Trash2, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Materiales() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Kg');
  const [cantidad, setCantidad] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');

  const archivoInputRef = useRef<HTMLInputElement>(null);

  const cargarMateriales = async () => {
    try {
      let token = localStorage.getItem('token') || '';
      token = token.replace(/^"|"$/g, '');

      const respuesta = await fetch(`${API_URL}/materiales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setMateriales(datos);
      } else {
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
    setUnidadMedida('Kg');
    setCantidad('');
    setPrecioUnitario('');
  };

  const guardarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- MATEMÁTICA TRIBUTARIA ---
    const cant = Number(cantidad) || 0;
    const pUnit = Number(precioUnitario) || 0;
    
    const importeBase = cant * pUnit;
    const iva = importeBase * 0.21;
    const ib = importeBase * 0.0331;
    const muni = importeBase * 0.008;
    const total = importeBase + iva + ib + muni;

    const url = idEdicion ? `${API_URL}/materiales/${idEdicion}` : `${API_URL}/materiales`;
    const metodo = idEdicion ? 'PUT' : 'POST';

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}`
        },
        body: JSON.stringify({ 
          descripcion: descripcion,
          unidad_medida: unidadMedida,
          cantidad: cant,
          precio_unitario: pUnit,
          precio_base: importeBase,
          iva: iva,
          percepcion_ib: ib,
          seg_hig: muni,
          precio_final: total
        })
      });

      if (respuesta.ok) {
        limpiarFormulario();
        cargarMateriales();
        Swal.fire({
          title: '¡Guardado!',
          text: 'El material y sus impuestos se calcularon correctamente.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      } else {
        const errorData = await respuesta.json();
        Swal.fire({ title: 'Error', text: errorData.error || 'No se pudo guardar.', icon: 'error', confirmButtonColor: '#2563eb' });
      }
    } catch (error) {
      console.error('Error al guardar material:', error);
    }
  };

  const iniciarEdicion = (mat: any) => {
    setIdEdicion(mat.id);
    setDescripcion(mat.descripcion);
    setUnidadMedida(mat.unidad_medida);
    setCantidad((mat.cantidad || 1).toString());
    setPrecioUnitario((mat.precio_unitario || mat.precio_base).toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarMaterial = async (id: number) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const respuesta = await fetch(`${API_URL}/materiales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` }
      });

      if (respuesta.ok) {
        cargarMateriales();
        Swal.fire({ title: '¡Eliminado!', text: 'El material ha sido borrado.', icon: 'success', confirmButtonColor: '#2563eb' });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const procesarExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const datosRaw = XLSX.utils.sheet_to_json<any[]>(hoja, { header: 1 }); 

        const normalizarTexto = (str: string) => String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        let filaEncabezados = -1;
        let colDesc = -1, colPrecio = -1;

        for (let i = 0; i < datosRaw.length; i++) {
          const fila = datosRaw[i];
          if (!Array.isArray(fila)) continue;
          const filaNormalizada = Array.from(fila).map(celda => celda ? normalizarTexto(celda) : '');

          const idxDesc = filaNormalizada.findIndex(val => ['descripcion', 'desc', 'nombre', 'articulo'].some(pc => val && val.includes(pc)));
          const idxPrecio = filaNormalizada.findIndex(val => ['precio', 'costo', 'importe'].some(pc => val && val.includes(pc)));

          if (idxDesc !== -1 && idxPrecio !== -1) {
            filaEncabezados = i; colDesc = idxDesc; colPrecio = idxPrecio; break; 
          }
        }

        if (filaEncabezados === -1) {
          Swal.fire({ title: 'Error', text: 'No se encontró la fila de encabezados.', icon: 'error' });
          return;
        }

        const esPorKg = normalizarTexto(String(datosRaw[filaEncabezados][colPrecio] || '')).includes('kg');
        const materialesFormateados = [];

        for (let i = filaEncabezados + 1; i < datosRaw.length; i++) {
          const fila = datosRaw[i];
          if (!Array.isArray(fila) || fila.length === 0) continue;

          const descripcionExcel = fila[colDesc] ? String(fila[colDesc]).trim() : '';
          const pLimpio = String(fila[colPrecio]).replace('$', '').replace(',', '.').trim();
          const pUnit = Number(pLimpio) || 0;

          if (descripcionExcel && pUnit > 0) {
            const cant = 1; // Por defecto importamos 1 unidad/kilo del Excel
            const importeBase = cant * pUnit;
            const iva = importeBase * 0.21;
            const ib = importeBase * 0.0331;
            const muni = importeBase * 0.008;
            
            materialesFormateados.push({
              descripcion: descripcionExcel,
              unidad_medida: esPorKg ? 'Kg' : 'Unidad',
              cantidad: cant,
              precio_unitario: pUnit,
              precio_base: importeBase,
              iva: iva,
              percepcion_ib: ib,
              seg_hig: muni,
              precio_final: importeBase + iva + ib + muni
            });
          }
        }

        if (materialesFormateados.length > 0) {
          const respuesta = await fetch(`${API_URL}/materiales/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` },
            body: JSON.stringify(materialesFormateados)
          });
          if (respuesta.ok) {
            cargarMateriales();
            Swal.fire({ title: '¡Importación Exitosa!', text: 'Se calcularon los impuestos automáticamente.', icon: 'success' });
          }
        }
      } catch (error) {
        console.error("Error al procesar Excel:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const materialesFiltrados = materiales.filter((mat) => mat.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

  // Utilidad para formatear moneda con 2 decimales fijos
  const formatDinero = (monto: number) => `$${Number(monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
        <PackagePlus className="text-blue-600" size={32} />
        Catálogo y Compra de Materiales
      </h1>

      <div className={`p-4 md:p-6 rounded-xl shadow-sm border transition-colors ${idEdicion ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">{idEdicion ? 'Editando Material' : 'Ingresar Material de Factura'}</h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {idEdicion && (
              <button type="button" onClick={limpiarFormulario} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm">
                <X size={16} /> Cancelar edición
              </button>
            )}
            <input type="file" accept=".xlsx, .xls" ref={archivoInputRef} onChange={procesarExcel} className="hidden" />
            <button type="button" onClick={() => archivoInputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 md:py-1.5 px-4 rounded-md flex items-center justify-center gap-2">
              <Upload size={16} /> Importar Excel
            </button>
          </div>
        </div>

        <form onSubmit={guardarMaterial} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Descripción</label>
            <input type="text" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="" />
          </div>
          
          <div className="w-full">
            <label className="block text-sm text-gray-600 mb-1">Unidad</label>
            <select value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 outline-none bg-white">
              <option value="Kg">Kg</option>
              <option value="Barra">Barra</option>
              <option value="Chapa">Chapa</option>
              <option value="Unidad">Unidad</option>
            </select>
          </div>
          
          <div className="w-full">
            <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
            <input type="number" step="0.01" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Ej: 15.5" />
          </div>

          <div className="w-full">
            <label className="block text-sm text-gray-600 mb-1">Precio Unit. ($)</label>
            <input type="number" step="0.01" required value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="0.00" />
          </div>
          
          <button type="submit" className={`w-full sm:col-span-2 lg:col-span-5 ${idEdicion ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-6 rounded-md transition-colors mt-2`}>
            {idEdicion ? 'Actualizar Material e Impuestos' : 'Calcular y Guardar'}
          </button>
        </form>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden">
        <div className="p-0 md:p-4 mb-4 md:mb-0 border-none md:border-b border-gray-200 bg-transparent md:bg-gray-50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar material..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm md:shadow-none" />
          </div>
        </div>

        {/* Tabla expandida para impuestos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse block md:table min-w-max">
            <thead className="hidden md:table-header-group">
              <tr className="bg-white border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wide">
                <th className="p-3 font-semibold">Descripción</th>
                <th className="p-3 font-semibold text-center">Cant.</th>
                <th className="p-3 font-semibold text-right">P. Unit</th>
                <th className="p-3 font-semibold text-right text-gray-400">Importe</th>
                <th className="p-3 font-semibold text-right text-gray-400">IVA 21%</th>
                <th className="p-3 font-semibold text-right text-gray-400">IB 3.3%</th>
                <th className="p-3 font-semibold text-right text-gray-400">Muni 0.8%</th>
                <th className="p-3 font-bold text-right text-blue-600">TOTAL</th>
                <th className="p-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {materialesFiltrados.map((mat) => (
                <tr key={mat.id} className="block md:table-row border border-gray-200 md:border-b md:border-gray-100 hover:bg-gray-50 bg-white mb-4 rounded-lg shadow-sm md:shadow-none md:mb-0">
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none font-medium text-gray-800">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Descripción</span>
                    <span className="truncate">{mat.descripcion}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none text-gray-600 md:text-center">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Cantidad</span>
                    <span>{mat.cantidad} {mat.unidad_medida}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none text-gray-600 md:text-right">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Precio Unit.</span>
                    <span>{formatDinero(mat.precio_unitario)}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none text-gray-400 md:text-right text-sm">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Importe</span>
                    <span>{formatDinero(mat.precio_base)}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none text-gray-400 md:text-right text-sm">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">IVA 21%</span>
                    <span>{formatDinero(mat.iva)}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none text-gray-400 md:text-right text-sm">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">IB 3.31%</span>
                    <span>{formatDinero(mat.percepcion_ib)}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none text-gray-400 md:text-right text-sm">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Seg. Hig. 0.8%</span>
                    <span>{formatDinero(mat.seg_hig)}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 border-b border-gray-100 md:border-none font-bold text-blue-600 md:text-right text-lg md:text-base">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Total</span>
                    <span>{formatDinero(mat.precio_final)}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-3 text-center bg-gray-50 md:bg-transparent">
                    <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Acciones</span>
                    <div className="flex items-center justify-end md:justify-center gap-3">
                      <button onClick={() => iniciarEdicion(mat)} className="text-gray-500 hover:text-orange-500 transition-colors p-2 md:p-0 bg-white md:bg-transparent rounded shadow md:shadow-none border md:border-none"><Pencil size={18} /></button>
                      <button onClick={() => eliminarMaterial(mat.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2 md:p-0 bg-white md:bg-transparent rounded shadow md:shadow-none border md:border-none"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {materialesFiltrados.length === 0 && (
                <tr className="block md:table-row bg-white rounded-lg border border-gray-200 md:border-none shadow-sm md:shadow-none">
                  <td colSpan={9} className="p-8 text-center text-gray-500 block md:table-cell">
                    No hay materiales registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}