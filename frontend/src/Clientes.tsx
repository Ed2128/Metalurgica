import { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Pencil, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2'; // Importamos SweetAlert2
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [direccion, setDireccion] = useState('');

 const cargarClientes = async () => {
    try {
      let token = localStorage.getItem('token') || '';
      token = token.replace(/^"|"$/g, '');

      const res = await fetch(`${API_URL}/clientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const datos = await res.json();
        setClientes(datos);
      } else {
        setClientes([]); // Evita el pantallazo blanco
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientes([]);
    }
  };
  useEffect(() => {
    cargarClientes();
  }, []);

  const limpiarFormulario = () => {
    setIdEdicion(null);
    setNombre('');
    setContacto('');
    setDireccion('');
  };

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const metodo = idEdicion ? 'PUT' : 'POST';
    // ✅ CORRECTO: Usando comillas invertidas y la variable API_URL
    const url = idEdicion 
      ? `${API_URL}/clientes/${idEdicion}` 
      : `${API_URL}/clientes`;

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` 
        },
        body: JSON.stringify({ nombre, contacto, direccion })
      });
      if (respuesta.ok) {
        cargarClientes();
        limpiarFormulario();
        
        Swal.fire({
          title: idEdicion ? '¡Cliente Actualizado!' : '¡Cliente Guardado!',
          text: idEdicion ? 'Los cambios se guardaron con éxito.' : 'El cliente se registró en el sistema.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar la información del cliente.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    }
  };

  const iniciarEdicion = (cli: any) => {
    setIdEdicion(cli.id);
    setNombre(cli.nombre);
    setContacto(cli.contacto || '');
    setDireccion(cli.direccion || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarCliente = async (id: number) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminarán los datos de contacto. No podrás revertir esto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const respuesta = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/^"|"$/g, '')}` 
        }
      });
      if (respuesta.ok) {
        cargarClientes();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El cliente ha sido borrado.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      } else {
        const error = await respuesta.json();
        Swal.fire({
          title: 'No se pudo eliminar',
          text: error.error || "El cliente tiene un historial activo que impide su borrado.",
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
    }
  };

  const clientesFiltrados = clientes.filter((cli) => {
    const termino = busqueda.toLowerCase();
    const coincideNombre = cli.nombre.toLowerCase().includes(termino);
    const coincideContacto = cli.contacto ? cli.contacto.toLowerCase().includes(termino) : false;
    return coincideNombre || coincideContacto;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Users className="text-blue-600" size={32} />
        Gestión de Clientes
      </h1>

      <div className={`p-4 md:p-6 rounded-xl shadow-sm border transition-colors ${idEdicion ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <UserPlus size={20} />
            {idEdicion ? 'Editando Cliente Existente' : 'Agregar Nuevo Cliente'}
          </h2>
          {idEdicion && (
            <button type="button" onClick={limpiarFormulario} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm">
              <X size={16} /> <span className="hidden sm:inline">Cancelar edición</span>
            </button>
          )}
        </div>

        {/* Formulario en CSS Grid responsivo */}
        <form onSubmit={guardarCliente} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">Nombre o Empresa</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Ej. Juan Pérez" />
          </div>
          <div className="w-full">
            <label className="block text-sm text-gray-600 mb-1">Teléfono / Contacto</label>
            <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Ej. 3764-123456" />
          </div>
          <div className="w-full">
            <label className="block text-sm text-gray-600 mb-1">Dirección (Opcional)</label>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Ej. Av. Uruguay 123" />
          </div>
          <button type="submit" className={`w-full ${idEdicion ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2.5 md:py-2 px-6 rounded-md transition-colors h-auto md:h-[42px]`}>
            {idEdicion ? 'Actualizar' : 'Guardar Cliente'}
          </button>
        </form>
      </div>

      {/* Contenedor de la tabla y buscador */}
      <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden">
        <div className="p-0 md:p-4 mb-4 md:mb-0 border-none md:border-b border-gray-200 bg-transparent md:bg-gray-50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" placeholder="Buscar cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm md:shadow-none"
            />
          </div>
        </div>

        {/* Tabla transformada a tarjetas en móvil */}
        <table className="w-full text-left border-collapse block md:table">
          <thead className="hidden md:table-header-group">
            <tr className="bg-white border-b border-gray-200 text-sm text-gray-600 uppercase">
              <th className="p-4 font-semibold w-16">ID</th>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Contacto</th>
              <th className="p-4 font-semibold">Dirección</th>
              <th className="p-4 font-semibold text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {clientesFiltrados.map((cli) => (
              <tr key={cli.id} className="block md:table-row border border-gray-200 md:border-b md:border-gray-100 hover:bg-gray-50 bg-white mb-4 rounded-lg shadow-sm md:shadow-none md:mb-0 overflow-hidden">
                <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-gray-500">
                  <span className="md:hidden font-bold text-gray-500 text-xs uppercase">ID</span>
                  <span>#{cli.id}</span>
                </td>
                <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none font-medium text-gray-800">
                  <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Nombre</span>
                  <span className="text-right md:text-left truncate ml-4 md:ml-0">{cli.nombre}</span>
                </td>
                <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-gray-600">
                  <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Contacto</span>
                  <span className="text-right md:text-left">{cli.contacto || '-'}</span>
                </td>
                <td className="flex md:table-cell justify-between items-center p-4 border-b border-gray-100 md:border-none text-gray-600">
                  <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Dirección</span>
                  <span className="text-right md:text-left truncate max-w-[200px] md:max-w-none">{cli.direccion || '-'}</span>
                </td>
                <td className="flex md:table-cell justify-between items-center p-4 text-center bg-gray-50 md:bg-transparent">
                  <span className="md:hidden font-bold text-gray-500 text-xs uppercase">Acciones</span>
                  <div className="flex items-center justify-end md:justify-center gap-4 md:gap-3">
                    <button onClick={() => iniciarEdicion(cli)} className="text-gray-500 hover:text-orange-500 transition-colors p-2 md:p-0 bg-white md:bg-transparent rounded shadow md:shadow-none border md:border-none" title="Editar">
                      <Pencil size={20} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <button onClick={() => eliminarCliente(cli.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2 md:p-0 bg-white md:bg-transparent rounded shadow md:shadow-none border md:border-none" title="Eliminar">
                      <Trash2 size={20} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr className="block md:table-row bg-white rounded-lg border border-gray-200 md:border-none shadow-sm md:shadow-none">
                <td colSpan={5} className="p-8 text-center text-gray-500 block md:table-cell">
                  {busqueda ? 'No se encontró ningún cliente con esos datos.' : 'No hay clientes registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}