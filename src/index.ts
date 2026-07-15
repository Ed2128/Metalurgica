import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js'; // En módulos ESM, TypeScript requiere la extensión .js aquí

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Permite al servidor entender formato JSON

// --- RUTAS DE LA API ---

// Ruta de prueba: Consultar todos los materiales del catálogo
app.get('/api/materiales', async (req, res) => {
  try {
    const materiales = await prisma.material.findMany();
    res.json(materiales);
  } catch (error) {
    console.error("Error en /api/materiales:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar la base de datos' });
  }
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});