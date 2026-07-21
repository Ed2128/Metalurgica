import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, Users, Wrench, FileText, DollarSign, LogOut, Menu, X } from 'lucide-react';
import Clientes from './Clientes';
import Materiales from './Materiales';
import Presupuestos from './Presupuestos';
import Caja from './Caja';
import Login from './Login';
import Inicio from './Inicio';

// ==========================================
// ESTRUCTURA PRINCIPAL (Menú Responsive + Pantallas)
// ==========================================
function SistemaLayout({ onLogout, nombreUsuario }: { onLogout: () => void, nombreUsuario: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // Ahora useLocation es seguro porque este componente vive DENTRO del Router
  const location = useLocation();
  
  const menu = [
    { name: 'Inicio', path: '/', icon: <Home size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Materiales', path: '/materiales', icon: <Wrench size={20} /> },
    { name: 'Presupuestos', path: '/presupuestos', icon: <FileText size={20} /> },
    { name: 'Caja Diaria', path: '/caja', icon: <DollarSign size={20} /> },
  ];

  return (
    // En celular se apila (col), en PC se pone lado a lado (row)
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      
      {/* 1. BARRA SUPERIOR (SOLO EN MÓVIL) */}
      <div className="md:hidden bg-gray-900 text-white flex items-center justify-between p-4 shadow-md print:hidden w-full z-10">
        <h2 className="text-xl font-bold text-blue-400">Metalúrgica 41 40</h2>
        <button 
          onClick={() => setMenuAbierto(true)} 
          className="p-2 text-gray-300 hover:text-white bg-gray-800 rounded-md focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 2. OVERLAY OSCURO (SOLO EN MÓVIL) */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm print:hidden" 
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* 3. SIDEBAR (PANEL LATERAL) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col min-h-screen print:hidden shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Cabecera del Sidebar */}
        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-blue-400">Metalúrgica 41 40</h2>
            <p className="text-gray-400 text-xs mt-1">Gestión de Taller</p>
          </div>
          <button 
            onClick={() => setMenuAbierto(false)} 
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={() => setMenuAbierto(false)} // Esconde el menú al hacer clic en móvil
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Usuario y Salir */}
        <div className="p-4 bg-gray-800 mt-auto border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-medium text-white truncate">{nombreUsuario}</p>
              <p className="text-xs text-green-400">En línea</p>
            </div>
            <button 
              onClick={onLogout} 
              title="Cerrar Sesión" 
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTENIDO PRINCIPAL (RUTAS) */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/materiales" element={<Materiales />} />
          <Route path="/presupuestos" element={<Presupuestos />} />
          <Route path="/caja" element={<Caja />} />
        </Routes>
      </main>
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

  // SI HAY TOKEN, INICIAMOS EL ROUTER Y EL SISTEMA
  return (
    <Router>
      <SistemaLayout onLogout={cerrarSesion} nombreUsuario={nombre} />
    </Router>
  );
}