import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, Printer, Eye, X, History, Calculator, User, Wrench } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      const token = localStorage.getItem('token')?.replace(/^"|"$/g, '') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const resClientes = await fetch(`${API_URL}/clientes`, { headers });
      const resMateriales = await fetch(`${API_URL}/materiales`, { headers });
      
      if (resClientes.ok) setClientes(await resClientes.json());
      if (resMateriales.ok) setMateriales(await resMateriales.json());
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const cargarHistorial = async () => {
    try {
      const token = localStorage.getItem('token')?.replace(/^"|"$/g, '') || '';
      const respuesta = await fetch(`${API_URL}/ordenes`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (respuesta.ok) {
        setHistorial(await respuesta.json());
      } else {
        setHistorial([]); 
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
      setHistorial([]);
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
    if (!clienteId || items.length === 0 || items.some(i => !i.materialId)) {
      Swal.fire({
        title: 'Datos incompletos',
        text: 'Por favor, selecciona un cliente y asegúrate de que todos los ítems tengan un material válido.',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const itemsProcesados = items.map(item => ({
      materialId: Number(item.materialId),
      cantidad: Number(item.cantidad)
    }));

    try {
      const respuesta = await fetch(`${API_URL}/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' , 'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` },
        body: JSON.stringify({
          clienteId: Number(clienteId),
          coeficiente_mano_obra: coeficiente,
          items: itemsProcesados
        })
      });

      if (respuesta.ok) {
        Swal.fire({
          title: '¡Presupuesto Generado!',
          text: 'La orden de trabajo se ha guardado correctamente.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        
        setClienteId('');
        setItems([]);
        cargarHistorial();
        setPestana('historial');
      } else {
        const err = await respuesta.json();
        Swal.fire({ title: 'Error de Servidor', text: err.error || 'No se pudo guardar la orden.', icon: 'error', confirmButtonColor: '#2563eb' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarOrden = async (id: number) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará este presupuesto de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const respuesta = await fetch(`${API_URL}/ordenes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` }
      });

      if (respuesta.ok) {
        cargarHistorial();
        Swal.fire({ title: '¡Eliminado!', text: 'El presupuesto ha sido borrado.', icon: 'success', confirmButtonColor: '#2563eb' });
      }
    } catch (error) {
      console.error("Error al eliminar presupuesto:", error);
    }
  };

  // --- MATEMÁTICA EN TIEMPO REAL PARA EL FORMULARIO ---
  const costoMaterialesEnVivo = items.reduce((sum, item) => {
    const mat = materiales.find(m => m.id === Number(item.materialId));
    const precio = mat ? Number(mat.precio_final) : 0;
    return sum + (precio * Number(item.cantidad));
  }, 0);
  
  const manoDeObraEnVivo = costoMaterialesEnVivo * (coeficiente || 0);
  const totalEnVivo = costoMaterialesEnVivo + manoDeObraEnVivo;

  // --- MATEMÁTICA PARA EL HISTORIAL ---
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
    return costoMats + (costoMats * coef);
  };

  return (
    <div className="space-y-4 md:space-y-6 print:p-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={32} />
          Módulo de Presupuestos
        </h1>
        
        <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto shadow-inner">
          <button onClick={() => setPestana('nuevo')} className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 px-5 py-2.5 md:py-2 rounded-md font-medium text-sm transition-all ${pestana === 'nuevo' ? 'bg-white text-blue-700 shadow border border-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>
            <Plus size={16} /> Nuevo
          </button>
          <button onClick={() => setPestana('historial')} className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 px-5 py-2.5 md:py-2 rounded-md font-medium text-sm transition-all ${pestana === 'historial' ? 'bg-white text-blue-700 shadow border border-gray-100' : 'text-gray-600 hover:text-gray-800'}`}>
            <History size={16} /> Historial
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA: NUEVO PRESUPUESTO */}
      {/* ======================================================== */}
      {pestana === 'nuevo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          
          {/* Panel Izquierdo: Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={guardarPresupuesto} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-6 border-b border-gray-100">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><User size={16} className="text-blue-500"/> Cliente</label>
                  <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors">
                    <option value="">-- Seleccionar --</option>
                    {clientes.map(cli => <option key={cli.id} value={cli.id}>{cli.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><Calculator size={16} className="text-blue-500"/> Multiplicador Mano de Obra</label>
                  <input type="number" step="0.1" required value={coeficiente} onChange={(e) => setCoeficiente(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-center font-bold text-gray-700" />
                </div>
              </div>

              <div className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Wrench size={20} className="text-gray-500"/> Desglose de Materiales</h3>
                  <button type="button" onClick={agregarFila} className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 py-1.5 px-3 rounded-md text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Añadir Ítem
                  </button>
                </div>

                <div className="space-y-3">
                  {items.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center rounded-xl">
                      <p className="text-gray-500 font-medium">No hay materiales en el presupuesto.</p>
                      <p className="text-sm text-gray-400 mt-1">Añade los insumos necesarios para calcular el costo.</p>
                    </div>
                  )}

                  {items.map((item, index) => {
                    // Calculamos subtotal de la fila al vuelo
                    const matSeleccionado = materiales.find(m => m.id === Number(item.materialId));
                    const precioU = matSeleccionado ? Number(matSeleccionado.precio_final) : 0;
                    const subtotalFila = precioU * (item.cantidad || 0);

                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                        <div className="w-full sm:flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Insumo</label>
                          <select required value={item.materialId} onChange={(e) => actualizarFila(index, 'materialId', e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none bg-gray-50 focus:bg-white">
                            <option value="">-- Elegir Material --</option>
                            {materiales.map(mat => (
                              <option key={mat.id} value={mat.id}>
                                {mat.descripcion} (${Number(mat.precio_final).toLocaleString('es-AR')})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto items-end">
                          <div className="flex-1 sm:w-20">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Cant.</label>
                            <input type="number" min="0.1" step="0.1" required value={item.cantidad} onChange={(e) => actualizarFila(index, 'cantidad', Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2 text-sm text-center outline-none bg-gray-50 focus:bg-white" />
                          </div>
                          <div className="flex-1 sm:w-28 bg-gray-100 border border-gray-200 p-2 rounded-md text-right">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Subtotal</span>
                            <span className="font-bold text-gray-700 text-sm">${subtotalFila.toLocaleString('es-AR')}</span>
                          </div>
                          <button type="button" onClick={() => eliminarFila(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100 flex-shrink-0">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* Panel Derecho: Ticket de Resumen en Vivo */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 sticky top-6 text-white">
              <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-6 border-b border-gray-700 pb-2">Resumen Financiero</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Costo Insumos (Neto)</span>
                  <span className="font-medium">${costoMaterialesEnVivo.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Mano de Obra (x{coeficiente})</span>
                  <span className="font-medium">${manoDeObraEnVivo.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total a Cotizar</p>
                <p className="text-4xl font-black text-blue-400 tracking-tight">${totalEnVivo.toLocaleString('es-AR')}</p>
              </div>

              <button onClick={guardarPresupuesto} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-lg transition-colors shadow-md mt-8">
                <Save size={20} /> Guardar Presupuesto
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA: HISTORIAL */}
      {/* ======================================================== */}
      {pestana === 'historial' && (
        <div className="bg-white md:rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold">Nº Presup.</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold text-right">Monto Total</th>
                <th className="p-4 font-semibold text-center w-48">Acciones</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {historial.map((orden) => (
                <tr key={orden.id} className="block md:table-row border-b border-gray-100 hover:bg-gray-50 bg-white">
                  <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none font-bold text-gray-700">
                    <span className="md:hidden font-bold text-gray-400 text-xs uppercase">Nº Presupuesto</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">#{String(orden.id).padStart(4, '0')}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-gray-600 text-sm">
                    <span className="md:hidden font-bold text-gray-400 text-xs uppercase">Fecha</span>
                    {new Date(orden.fecha).toLocaleDateString('es-AR')}
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none font-medium text-gray-800">
                    <span className="md:hidden font-bold text-gray-400 text-xs uppercase">Cliente</span>
                    <span className="truncate">{orden.cliente?.nombre || 'Desconocido'}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-right font-black text-blue-600">
                    <span className="md:hidden font-bold text-gray-400 text-xs uppercase">Total</span>
                    <span className="text-lg md:text-base">${calcularCostoTotal(orden).toLocaleString('es-AR')}</span>
                  </td>
                  <td className="flex md:table-cell justify-end items-center p-4 gap-2 bg-gray-50 md:bg-transparent">
                    <button onClick={() => setPresupuestoSeleccionado(orden)} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 py-1.5 px-3 rounded-md text-sm font-medium transition-colors">
                      <Eye size={16} /> <span className="md:hidden lg:inline">Ver Ticket</span>
                    </button>
                    <button onClick={() => eliminarOrden(orden.id)} className="flex-1 md:flex-none inline-flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 px-3 rounded-md text-sm font-medium transition-colors" title="Eliminar">
                      <Trash2 size={16} /> <span className="md:hidden lg:inline">Borrar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr className="block md:table-row">
                  <td colSpan={5} className="p-8 text-center text-gray-500 block md:table-cell">No hay presupuestos registrados en el historial.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE IMPRESIÓN */}
      {/* ======================================================== */}
      {presupuestoSeleccionado && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-start md:items-center justify-center z-50 p-2 md:p-4 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col mt-4 md:mt-0 max-h-[95vh] md:max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 print:hidden rounded-t-xl">
              <h3 className="font-bold text-gray-800">Vista Previa del Documento</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Printer size={16} /> Imprimir / Guardar PDF
                </button>
                <button onClick={() => setPresupuestoSeleccionado(null)} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:overflow-visible print:p-0 bg-gray-100 print:bg-white">
              <div className="bg-white border border-gray-200 p-6 sm:p-10 rounded-lg max-w-[800px] mx-auto shadow-sm print:border-0 print:shadow-none print:p-0">
                
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-800 pb-6 mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Metalúrgica 41 40</h2>
                    <p className="text-sm text-gray-600 mt-1">Estructuras • Herrería • Trabajos a medida</p>
                    <p className="text-sm text-gray-500">Posadas, Misiones, Argentina</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Presupuesto</div>
                    <div className="text-2xl font-mono font-bold text-gray-900"># {String(presupuestoSeleccionado.id).padStart(4, '0')}</div>
                    <p className="text-sm text-gray-600 mt-1">Fecha: {new Date(presupuestoSeleccionado.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cliente</span>
                    <p className="font-black text-gray-900 text-lg">{presupuestoSeleccionado.cliente?.nombre || 'Consumidor Final'}</p>
                  </div>
                  {presupuestoSeleccionado.cliente?.contacto && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Teléfono</span>
                      <p className="font-bold text-gray-700">{presupuestoSeleccionado.cliente.contacto}</p>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-800 text-xs font-bold text-gray-900 uppercase text-left">
                        <th className="py-3 px-2">Descripción del Material</th>
                        <th className="py-3 px-2 text-center w-20">Cant.</th>
                        <th className="py-3 px-2 text-right w-32">Precio Unit.</th>
                        <th className="py-3 px-2 text-right w-32">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                      {presupuestoSeleccionado.items.map((item: any, idx: number) => {
                        const precioUnit = Number(item.precio_congelado || item.precio_unitario || item.precio || item.material?.precio_final) || 0;
                        const subtotal = precioUnit * Number(item.cantidad);
                        return (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-3 px-2 font-medium">{item.material?.descripcion || 'Insumo'}</td>
                            <td className="py-3 px-2 text-center">{item.cantidad} {item.material?.unidad_medida?.substring(0,2) || 'Un'}</td>
                            <td className="py-3 px-2 text-right">${precioUnit.toLocaleString('es-AR')}</td>
                            <td className="py-3 px-2 text-right font-bold">${subtotal.toLocaleString('es-AR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-4">
                  <div className="w-full sm:w-80 text-sm space-y-3">
                    <div className="flex justify-between text-gray-600 px-2">
                      <span>Subtotal Insumos:</span>
                      <span className="font-medium">${calcularCostoMateriales(presupuestoSeleccionado).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 px-2 pb-3 border-b border-gray-300">
                      <span>Mano de Obra y Armado:</span>
                      <span className="font-medium">${(calcularCostoTotal(presupuestoSeleccionado) - calcularCostoMateriales(presupuestoSeleccionado)).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between font-black text-xl text-gray-900 bg-gray-100 px-3 py-3 rounded-lg">
                      <span>TOTAL GENERAL:</span>
                      <span>${calcularCostoTotal(presupuestoSeleccionado).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-gray-300 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Validez del presupuesto: 7 días</p>
                  <p className="text-[11px] text-gray-400 mt-1">Los precios están sujetos a modificaciones debido a la volatilidad del costo de los metales.</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}