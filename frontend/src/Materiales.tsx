import { useState, useEffect } from 'react';
import { PackagePlus } from 'lucide-react';

export default function Materiales() {
  // Estado para guardar la lista que viene de PostgreSQL
  const [materiales, setMateriales] = useState<any[]>([]);
  
  // Estados para el formulario
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Barra');
  const [precioBase, setPrecioBase] = useState('');
  const [tieneIva, setTieneIva] = useState(false);

  // Función para ir a buscar los datos al backend
  const cargarMateriales = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/materiales');
      const datos = await respuesta.json();
      setMateriales(datos);
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    }
  };

  // useEffect hace que 'cargarMateriales' se ejecute automáticamente al entrar a esta pantalla
  useEffect(() => {
    cargarMateriales();
  }, []);

  // Función para guardar un nuevo material
  const guardarMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    
    try {
      const respuesta = await fetch('http://localhost:3000/api/materiales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          unidad_medida: unidadMedida,
          precio_base: Number(precioBase), // Convertimos el texto a número
          tiene_iva_incluido: tieneIva
        })
      });

      if (respuesta.ok) {
        // Si se guardó bien, recargamos la tabla y limpiamos el formulario
        cargarMateriales();
        setDescripcion('');
        setPrecioBase('');
        setTieneIva(false);
      }
    } catch (error) {
      console.error("Error al guardar material:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <PackagePlus className="text-blue-600" size={32} />
        Catálogo de Materiales
      </h1>

      {/* Tarjeta del Formulario */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Agregar Nuevo Insumo</h2>
        <form onSubmit={guardarMaterial} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Descripción</label>
            <input 
              type="text" 
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Ej. Caño Estructural 40x40" 
            />
          </div>
          
          <div className="w-32">
            <label className="block text-sm text-gray-600 mb-1">Unidad</label>
            <select 
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 outline-none"
            >
              <option value="Barra">Barra</option>
              <option value="Chapa">Chapa</option>
              <option value="Unidad">Unidad</option>
              <option value="Kg">Kg</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-sm text-gray-600 mb-1">Precio Base ($)</label>
            <input 
              type="number" 
              required
              value={precioBase}
              onChange={(e) => setPrecioBase(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="0.00" 
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              id="iva"
              checked={tieneIva}
              onChange={(e) => setTieneIva(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="iva" className="text-sm text-gray-600 cursor-pointer">
              ¿IVA y Tasas incluidas?
            </label>
          </div>

          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
            Guardar
          </button>
        </form>
      </div>

      {/* Tarjeta de la Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase">
              <th className="p-4 font-semibold">Descripción</th>
              <th className="p-4 font-semibold">Unidad</th>
              <th className="p-4 font-semibold">Precio Costo</th>
              <th className="p-4 font-semibold text-right">Precio Final (+25.11%)</th>
            </tr>
          </thead>
          <tbody>
            {materiales.map((mat) => (
              <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{mat.descripcion}</td>
                <td className="p-4 text-gray-600">{mat.unidad_medida}</td>
                <td className="p-4 text-gray-600">${Number(mat.precio_base).toLocaleString('es-AR')}</td>
                <td className="p-4 text-right font-bold text-blue-600">
                  ${Number(mat.precio_final).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
            {materiales.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No hay materiales registrados. ¡Agrega uno arriba!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}