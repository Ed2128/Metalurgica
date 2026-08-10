import { useState, useEffect } from 'react';
import { CalendarDays, AlertCircle, Clock, ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ResumenSemanal() {
  const [datos, setDatos] = useState<any>({ pendientesDeCobro: [], historialAgrupado: {} });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        let token = localStorage.getItem('token') || '';
        token = token.replace(/^"|"$/g, '');

        const respuesta = await fetch(`${API_URL}/resumen-semanal`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (respuesta.ok) {
          const resultado = await respuesta.json();
          setDatos(resultado);
        }
      } catch (error) {
        console.error("Error al cargar el resumen:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarResumen();
  }, []);

  // Función para formatear fechas (De "2026-08-10" a "Lunes 10 de Agosto")
  const formatearFecha = (fechaStr: string) => {
    // Le agregamos 'T12:00:00' para evitar que la zona horaria lo corra un día atrás
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(`${fechaStr}T12:00:00`).toLocaleDateString('es-AR', opciones);
  };

  if (cargando) {
    return <div className="p-8 text-center text-gray-500 font-medium">Cargando resumen de la semana...</div>;
  }

  const fechas = Object.keys(datos.historialAgrupado).sort((a, b) => b.localeCompare(a)); // Fechas más nuevas primero

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto p-4 md:p-6">
      
      {/* Encabezado */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
        <CalendarDays className="text-blue-600" size={32} />
        Resumen Semanal
      </h1>

      {/* SECCIÓN 1: Trabajos Pendientes de Cobro */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 md:p-6 rounded-r-xl shadow-sm">
        <h2 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-4">
          <AlertCircle size={24} />
          Clientes Pendientes de Cobro
        </h2>
        
        {datos.pendientesDeCobro.length === 0 ? (
          <p className="text-orange-700 flex items-center gap-2 font-medium">
            <CheckCircle2 size={18} /> ¡Excelente! No tienes pagos atrasados.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datos.pendientesDeCobro.map((pendiente: any) => (
              <div key={pendiente.id} className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">{pendiente.cliente}</span>
                    <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase flex items-center gap-1">
                      <Clock size={12} /> Esperando
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pendiente.descripcion}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                  <span className="text-xs text-gray-400">{new Date(pendiente.fecha).toLocaleDateString('es-AR')}</span>
                  <span className="font-extrabold text-orange-600 text-lg">${Number(pendiente.monto).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: Historial Agrupado por Día y Categoría */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Movimientos de los últimos 7 días</h2>
        
        {fechas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
            No se registraron movimientos en la última semana.
          </div>
        ) : (
          <div className="space-y-6">
            {fechas.map((fecha) => (
              <div key={fecha} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Cabecera del Día */}
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <h3 className="font-bold text-gray-700 capitalize">{formatearFecha(fecha)}</h3>
                </div>
                
                {/* Agrupación por Categorías dentro de ese Día */}
                <div className="p-4 space-y-5">
                  {Object.keys(datos.historialAgrupado[fecha]).map((categoria) => {
                    const transaccionesCategoria = datos.historialAgrupado[fecha][categoria];
                    
                    // Calculamos el total de esa categoría ese día
                    const totalCategoria = transaccionesCategoria.reduce((acc: number, t: any) => 
                      t.tipo === 'Ingreso' ? acc + Number(t.monto) : acc - Number(t.monto)
                    , 0);

                    return (
                      <div key={categoria} className="pl-2 border-l-2 border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm md:text-base">{categoria}</h4>
                          <span className={`font-bold text-sm ${totalCategoria >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalCategoria >= 0 ? '+' : '-'}${Math.abs(totalCategoria).toLocaleString('es-AR')}
                          </span>
                        </div>
                        
                        <ul className="space-y-2 mt-2">
                          {transaccionesCategoria.map((t: any) => (
                            <li key={t.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-md">
                              <div className="flex items-center gap-2 text-gray-600">
                                {t.tipo === 'Ingreso' ? <ArrowUpCircle size={14} className="text-green-500" /> : <ArrowDownCircle size={14} className="text-red-500" />}
                                <span>{t.descripcion || 'Sin detalle'}</span>
                              </div>
                              <span className="font-medium text-gray-700">${Number(t.monto).toLocaleString('es-AR')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}