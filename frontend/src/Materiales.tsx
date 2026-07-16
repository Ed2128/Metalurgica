import { useState, useEffect } from 'react';
import { PackagePlus, Search, Pencil, Trash2, X } from 'lucide-react'; // Añadimos iconos nuevos

export default function Materiales() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Nuevo estado para saber si estamos editando un material existente
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Barra');
  const [precioBase, setPrecioBase] = useState('');
  const [tieneIva, setTieneIva] = useState(false);

  const cargarMateriales = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/materiales');
      const datos = await respuesta.json();
      setMateriales(datos);
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    }
  };

  useEffect(() => {
    cargarMateriales();
  }, []);

  // Función para resetear el formulario a cero
  const limpiarFormulario = () => {
    setIdEdicion(null);
    setDescripcion('');
    setUnidadMedida('Barra');
    setPrecioBase('');
    setTieneIva(false);
  };

  // Función que se ejecuta al presionar "Guardar"
  const guardarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si tenemos un idEdicion, hacemos PUT (Actualizar). Si no, hacemos POST (Crear)
    const metodo = idEdicion ? 'PUT' : 'POST';
    const url = idEdicion 
      ? `http://localhost:3000/api/materiales/${idEdicion}` 
      : 'http://localhost:3000/api/materiales';

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          unidad_medida: unidadMedida,
          precio_base: Number(precioBase),
          tiene_iva_incluido: tieneIva
        })
      });

      if (respuesta.ok) {
        cargarMateriales();
        limpiarFormulario();
      }
    } catch (error) {
      console.error("Error al guardar material:", error);
    }
  };

  // Función que inyecta los datos en el formulario cuando clickeamos "Editar"
  const iniciarEdicion = (mat: any) => {
    setIdEdicion(mat.id);
    setDescripcion(mat.descripcion);
    setUnidadMedida(mat.unidad_medida);
    setPrecioBase(mat.precio_base.toString());
    setTieneIva(mat.tiene_iva_incluido);
    // Hacemos un poco de scroll hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para eliminar
  const eliminarMaterial = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este material?")) return;

    try {
      const respuesta = await fetch(`http://localhost:3000/api/materiales/${id}`, {
        method: 'DELETE'
      });

      if (respuesta.ok) {
        cargarMateriales();
      } else {
        const error = await respuesta.json();
        alert(error.error || "No se pudo eliminar el material.");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
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

      {/* Formulario */}
      <div className={`p-6 rounded-xl shadow-sm border transition-colors ${idEdicion ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {idEdicion ? 'Editando Material Existente' : 'Agregar Nuevo Insumo'}
          </h2>
          {idEdicion && (
            <button type="button" onClick={limpiarFormulario} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm">
              <X size={16} /> Cancelar edición
            </button>
          )}
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