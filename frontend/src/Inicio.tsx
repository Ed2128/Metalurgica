import { useState, useEffect } from 'react';
import { Users, Wrench, FileText, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    clientes: 0,
    materiales: 0,
    ordenes: 0,
    saldo: 0
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarMetricas = async () => {
      try {
        const token = localStorage.getItem('token')?.replace(/^"|"$/g, '') || '';
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Hacemos las 4 peticiones al servidor al mismo tiempo
       const [resClientes, resMateriales, resOrdenes, resCaja] = await Promise.all([
             fetch(`${API_URL}/clientes`, { headers }),
             fetch(`${API_URL}/materiales`, { headers }),
             fetch(`${API_URL}/ordenes`, { headers }),
             fetch(`${API_URL}/transacciones`, { headers })
        ]);
        // 2. Extraemos los datos secuencialmente para que TypeScript no arroje errores de tipo
        const clientes = resClientes.ok ? await resClientes.json() : [];
        const materiales = resMateriales.ok ? await resMateriales.json() : [];
        const ordenes = resOrdenes.ok ? await resOrdenes.json() : [];
        const caja = resCaja.ok ? await resCaja.json() : { saldo_actual: 0 };

        setMetricas({
          clientes: clientes.length || 0,
          materiales: materiales.length || 0,
          ordenes: ordenes.length || 0,
          saldo: caja.saldo_actual || 0
        });
      } catch (error) {
        console.error("Error al cargar las métricas:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarMetricas();
  }, []);

  const tarjetas = [
    { titulo: 'Saldo en Caja', valor: `$${metricas.saldo.toLocaleString('es-AR')}`, icono: <DollarSign size={24} />, color: 'bg-green-500', link: '/caja' },
    { titulo: 'Presupuestos Emitidos', valor: metricas.ordenes, icono: <FileText size={24} />, color: 'bg-blue-500', link: '/presupuestos' },
    { titulo: 'Clientes Registrados', valor: metricas.clientes, icono: <Users size={24} />, color: 'bg-orange-500', link: '/clientes' },
    { titulo: 'Materiales en Catálogo', valor: metricas.materiales, icono: <Wrench size={24} />, color: 'bg-gray-700', link: '/materiales' }
  ];

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 animate-pulse">Cargando métricas del sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          Panel Principal
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Resumen general del estado del taller.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {tarjetas.map((t, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 md:border-gray-200 p-5 md:p-6 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className={`p-3 rounded-lg text-white shadow-sm ${t.color}`}>
                {t.icono}
              </div>
            </div>
            
            <h3 className="text-gray-500 text-xs md:text-sm font-medium uppercase tracking-wide">
              {t.titulo}
            </h3>
            <p className="text-3xl md:text-4xl font-extrabold text-gray-800 my-1 md:my-2">
              {t.valor}
            </p>
            
            <Link 
              to={t.link} 
              className="mt-auto pt-3 md:pt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 w-max transition-colors"
            >
              Ver detalles <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}