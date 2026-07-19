import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, Users, Wrench, FileText, DollarSign, LogOut } from 'lucide-react';
import Clientes from './Clientes';
import Materiales from './Materiales';
import Presupuestos from './Presupuestos';
import Caja from './Caja';
import Login from './Login';
import Inicio from './Inicio';
// ==========================================
// COMPONENTE DEL MENÚ LATERAL (Sidebar)
// ==========================================
function Sidebar({ onLogout, nombreUsuario }: { onLogout: () => void, nombreUsuario: string }) {
  const location = useLocation();
  
  const menu = [
    { name: 'Inicio', path: '/', icon: <Home size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Materiales', path: '/materiales', icon: <Wrench size={20} /> },
    { name: 'Presupuestos', path: '/presupuestos', icon: <FileText size={20} /> },
    { name: 'Caja Diaria', path: '/caja', icon: <DollarSign size={20} /> },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen print:hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-blue-400">Metalúrgica 41 40</h2>
        <p className="text-gray-400 text-xs mt-1">Gestión de Taller</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Panel inferior con datos del usuario y botón de salir */}
      <div className="p-4 bg-gray-800 mt-auto border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-sm font-medium text-white truncate">{nombreUsuario}</p>
            <p className="text-xs text-green-400">En línea</p>
          </div>
          <button onClick={onLogout} title="Cerrar Sesión" className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// APLICACIÓN PRINCIPAL (Controlador de Sesión)
// ==========================================
export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [nombre, setNombre] = useState<string>(localStorage.getItem('nombre') || '');

  // Función que se ejecuta cuando el Login es exitoso
  const iniciarSesion = (nuevoToken: string, nombreUsuario: string) => {
    localStorage.setItem('token', nuevoToken);
    localStorage.setItem('nombre', nombreUsuario);
    setToken(nuevoToken);
    setNombre(nombreUsuario);
  };

  // Función para cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    setToken(null);
    setNombre('');
  };

  // SI NO HAY TOKEN, SOLO MOSTRAMOS EL LOGIN
  if (!token) {
    return <Login onLogin={iniciarSesion} />;
  }

  // SI HAY TOKEN, MOSTRAMOS EL SISTEMA
  return (
    <Router>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar onLogout={cerrarSesion} nombreUsuario={nombre} />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/materiales" element={<Materiales />} />
            <Route path="/presupuestos" element={<Presupuestos />} />
            <Route path="/caja" element={<Caja />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}