import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Wallet, Pencil, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2'; // Importamos SweetAlert2
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export default function Caja() {
  const [saldoActual, setSaldoActual] = useState(0);
  const [historial, setHistorial] = useState<any[]>([]);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const [tipo, setTipo] = useState('Ingreso');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Adelanto de Cliente');
  const [descripcion, setDescripcion] = useState('');

  const cargarCaja = async () => {
    try {
      let token = localStorage.getItem('token') || '';
      token = token.replace(/^"|"$/g, '');

      const respuesta = await fetch(`${API_URL}/transacciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setSaldoActual(datos.saldo_actual);
        setHistorial(datos.historial);
      } else {
        setSaldoActual(0);
        setHistorial([]); // Evita el pantallazo blanco
      }
    } catch (error) {
      console.error("Error al cargar la caja:", error);
      setHistorial([]);
    }
  };

  useEffect(() => {
    cargarCaja();
  }, []);

  const limpiarFormulario = () => {
    setIdEdicion(null);
    setTipo('Ingreso');
    setMonto('');
    setCategoria('Adelanto de Cliente');
    setDescripcion('');
  };

  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || Number(monto) <= 0) {
      Swal.fire({
        title: 'Monto inválido',
        text: 'El monto ingresado debe ser mayor a $0.',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

  const metodo = idEdicion ? 'PUT' : 'POST';
    // ✅ CORRECTO: Usando comillas invertidas y la variable API_URL
    const url = idEdicion 
      ? `${API_URL}/transacciones/${idEdicion}` 
      : `${API_URL}/transacciones`;

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json',
          // También le agregamos el replace al token por seguridad, igual que en clientes
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}`
        },
      });

      if (respuesta.ok) {
        cargarCaja(); 
        limpiarFormulario();
        
        Swal.fire({
          title: idEdicion ? '¡Movimiento Actualizado!' : '¡Movimiento Registrado!',
          text: idEdicion ? 'La caja se ha recalculado.' : 'El movimiento impactó en el saldo actual.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar la transacción en el servidor.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
    }
  };

  const iniciarEdicion = (mov: any) => {
    setIdEdicion(mov.id);
    setTipo(mov.tipo);
    setMonto(mov.monto.toString());
    setCategoria(mov.categoria);
    setDescripcion(mov.descripcion || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarMovimiento = async (id: number) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar movimiento?',
      text: "El saldo de la caja se reajustará. ¿Estás de acuerdo?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const respuesta = await fetch(`${API_URL}/transacciones/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` 
        }
      });

      if (respuesta.ok) {
        cargarCaja();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El movimiento ha sido borrado del historial.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo procesar el borrado del movimiento.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error("Error al eliminar movimiento:", error);
    }
  };

  return (
<div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
        <DollarSign className="text-blue-600" size={32} />
        Caja Diaria y Movimientos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Columna Izquierda: Saldo y Formulario */}
        <div className="col-span-1 space-y-4 md:space-y-6">
          {/* Tarjeta de Saldo */}
          <div className="bg-blue-600 rounded-xl shadow-md p-6 text-white flex flex-col items-center justify-center">
            <Wallet size={40} className="opacity-80 mb-2" />
            <p className="text-blue-100 font-medium text-sm md:text-base">Saldo Actual en Caja</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
              ${saldoActual.toLocaleString('es-AR')}
            </h2>
          </div>

          {/* Formulario */}
          <div className={`p-4 md:p-6 rounded-xl shadow-sm border transition-colors ${idEdicion ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                {idEdicion ? 'Editando Movimiento' : 'Registrar Movimiento'}
              </h3>
              {idEdicion && (
                <button type="button" onClick={limpiarFormulario} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm">
                  <X size={16} /> <span className="hidden sm:inline">Cancelar</span>
                </button>
              )}
            </div>
            
            <form onSubmit={registrarMovimiento} className="space-y-4">
              {/* Radio Buttons Ingreso/Egreso */}
              <div className="flex gap-3 md:gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="tipo" value="Ingreso" checked={tipo === 'Ingreso'} onChange={(e) => setTipo(e.target.value)} className="peer sr-only" />
                  <div className="p-3 md:p-2 text-center rounded-md border border-gray-200 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 font-medium transition-colors bg-white">
                    Ingreso
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="tipo" value="Egreso" checked={tipo === 'Egreso'} onChange={(e) => setTipo(e.target.value)} className="peer sr-only" />
                  <div className="p-3 md:p-2 text-center rounded-md border border-gray-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 font-medium transition-colors bg-white">
                    Egreso
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Monto ($)</label>
                <input type="number" required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 md:p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-lg md:text-base font-medium" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                <input type="text" required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 md:p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Ej. Pago Proveedor, Retiro Dueño..." />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción / Detalles</label>
                <textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 md:p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white" placeholder="Anotaciones extra..." />
              </div>

              <button type="submit" className={`w-full text-white font-medium py-3 md:py-2.5 rounded-md transition-colors ${idEdicion ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-800 hover:bg-gray-900'}`}>
                {idEdicion ? 'Actualizar Movimiento' : 'Guardar Movimiento'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Historial */}
        <div className="col-span-1 lg:col-span-2 mt-2 md:mt-0">
          <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-0 md:p-4 mb-4 md:mb-0 border-none md:border-b border-gray-200 bg-transparent md:bg-gray-50">
              <h3 className="font-semibold text-gray-700">Historial Reciente</h3>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              {/* Tabla transformada a tarjetas en móvil */}
              <table className="w-full text-left border-collapse block md:table">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-white border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Detalle</th>
                    <th className="p-4 font-semibold text-right">Monto</th>
                    <th className="p-4 font-semibold text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group">
                  {historial.map((mov) => (
                    <tr key={mov.id} className="block md:table-row border border-gray-200 md:border-b md:border-gray-100 hover:bg-gray-50 bg-white mb-4 rounded-lg shadow-sm md:shadow-none md:mb-0 overflow-hidden">
                      {/* Fecha */}
                      <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-sm text-gray-500 whitespace-nowrap">
                        <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Fecha</span>
                        <span>{new Date(mov.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      
                      {/* Detalle */}
                      <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none">
                        <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Detalle</span>
                        <div className="flex items-center justify-end md:justify-start gap-2 text-right md:text-left">
                          <div className="hidden md:block">
                            {mov.tipo === 'Ingreso' ? <ArrowUpCircle className="text-green-500" size={18}/> : <ArrowDownCircle className="text-red-500" size={18}/>}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 flex items-center justify-end md:justify-start gap-1">
                              {/* Ícono visible en móvil al lado del texto */}
                              <span className="md:hidden">
                                {mov.tipo === 'Ingreso' ? <ArrowUpCircle className="text-green-500" size={14}/> : <ArrowDownCircle className="text-red-500" size={14}/>}
                              </span>
                              {mov.categoria}
                            </p>
                            {mov.descripcion && <p className="text-xs text-gray-500">{mov.descripcion}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Monto */}
                      <td className={`flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-right font-bold ${mov.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="md:hidden font-bold text-gray-500 text-xs uppercase text-left">Monto</span>
                        <span className="text-lg md:text-base">
                          {mov.tipo === 'Ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="flex md:table-cell justify-between items-center p-4 text-center bg-gray-50 md:bg-transparent">
                        <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Acciones</span>
                        <div className="flex items-center justify-end md:justify-center gap-4 md:gap-3">
                          <button onClick={() => iniciarEdicion(mov)} className="text-gray-500 hover:text-orange-500 transition-colors p-2 md:p-0 bg-white md:bg-transparent rounded shadow md:shadow-none border md:border-none" title="Editar">
                            <Pencil size={20} className="md:w-[18px] md:h-[18px]" />
                          </button>
                          <button onClick={() => eliminarMovimiento(mov.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2 md:p-0 bg-white md:bg-transparent rounded shadow md:shadow-none border md:border-none" title="Eliminar">
                            <Trash2 size={20} className="md:w-[18px] md:h-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr className="block md:table-row bg-white rounded-lg border border-gray-200 md:border-none shadow-sm md:shadow-none">
                      <td colSpan={4} className="p-8 text-center text-gray-500 block md:table-cell">
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}