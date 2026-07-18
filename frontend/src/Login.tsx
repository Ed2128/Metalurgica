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
    try {
      const respuesta = await fetch('http://localhost:3000/api/auth/login', {
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-blue-600 p-3 rounded-full text-white mb-3 shadow-sm">
            <Wrench size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">Taller Metalúrgico</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para acceder</p>
        </div>

        <form onSubmit={manejarAcceso} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" 
              placeholder="admin@metalurgica.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md mt-2"
          >
            <Lock size={18} /> Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
}