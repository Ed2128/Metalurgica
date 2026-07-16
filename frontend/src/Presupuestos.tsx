import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, Printer, Eye, X, History } from 'lucide-react';

export default function Presupuestos() {
  const [pestana, setPestana] = useState<'nuevo' | 'historial'>('nuevo');
  const [clientes, setClientes] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);

  const [clienteId, setClienteId] = useState('');
  const [coeficiente, setCoeficiente] = useState<number>(2.5);
  const [items, setItems] = useState<{ materialId: string, cantidad: number }[]>([]);

  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<any | null>(null);

  const cargarDatosMaestros = async () => {
    try {
      const resClientes = await fetch('http://localhost:3000/api/clientes');
      const resMateriales = await fetch('http://localhost:3000/api/materiales');
      if (resClientes.ok) setClientes(await resClientes.json());
      if (resMateriales.ok) setMateriales(await resMateriales.json());
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const cargarHistorial = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/ordenes');
      if (respuesta.ok) {
        setHistorial(await respuesta.json());
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  useEffect(() => {
    cargarDatosMaestros();
    cargarHistorial();
  }, []);

  const agregarFila = () => setItems([...items, { materialId: '', cantidad: 1 }]);

  const actualizarFila = (index: number, campo: string, valor: string | number) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
    setItems(nuevosItems);
  };

  const eliminarFila = (index: number) => setItems(items.filter((_, i) => i !== index));

  const guardarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || items.length === 0) {
      alert("Selecciona un cliente y agrega al menos un material.");
      return;
    }

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
        alert("¡Presupuesto guardado con éxito!");
        setClienteId('');
        setItems([]);
        cargarHistorial();
        setPestana('historial');
      } else {
        const err = await respuesta.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // =======================================================================
  // FUNCIONES DE CÁLCULO SEGURO (Lógica de Recargo Real del Taller)
  // =======================================================================
  const calcularCostoMateriales = (orden: any) => {
    if (!orden || !orden.items) return 0;
    return orden.items.reduce((sum: number, item: any) => {
      const precioUnitario = Number(item.precio_congelado || item.precio_unitario || item.precio || item.material?.precio_final) || 0;
      return sum + (precioUnitario * Number(item.cantidad));
    }, 0);
  };

  const calcularCostoTotal = (orden: any) => {
    const costoMats = calcularCostoMateriales(orden);
    const coef = Number(orden.coeficiente_mano_obra) || 2.5; 
    
    // LÓGICA DEL TALLER: 
    // Mano de obra = Materiales x 2.5
    // Total = Materiales + Mano de obra
    const manoDeObra = costoMats * coef;
    return costoMats + manoDeObra;
  };
  return (
    <div className="space-y-6 print:p-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={32} />
          Módulo de Presupuestos
        </h1>
        
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button onClick={() => setPestana('nuevo')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm transition-colors ${pestana === 'nuevo' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <Plus size={16} /> Nuevo Presupuesto
          </button>
          <button onClick={() => setPestana('historial')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm transition-colors ${pestana === 'historial' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <History size={16} /> Historial ({historial.length})
          </button>
        </div>
      </div>

      {/* NUEVO PRESUPUESTO */}
      {pestana === 'nuevo' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:hidden">
          <form onSubmit={guardarPresupuesto} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
                <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Elige un cliente --</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coeficiente de Mano de Obra</label>
                <input type="number" step="0.1" required value={coeficiente} onChange={(e) => setCoeficiente(Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Materiales a Utilizar</h3>
                <button type="button" onClick={agregarFila} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-sm transition-colors">
                  <Plus size={16} /> Agregar Ítem
                </button>
              </div>

              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-gray-500 text-sm italic border-2 border-dashed border-gray-200 p-4 text-center rounded-lg">
                    Haz clic en "Agregar Ítem" para listar materiales.
                  </p>
                )}

                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Material</label>
                      <select required value={item.materialId} onChange={(e) => actualizarFila(index, 'materialId', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none bg-white">
                        <option value="">-- Seleccionar --</option>
                        {materiales.map(mat => (
                          <option key={mat.id} value={mat.id}>
                            {mat.descripcion} (Costo: ${Number(mat.precio_final || 0).toLocaleString('es-AR')})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                      <input type="number" min="1" required value={item.cantidad} onChange={(e) => actualizarFila(index, 'cantidad', Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 text-sm outline-none bg-white" />
                    </div>
                    <button type="button" onClick={() => eliminarFila(index)} className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md">
                <Save size={20} /> Guardar Presupuesto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORIAL */}
      {pestana === 'historial' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase">
                <th className="p-4 font-semibold">Nº Presupuesto</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold text-right">Total Presupuestado</th>
                <th className="p-4 font-semibold text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((orden) => (
                <tr key={orden.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-700"># {String(orden.id).padStart(4, '0')}</td>
                  <td className="p-4 text-gray-600">{new Date(orden.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="p-4 font-medium text-gray-800">{orden.cliente?.nombre || 'Desconocido'}</td>
                  {/* Usamos nuestra función segura para el total */}
                  <td className="p-4 text-right font-bold text-blue-600">${calcularCostoTotal(orden).toLocaleString('es-AR')}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => setPresupuestoSeleccionado(orden)} className="inline-flex items-center gap-1 text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 py-1.5 px-3 rounded-md text-xs font-medium transition-colors">
                      <Eye size={14} /> Ver / Imprimir
                    </button>
                  </td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay presupuestos registrados en el historial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* HOJA DE IMPRESIÓN MODAL */}
      {presupuestoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:static print:bg-white print:p-0">
          
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 print:hidden">
              <h3 className="font-bold text-gray-800">Vista Previa de Documento</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-md text-sm transition-colors flex items-center gap-1.5">
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button onClick={() => setPresupuestoSeleccionado(null)} className="text-gray-400 hover:text-red-500 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
              <div className="border border-gray-200 p-8 rounded-lg max-w-[800px] mx-auto print:border-0 print:p-0">
                
                <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6 mb-6">
                  <div>
                    <img src="/logo.png" alt="Logo Taller" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="h-16 mb-2 object-contain" />
                    <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-tight">Taller Metalúrgico</h2>
                    <p className="text-sm text-gray-500">Trabajos a medida • Estructuras • Herrería en general</p>
                    <p className="text-xs text-gray-400 mt-1">Posadas, Misiones, Argentina</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md inline-block font-mono text-sm mb-3">
                      PRESUPUESTO Nº {String(presupuestoSeleccionado.id).padStart(4, '0')}
                    </div>
                    <p className="text-sm text-gray-600">Fecha: <strong>{new Date(presupuestoSeleccionado.fecha).toLocaleDateString('es-AR')}</strong></p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold">Cliente</span>
                    <p className="font-bold text-gray-800 text-base">{presupuestoSeleccionado.cliente?.nombre || 'Consumidor Final'}</p>
                  </div>
                  <div className="text-right">
                    {presupuestoSeleccionado.cliente?.contacto && (
                      <div>
                        <span className="text-xs text-gray-400 uppercase font-semibold">Teléfono</span>
                        <p className="text-gray-700">{presupuestoSeleccionado.cliente.contacto}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-2">Detalle de Materiales e Insumos</h4>
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase text-left">
                        <th className="p-2.5 border border-gray-200">Material</th>
                        <th className="p-2.5 border border-gray-200 text-center w-24">Cant.</th>
                        <th className="p-2.5 border border-gray-200 text-center w-24">Unidad</th>
                        <th className="p-2.5 border border-gray-200 text-right w-32">Precio Unit.</th>
                        <th className="p-2.5 border border-gray-200 text-right w-32">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {presupuestoSeleccionado.items.map((item: any, idx: number) => {
                        const precioUnit = Number(item.precio_congelado || item.precio_unitario || item.precio || item.material?.precio_final) || 0;
                        const subtotal = precioUnit * Number(item.cantidad);
                        return (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="p-2.5 border border-gray-200 font-medium">{item.material?.descripcion || 'Insumo'}</td>
                            <td className="p-2.5 border border-gray-200 text-center">{item.cantidad}</td>
                            <td className="p-2.5 border border-gray-200 text-center">{item.material?.unidad_medida || 'Unidad'}</td>
                            <td className="p-2.5 border border-gray-200 text-right">${precioUnit.toLocaleString('es-AR')}</td>
                            <td className="p-2.5 border border-gray-200 text-right font-medium">${subtotal.toLocaleString('es-AR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-4">
                  <div className="w-80 text-sm space-y-2.5 border-t-2 border-gray-200 pt-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Costo de Materiales:</span>
                      <span>${calcularCostoMateriales(presupuestoSeleccionado).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Mano de Obra y Gastos:</span>
                      <span>${(calcularCostoTotal(presupuestoSeleccionado) - calcularCostoMateriales(presupuestoSeleccionado)).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-lg text-blue-600 border-t border-gray-200 pt-2 bg-blue-50 px-3 py-1.5 rounded-md">
                      <span>TOTAL NETO:</span>
                      <span>${calcularCostoTotal(presupuestoSeleccionado).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-dashed border-gray-200 text-xs text-gray-500 space-y-4">
                  <p className="italic text-center">** Validez del presupuesto: 7 días debido a la volatilidad de precios en metales. **</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}