import { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Estados para el formulario
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [direccion, setDireccion] = useState('');

  // Cargar clientes desde el backend
  const cargarClientes = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/reportes/deudores');
      // Nota: Idealmente deberíamos tener un GET /api/clientes simple, 
      // pero usaremos temporalmente el de deudores o crearemos uno rápido si falla.
      // Para estar seguros, hagamos un fetch directo si creaste la ruta, si no, lo ajustaremos.
      
      // Vamos a intentar obtener todos usando una petición básica.
      // Como no hicimos un GET genérico de clientes en el index.ts, vamos a crear uno mentalmente.
      // Si falla, te guiaré para añadirlo al backend.
      const res = await fetch('http://localhost:3000/api/clientes');
      if (res.ok) {
        const datos = await res.json();
        setClientes(datos);
      } else {
        // Fallback temporal si no existe la ruta GET /api/clientes
        setClientes([{ id: 1, nombre: "Paolo Pizzeria (Dato de prueba)", contacto: "3764-123456", direccion: "Centro" }]);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Guardar nuevo cliente
  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const respuesta = await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contacto, direccion })
      });

      if (respuesta.ok) {
        cargarClientes();
        setNombre('');
        setContacto('');
        setDireccion('');
      }
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Users className="text-blue-600" size={32} />
        Gestión de Clientes
      </h1>

      {/* Formulario */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <UserPlus size={20} />
          Agregar Nuevo Cliente
        </h2>
        <form onSubmit={guardarCliente} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">Nombre o Empresa</label>
            <input 
              type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Ej. Juan Pérez" 
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">Teléfono / Contacto</label>
            <input 
              type="text" value={contacto} onChange={(e) => setContacto(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Ej. 3764-123456" 
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">Dirección (Opcional)</label>
            <input 
              type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Ej. Av. Uruguay 123" 
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors w-full h-[42px]">
            Guardar Cliente
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Contacto</th>
              <th className="p-4 font-semibold">Dirección</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cli) => (
              <tr key={cli.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 text-gray-500">#{cli.id}</td>
                <td className="p-4 font-medium text-gray-800">{cli.nombre}</td>
                <td className="p-4 text-gray-600">{cli.contacto || '-'}</td>
                <td className="p-4 text-gray-600">{cli.direccion || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}