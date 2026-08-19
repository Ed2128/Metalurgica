import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, AlertCircle, PackagePlus, FileText, ArrowRight, ArrowUpCircle, ArrowDownCircle, Activity, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Inicio() {
  const [saldo, setSaldo] = useState(0);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [ultimosMovimientos, setUltimosMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const nombreUsuario = localStorage.getItem('nombre') || 'Usuario';

  useEffect(() => {
    const cargarTablero = async () => {
      try {
        let token = localStorage.getItem('token')?.replace(/^"|"$/g, '') || '';
        const headers = { 'Authorization': `Bearer ${token}` };

        // Hacemos las llamadas al backend en paralelo para mayor velocidad
        const [resTransacciones, resResumen] = await Promise.all([
          fetch(`${API_URL}/transacciones`, { headers }),
          fetch(`${API_URL}/resumen-semanal`, { headers })
        ]);

        if (resTransacciones.ok) {
          const datosCaja = await resTransacciones.json();
          setSaldo(datosCaja.saldo_actual);
          setUltimosMovimientos(datosCaja.historial.slice(0, 4)); // Solo mostramos los 4 más recientes
        }

        if (resResumen.ok) {
          const datosResumen = await resResumen.json();
          setPendientes(datosResumen.pendientesDeCobro);
        }
      } catch (error) {
        console.error("Error al cargar el tablero:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarTablero();
  }, []);

  const totalPendiente = pendientes.reduce((sum, p) => sum + Number(p.monto), 0);

  if (cargando) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 font-medium animate-pulse">
        Cargando tu tablero principal...
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto">
      
      {/* Saludo Personalizado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">¡Hola, {nombreUsuario}! 👋</h1>
          <p className="text-gray-500 mt-1">Este es el resumen de tu taller al día de hoy.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-medium text-gray-600 flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          Sistema en línea
        </div>
      </div>

      {/* METRICAS PRINCIPALES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Tarjeta de Caja */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 font-medium text-sm md:text-base uppercase tracking-wider mb-1">Caja Diaria</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">${saldo.toLocaleString('es-AR')}</h2>
          </div>
          <div className="relative z-10 mt-6">
            <Link to="/caja" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
              Ir a la caja <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Tarjeta de Deudas */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-orange-100 font-medium text-sm md:text-base uppercase tracking-wider mb-1 flex items-center gap-2">
              <AlertCircle size={18} /> Capital en la Calle
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">${totalPendiente.toLocaleString('es-AR')}</h2>
            <p className="text-orange-100 text-sm mt-1">Repartido en {pendientes.length} trabajos por cobrar.</p>
          </div>
          <div className="relative z-10 mt-6">
            <Link to="/resumen" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
              Ver Resumen Semanal <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ACCESOS RÁPIDOS */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2 mb-2">⚡ Tareas Rápidas</h3>
          
          <Link to="/presupuestos" className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <div className="ml-4">
              <p className="font-bold text-gray-800">Nuevo Presupuesto</p>
              <p className="text-xs text-gray-500">Armar cotización para cliente</p>
            </div>
          </Link>

          <Link to="/materiales" className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all group">
            <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <PackagePlus size={24} />
            </div>
            <div className="ml-4">
              <p className="font-bold text-gray-800">Cargar Materiales</p>
              <p className="text-xs text-gray-500">Facturas, precios e importación</p>
            </div>
          </Link>
        </div>

        {/* ACTIVIDAD RECIENTE (MINI-FEED) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">⏱️ Últimos Movimientos</h3>
              <Link to="/caja" className="text-sm text-blue-600 font-medium hover:underline">Ver todo</Link>
            </div>
            
            <div className="p-4 md:p-5 flex-1">
              {ultimosMovimientos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                  <Activity size={40} className="mb-2 opacity-50" />
                  <p>Aún no hay movimientos registrados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ultimosMovimientos.map((mov) => (
                    <div key={mov.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${mov.tipo === 'Ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {mov.tipo === 'Ingreso' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm md:text-base">
                            {mov.categoria}
                            {mov.estado === 'PENDIENTE' && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase">Pendiente</span>}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleDateString('es-AR')} • {mov.descripcion || 'Sin detalle'}</p>
                        </div>
                      </div>
                      <div className={`font-bold ${mov.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.tipo === 'Ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}