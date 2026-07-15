import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

export default function Caja() {
  const [saldoActual, setSaldoActual] = useState(0);
  const [historial, setHistorial] = useState<any[]>([]);

  // Estados del formulario
  const [tipo, setTipo] = useState('Ingreso');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Adelanto de Cliente');
  const [descripcion, setDescripcion] = useState('');

  // Cargar el saldo y el historial desde el backend
  const cargarCaja = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/transacciones');
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setSaldoActual(datos.saldo_actual);
        setHistorial(datos.historial);
      }
    } catch (error) {
      console.error("Error al cargar la caja:", error);
    }
  };

  useEffect(() => {
    cargarCaja();
  }, []);

  // Guardar un nuevo movimiento
  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || Number(monto) <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:3000/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          monto: Number(monto),
          categoria,
          descripcion
        })
      });

      if (respuesta.ok) {
        cargarCaja(); // Recargamos para actualizar el saldo
        setMonto('');
        setDescripcion('');
      }
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <DollarSign className="text-blue-600" size={32} />
        Caja Diaria y Movimientos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel Izquierdo: Saldo y Formulario */}
        <div className="col-span-1 space-y-6">
          {/* Tarjeta de Saldo */}
          <div className="bg-blue-600 rounded-xl shadow-md p-6 text-white flex flex-col items-center justify-center">
            <Wallet size={40} className="opacity-80 mb-2" />
            <p className="text-blue-100 font-medium">Saldo Actual en Caja</p>
            <h2 className="text-4xl font-bold tracking-tight">
              ${saldoActual.toLocaleString('es-AR')}
            </h2>
          </div>

          {/* Formulario de Movimiento */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Registrar Movimiento</h3>
            <form onSubmit={registrarMovimiento} className="space-y-4">
              
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="tipo" value="Ingreso" checked={tipo === 'Ingreso'} onChange={(e) => setTipo(e.target.value)} className="peer sr-only" />
                  <div className="p-2 text-center rounded-md border border-gray-200 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 font-medium transition-colors">
                    Ingreso
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="tipo" value="Egreso" checked={tipo === 'Egreso'} onChange={(e) => setTipo(e.target.value)} className="peer sr-only" />
                  <div className="p-2 text-center rounded-md border border-gray-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 font-medium transition-colors">
                    Egreso
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Monto ($)</label>
                <input 
                  type="number" required value={monto} onChange={(e) => setMonto(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="0.00" 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                <input 
                  type="text" required value={categoria} onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ej. Pago Proveedor, Retiro Dueño..." 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción / Detalles (Opcional)</label>
                <textarea 
                  rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  placeholder="Anotaciones extra..." 
                />
              </div>

              <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-md transition-colors">
                Guardar Movimiento
              </button>
            </form>
          </div>
        </div>

        {/* Panel Derecho: Historial de Transacciones */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Historial Reciente</h3>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Detalle</th>
                    <th className="p-4 font-semibold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((mov) => (
                    <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(mov.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {mov.tipo === 'Ingreso' ? <ArrowUpCircle className="text-green-500" size={18}/> : <ArrowDownCircle className="text-red-500" size={18}/>}
                          <div>
                            <p className="font-medium text-gray-800">{mov.categoria}</p>
                            {mov.descripcion && <p className="text-xs text-gray-500">{mov.descripcion}</p>}
                          </div>
                        </div>
                      </td>
                      <td className={`p-4 text-right font-bold ${mov.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.tipo === 'Ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
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