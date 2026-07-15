import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Users, Activity } from 'lucide-react';

export default function Inicio() {
  const [deudores, setDeudores] = useState<any[]>([]);

  useEffect(() => {
    const cargarDeudores = async () => {
      try {
        const respuesta = await fetch('http://localhost:3000/api/reportes/deudores');
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setDeudores(datos);
        }
      } catch (error) {
        console.error("Error al cargar el reporte de deudores:", error);
      }
    };
    cargarDeudores();
  }, []);

  // Calculamos la deuda total sumando los saldos pendientes
  const deudaTotal = deudores.reduce((sum, cliente) => sum + cliente.saldo_pendiente, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Activity className="text-blue-600" size={32} />
        Panel de Control
      </h1>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total a Cobrar</p>
            <h3 className="text-2xl font-bold text-gray-800">${deudaTotal.toLocaleString('es-AR')}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Clientes con Deuda</p>
            <h3 className="text-2xl font-bold text-gray-800">{deudores.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estado del Taller</p>
            <h3 className="text-2xl font-bold text-gray-800">Operativo</h3>
          </div>
        </div>
      </div>

      {/* Tabla de Deudores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 text-lg">Atención Requerida: Saldos Pendientes</h3>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Contacto</th>
              <th className="p-4 font-semibold text-right">Total Trabajos</th>
              <th className="p-4 font-semibold text-right">Pagos a Cuenta</th>
              <th className="p-4 font-semibold text-right text-red-600">Saldo Deudor</th>
            </tr>
          </thead>
          <tbody>
            {deudores.map((cliente) => (
              <tr key={cliente.clienteId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{cliente.nombre}</td>
                <td className="p-4 text-gray-600">{cliente.contacto || '-'}</td>
                <td className="p-4 text-right text-gray-600">${Number(cliente.total_trabajos).toLocaleString('es-AR')}</td>
                <td className="p-4 text-right text-green-600">${Number(cliente.total_pagos).toLocaleString('es-AR')}</td>
                <td className="p-4 text-right font-bold text-red-600">
                  ${Number(cliente.saldo_pendiente).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
            {deudores.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <TrendingUp size={48} className="text-green-400 mb-3" />
                    <p className="text-lg font-medium text-gray-700">¡Todo al día!</p>
                    <p>No hay clientes con saldos pendientes actualmente.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}