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

// 2.1. Actualizar (Editar) un material existente
app.put('/api/materiales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, unidad_medida, precio_base, tiene_iva_incluido } = req.body;

    // Recalculamos el precio final por si el usuario cambió el precio base o el IVA
    let precio_final = precio_base;
    if (!tiene_iva_incluido) {
      const porcentajeRecargo = 0.2511; // 21% + 3.31% + 0.80%
      precio_final = precio_base + (precio_base * porcentajeRecargo);
    }

    const materialActualizado = await prisma.material.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        unidad_medida,
        precio_base,
        tiene_iva_incluido,
        precio_final
      }
    });

    res.json(materialActualizado);
  } catch (error) {
    console.error("Error al actualizar material:", error);
    res.status(500).json({ error: 'Hubo un problema al actualizar el material' });
  }
});

// 2.2. Eliminar un material
app.delete('/api/materiales/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.material.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Material eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ error: 'Hubo un problema al eliminar el material. Verifica que no esté siendo usado en un presupuesto.' });
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

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { id: 'desc' } // Los ordenamos para que los más nuevos salgan arriba
    });
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar los clientes' });
  }
});

// 3.1. Actualizar (Editar) un cliente
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, direccion } = req.body;

    const clienteActualizado = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nombre, contacto, direccion }
    });
    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Hubo un problema al actualizar el cliente' });
  }
});

// 3.2. Eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cliente.delete({ where: { id: Number(id) } });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    // Si el cliente ya tiene un presupuesto o pago registrado, la base de datos protegerá el registro
    res.status(400).json({ error: 'No se puede eliminar un cliente que ya tiene presupuestos o pagos registrados.' });
  }
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
      const material = materialesDB.find((m: any) => m.id === item.materialId);
      
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

// --- RUTAS DE TRANSACCIONES (CAJA Y COBROS) ---

// 5. Registrar un nuevo movimiento de caja (Ingreso o Egreso)
app.post('/api/transacciones', async (req, res) => {
  try {
    const { 
      tipo,         // Obligatorio: "Ingreso" o "Egreso"
      monto,        // Obligatorio: Número positivo
      categoria,    // Obligatorio: "Retiro Dueño", "Pago Cliente", "Compra Insumos", etc.
      descripcion,  // Opcional
      clienteId,    // Opcional (Si es un cobro a un cliente)
      proveedorId,  // Opcional (Si es un pago a un proveedor)
      ordenTrabajoId// Opcional (Si el pago corresponde a un presupuesto específico)
    } = req.body;

    // Validación de seguridad básica
    if (!tipo || !monto || !categoria) {
      return res.status(400).json({ error: "Faltan campos obligatorios: tipo, monto o categoria." });
    }

    if (tipo !== "Ingreso" && tipo !== "Egreso") {
      return res.status(400).json({ error: "El tipo debe ser estrictamente 'Ingreso' o 'Egreso'." });
    }

    // Registramos el movimiento en la base de datos
    const nuevaTransaccion = await prisma.transaccion.create({
      data: {
        tipo,
        monto,
        categoria,
        descripcion,
        clienteId,
        proveedorId,
        ordenTrabajoId
      }
    });

    res.status(201).json(nuevaTransaccion);
  } catch (error) {
    console.error("Error al registrar transacción:", error);
    res.status(500).json({ error: 'Hubo un problema al guardar el movimiento de caja' });
  }
});
// 5.1. Actualizar (Editar) un movimiento de caja
app.put('/api/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, monto, categoria, descripcion } = req.body;

    const transaccionActualizada = await prisma.transaccion.update({
      where: { id: Number(id) },
      data: { tipo, monto, categoria, descripcion }
    });
    res.json(transaccionActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Hubo un problema al actualizar el movimiento' });
  }
});

// 5.2. Eliminar un movimiento de caja
app.delete('/api/transacciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaccion.delete({ where: { id: Number(id) } });
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Hubo un problema al eliminar el movimiento' });
  }
});
// 6. Obtener el historial de la Caja Diaria y el Saldo Actual
app.get('/api/transacciones', async (req, res) => {
  try {
    // Buscamos todas las transacciones, ordenadas de la más nueva a la más vieja
    const transacciones = await prisma.transaccion.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { select: { nombre: true } }, // Traemos el nombre del cliente si existe
        proveedor: { select: { nombre: true } } // Traemos el nombre del proveedor si existe
      }
    });

    // Calculamos el saldo iterando sobre el historial
    let saldo_actual = 0;
    transacciones.forEach((t: any) => {
      if (t.tipo === 'Ingreso') saldo_actual += t.monto;
      if (t.tipo === 'Egreso') saldo_actual -= t.monto;
    });

    // Devolvemos un objeto estructurado con el saldo ya procesado y la lista de movimientos
    res.json({
      saldo_actual,
      historial: transacciones
    });
  } catch (error) {
    console.error("Error al obtener la caja:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar el historial de caja' });
  }
});

// --- RUTAS DE REPORTES ---

// 7. Reporte de Deudores (Clientes con saldo pendiente)
app.get('/api/reportes/deudores', async (req, res) => {
  try {
    // Buscamos todos los clientes e incluimos sus trabajos y sus pagos
    const clientes = await prisma.cliente.findMany({
      include: {
        ordenes: true,
        transacciones: {
          where: { tipo: 'Ingreso' } // Solo nos importan los pagos/señas que hicieron
        }
      }
    });

   // Procesamos la matemática para cada cliente
    const reporteDeudores = clientes.map((cliente: any) => {
      // Le decimos a TypeScript que 'sum' empieza como número y 'orden'/'pago' pueden ser cualquier cosa
      const total_trabajos = cliente.ordenes.reduce((sum: number, orden: any) => sum + orden.monto_total, 0);
      const total_pagos = cliente.transacciones.reduce((sum: number, pago: any) => sum + pago.monto, 0);
      
      const saldo_pendiente = total_trabajos - total_pagos;

      return {
        clienteId: cliente.id,
        nombre: cliente.nombre,
        contacto: cliente.contacto,
        total_trabajos,
        total_pagos,
        saldo_pendiente
      };
    })
    // 4. Filtramos para devolver SOLO a los que nos deben plata
    .filter((cliente: any) => cliente.saldo_pendiente > 0);
    res.json(reporteDeudores);
  } catch (error) {
    console.error("Error al generar reporte de deudores:", error);
    res.status(500).json({ error: 'Hubo un problema al calcular las deudas' });
  }
});