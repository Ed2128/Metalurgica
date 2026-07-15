export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border-t-4 border-blue-600">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Taller Metalúrgico
        </h1>
        <p className="text-gray-500 mb-6">
          Sistema de Gestión Financiera
        </p>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200 w-full">
          Conectar con el Backend
        </button>
      </div>
    </div>
  )
}