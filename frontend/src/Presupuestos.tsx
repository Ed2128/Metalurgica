import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save } from 'lucide-react';

export default function Presupuestos() {
  // Datos maestros traídos de la base de datos
  const [clientes, setClientes] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);

  // Estado del formulario
  const [clienteId, setClienteId] = useState('');
  const [coeficiente, setCoeficiente] = useState<number>(2.5); // Por defecto 2.5x para mano de obra
  
  // Lista dinámica de materiales que el usuario va agregando al presupuesto
  const [items, setItems] = useState<{ materialId: string, cantidad: number }[]>([]);

  // Cargar Clientes y Materiales apenas abre la pantalla
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resClientes = await fetch('http://localhost:3000/api/clientes');
        const resMateriales = await fetch('http://localhost:3000/api/materiales');
        
        if (resClientes.ok) setClientes(await resClientes.json());
        if (resMateriales.ok) setMateriales(await resMateriales.json());
      } catch (error) {
        console.error("Error al cargar los datos maestros:", error);
      }
    };
    cargarDatos();
  }, []);

  // Funciones para manejar la lista dinámica de materiales
  const agregarFila = () => {
    setItems([...items, { materialId: '', cantidad: 1 }]);
  };

  const actualizarFila = (index: number, campo: string, valor: string | number) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
    setItems(nuevosItems);
  };

  const eliminarFila = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Enviar el presupuesto al backend
  const guardarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!clienteId || items.length === 0) {
      alert("Por favor, selecciona un cliente y agrega al menos un material.");
      return;
    }

    // Filtramos las filas que el usuario haya dejado en blanco y convertimos los IDs a números
    const itemsProcesados = items
      .filter(item => item.materialId !== '')
      .map(item => ({
        materialId: Number(item.materialId),
        cantidad: Number(item.cantidad)
      }));

    try {
      const respuesta = await fetch('http://localhost:3000/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: Number(clienteId),
          coeficiente_mano_obra: coeficiente,
          items: itemsProcesados
        })
      });

      if (respuesta.ok) {
        alert("¡Presupuesto generado y guardado con éxito!");
        // Limpiamos el formulario para un nuevo trabajo
        setClienteId('');
        setItems([]);
      } else {
        const errorData = await respuesta.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <FileText className="text-blue-600" size={32} />
        Generar Nuevo Presupuesto
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={guardarPresupuesto} className="space-y-6">
          
          {/* Cabecera del Presupuesto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
              <select 
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Elige un cliente --</option>
                {clientes.map(cli => (
                  <option key={cli.id} value={cli.id}>{cli.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coeficiente de Mano de Obra</label>
              <input 
                type="number" 
                step="0.1"
                required
                value={coeficiente}
                onChange={(e) => setCoeficiente(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Multiplicador del costo de materiales (Por defecto 2.5x)</p>
            </div>
          </div>

          {/* Lista de Materiales */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Materiales a Utilizar</h3>
              <button 
                type="button" 
                onClick={agregarFila}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-sm transition-colors"
              >
                <Plus size={16} /> Agregar Ítem
              </button>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-gray-500 text-sm italic border-2 border-dashed border-gray-200 p-4 text-center rounded-lg">
                  Haz clic en "Agregar Ítem" para comenzar a listar los materiales.
                </p>
              )}

              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Material</label>
                    <select 
                      required
                      value={item.materialId}
                      onChange={(e) => actualizarFila(index, 'materialId', e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm outline-none bg-white"
                    >
                      <option value="">-- Seleccionar --</option>
                      {materiales.map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.descripcion} (Costo: ${Number(mat.precio_final).toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={item.cantidad}
                      onChange={(e) => actualizarFila(index, 'cantidad', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded p-2 text-sm outline-none bg-white"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => eliminarFila(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors"
                    title="Eliminar fila"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              <Save size={20} />
              Generar y Guardar Presupuesto
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}