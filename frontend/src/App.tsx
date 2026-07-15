import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Package, FileText, DollarSign, Users } from 'lucide-react';

import Materiales from './Materiales'; // <-- Importación de Materiales
import Clientes from './Clientes';     // <-- Importación de Clientes

// Componente del Menú Lateral
function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'bg-gray-800 border-l-4 border-blue-500' : 'hover:bg-gray-800';

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-gray-800 flex items-center gap-3">
        <span className="text-blue-500">⚙️</span>
        Taller App
      </div>
      
      <nav className="flex-1 py-4">
        <Link to="/" className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/')}`}>
          <Home size={20} />
          <span>Inicio</span>
        </Link>
        <Link to="/materiales" className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/materiales')}`}>
          <Package size={20} />
          <span>Materiales</span>
        </Link>
        <Link to="/presupuestos" className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/presupuestos')}`}>
          <FileText size={20} />
          <span>Presupuestos</span>
        </Link>
        <Link to="/caja" className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/caja')}`}>
          <DollarSign size={20} />
          <span>Caja y Cobros</span>
        </Link>
        <Link to="/clientes" className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/clientes')}`}>
          <Users size={20} />
          <span>Clientes</span>
        </Link>
      </nav>
    </div>
  );
}

// Pantalla de Inicio Temporal
function Inicio() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido al Sistema</h1>
      <p className="text-gray-600">Selecciona una opción del menú lateral para comenzar.</p>
    </div>
  );
}

// Componente Principal que envuelve todo
export default function App() {
  return (
    <Router>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Inicio />} />
            
            {/* 👇 Rutas conectadas a los archivos reales 👇 */}
            <Route path="/materiales" element={<Materiales />} />
            <Route path="/clientes" element={<Clientes />} />
            
            <Route path="/presupuestos" element={<h1 className="text-2xl font-bold">Módulo de Presupuestos (Próximamente)</h1>} />
            <Route path="/caja" element={<h1 className="text-2xl font-bold">Módulo de Caja (Próximamente)</h1>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}