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

// --- RUTAS DE ÓRDENES DE TRABAJO ---

// 4. Crear un nuevo Presupuesto / Orden de Trabajo
app.post('/api/ordenes', async (req, res) => {
  try {
    // Recibimos el ID del cliente, los materiales que lleva el trabajo y el coeficiente
    const { 
      clienteId, 
      items, 
      coeficiente_mano_obra = 2.5 // Por defecto 2.5x, pero modificable si es necesario
    } = req.body;

    // Validación rápida
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "La orden debe tener al menos un material." });
    }

    // 1. Obtener los precios actuales de la base de datos para los materiales solicitados
    const materialIds = items.map((item: any) => item.materialId);
    const materialesDB = await prisma.material.findMany({
      where: { id: { in: materialIds } }
    });

    // 2. Calcular los costos
    let total_materiales = 0;
    
    const itemsParaGuardar = items.map((item: any) => {
      const material = materialesDB.find(m => m.id === item.materialId);
      
      if (!material) {
        throw new Error(`El material con ID ${item.materialId} no existe en el catálogo.`);
      }

      // Costo de este insumo específico (precio x cantidad)
      const costo_item = material.precio_final * item.cantidad;
      total_materiales += costo_item;

      return {
        materialId: material.id,
        cantidad: item.cantidad,
        precio_unitario: material.precio_final // CONGELAMOS el precio histórico aquí
      };
    });

    // Calculamos la mano de obra y el total a cobrar
    const total_mano_obra = total_materiales * coeficiente_mano_obra;
    const monto_total = total_materiales + total_mano_obra;

    // 3. Guardar todo junto en PostgreSQL (Prisma hace esto en una sola transacción segura)
    const nuevaOrden = await prisma.ordenTrabajo.create({
      data: {
        clienteId,
        total_materiales,
        total_mano_obra,
        monto_total,
        // Inserción anidada: Crea la orden y sus items al mismo tiempo
        items: {
          create: itemsParaGuardar
        }
      },
      include: {
        items: true // Le decimos a Prisma que nos devuelva la orden con sus items para verla
      }
    });

    res.status(201).json(nuevaOrden);
  } catch (error: any) {
    console.error("Error al crear la orden:", error);
    // Devolvemos el mensaje de error específico si es que falló nuestra validación
    res.status(500).json({ error: error.message || 'Hubo un problema al generar el presupuesto' });
  }
});