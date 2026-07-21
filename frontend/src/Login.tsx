import { useState } from 'react';
import { Lock, Wrench } from 'lucide-react';
import Swal from 'sweetalert2';

interface LoginProps {
  onLogin: (token: string, nombre: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 const manejarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ¡OJO AQUÍ! Nada de comillas alrededor de import.meta.env.VITE_API_URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    try {
      const respuesta = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        // Le pasamos el token y el nombre al componente principal (App)
        onLogin(datos.token, datos.nombre);
        Swal.fire({
          title: '¡Bienvenido!',
          text: `Hola de nuevo, ${datos.nombre}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: 'Acceso Denegado',
          text: datos.error || 'Credenciales incorrectas.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo contactar al servidor.',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 sm:bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg sm:max-w-md w-full border border-gray-100 sm:border-gray-200">
        
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="bg-blue-600 p-3 sm:p-4 rounded-full text-white mb-4 shadow-md">
            <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
            Taller Metalúrgico
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={manejarAcceso} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo Electrónico
            </label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 sm:p-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" 
              placeholder="admin@metalurgica.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 sm:p-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-sm font-semibold py-3 sm:py-2.5 rounded-lg transition-colors shadow-md mt-4"
          >
            <Lock size={18} /> Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
}