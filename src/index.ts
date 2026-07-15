import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- RUTAS DE MATERIALES ---

// 1. Obtener todos los materiales (Ya lo teníamos)
app.get('/api/materiales', async (req, res) => {
  try {
    const materiales = await prisma.material.findMany();
    res.json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar la base de datos' });
  }
});

// 2. Crear un nuevo material (Con impuestos dinámicos)
app.post('/api/materiales', async (req, res) => {
  try {
    // Extraemos los datos del body, permitiendo que ingresen los impuestos
    // Asignamos valores por defecto solo por si el frontend decide no enviarlos
    const { 
      descripcion, 
      unidad_medida, 
      precio_base, 
      tiene_iva_incluido,
      porcentaje_iva = 0.21,     // 21%
      porcentaje_iibb = 0.0331,  // 3.31%
      porcentaje_muni = 0.008    // 0.80%
    } = req.body;

    // LÓGICA DE NEGOCIO: Impuestos dinámicos
    let precio_final = precio_base;
    
    // Si el precio se ingresa "Sin IVA", sumamos los porcentajes recibidos
    if (!tiene_iva_incluido) {
      const recargoTotal = porcentaje_iva + porcentaje_iibb + porcentaje_muni;
      precio_final = precio_base + (precio_base * recargoTotal);
    }

    // Insertamos el registro
    const nuevoMaterial = await prisma.material.create({
      data: {
        descripcion,
        unidad_medida,
        precio_base,
        tiene_iva_incluido,
        precio_final
      }
    });

    res.status(201).json(nuevoMaterial);
  } catch (error) {
    console.error("Error al crear material:", error);
    res.status(500).json({ error: 'Hubo un problema al guardar el material' });
  }
});


// --- RUTAS DE CLIENTES ---

// 3. Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre, contacto, direccion } = req.body;

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        contacto,
        direccion
      }
    });

    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res.status(500).json({ error: 'Hubo un problema al guardar el cliente' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});