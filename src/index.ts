import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// 2. MIDDLEWARE DE SEGURIDAD (Con depuración)
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'clave_por_defecto';

const verificarToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  
  // Extraemos el token después de la palabra "Bearer "
  let token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    console.log("❌ Rechazado: No se recibió ningún token de React.");
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  // LIMPIEZA EXTREMA: Quitamos espacios ocultos o comillas que puedan romper la matemática
  token = token.trim().replace(/^"|"$/g, '');

  jwt.verify(token, JWT_SECRET, (err: any, usuarioDecodificado: any) => {
    if (err) {
      // ESTO ES LO QUE QUEREMOS VER EN LA TERMINAL
      console.log("❌ Token rechazado por JWT. Motivo exacto:", err.message);
      return res.status(401).json({ error: 'Token inválido.', detalle: err.message });
    }
    
    // Si la matemática coincide, le abrimos la puerta
    req.usuario = usuarioDecodificado;
    next(); 
  });
};
// ==========================================
//  RUTAS DE AUTENTICACIÓN 
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    const passwordEncriptada = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({ data: { email, password: passwordEncriptada, nombre } });
    res.json({ message: 'Administrador creado con éxito', email: usuario.email });
  } catch (error) {
    res.status(400).json({ error: 'El correo ya está registrado o hubo un error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, nombre: usuario.nombre });
  } catch (error) {
    console.error(error); // Para ver el error real en la terminal si algo más falla
    res.status(500).json({ error: 'Error en el servidor al intentar iniciar sesión' });
  }
});
// --- RUTAS DE MATERIALES ---

// 1. Obtener todos los materiales
app.get('/api/materiales', verificarToken, async (req, res) => {
  try {
    const materiales = await prisma.material.findMany({
      orderBy: { id: 'desc' } // Los más nuevos arriba
    });
    res.json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar la base de datos' });
  }
});

// 2. Crear un nuevo material (Recibe los impuestos calculados del frontend)
app.post('/api/materiales', verificarToken, async (req, res) => {
  try {
    const { 
      descripcion, 
      unidad_medida, 
      cantidad, 
      precio_unitario, 
      precio_base, 
      iva, 
      percepcion_ib, 
      seg_hig, 
      precio_final 
    } = req.body;

    const nuevoMaterial = await prisma.material.create({
      data: {
        descripcion,
        unidad_medida,
        cantidad,
        precio_unitario,
        precio_base,
        iva,
        percepcion_ib,
        seg_hig,
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
app.put('/api/materiales/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      descripcion, 
      unidad_medida, 
      cantidad, 
      precio_unitario, 
      precio_base, 
      iva, 
      percepcion_ib, 
      seg_hig, 
      precio_final 
    } = req.body;

    const materialActualizado = await prisma.material.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        unidad_medida,
        cantidad,
        precio_unitario,
        precio_base,
        iva,
        percepcion_ib,
        seg_hig,
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
app.delete('/api/materiales/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.material.delete({ where: { id: Number(id) } });
    res.json({ message: 'Material eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ error: 'Hubo un problema al eliminar el material. Verifica que no esté siendo usado en un presupuesto.' });
  }
});

// 2.3. Carga masiva desde Excel (Bulk Insert)
app.post('/api/materiales/bulk', verificarToken, async (req, res) => {
  try {
    const materialesExcel = req.body;

    // Como el frontend ahora procesa los impuestos del Excel, solo los mapeamos 
    // y los forzamos a ser números por seguridad antes de guardarlos.
    const dataParaInsertar = materialesExcel.map((m: any) => ({
      descripcion: String(m.descripcion),
      unidad_medida: String(m.unidad_medida || 'Kg'),
      cantidad: Number(m.cantidad) || 1,
      precio_unitario: Number(m.precio_unitario) || 0,
      precio_base: Number(m.precio_base) || 0,
      iva: Number(m.iva) || 0,
      percepcion_ib: Number(m.percepcion_ib) || 0,
      seg_hig: Number(m.seg_hig) || 0,
      precio_final: Number(m.precio_final) || 0
    }));

    const insertados = await prisma.material.createMany({
      data: dataParaInsertar,
      skipDuplicates: true
    });

    res.status(201).json({ message: `¡Éxito! Se importaron ${insertados.count} materiales al catálogo con sus impuestos desglosados.` });
  } catch (error) {
    console.error("Error en importación masiva:", error);
    res.status(500).json({ error: 'Hubo un problema al procesar el Excel' });
  }
});
// --- RUTAS DE CLIENTES ---

// 3. Crear un nuevo cliente
app.post('/api/clientes',verificarToken, async (req, res) => {
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
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Obtener todos los clientes
app.get('/api/clientes',verificarToken, async (req, res) => {
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
app.put('/api/clientes/:id',verificarToken, async (req, res) => {
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
app.delete('/api/clientes/:id',verificarToken, async (req, res) => {
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
app.post('/api/ordenes',verificarToken, async (req, res) => {
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
// Obtener historial de presupuestos/órdenes de trabajo
app.get('/api/ordenes',verificarToken, async (req, res) => {
  try {
    const ordenes = await prisma.ordenTrabajo.findMany({
      include: {
        cliente: true,
        items: {
          include: {
            material: true
          }
        }
      },
      orderBy: { id: 'desc' } // Los más recientes primero
    });
    res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar el historial de presupuestos' });
  }
});
// Eliminar un presupuesto usando Prisma
    app.delete('/api/ordenes/:id', verificarToken, async (req, res) => {
      try {
        // Prisma es estricto con los tipos, necesitamos que el ID sea número
        const id = Number(req.params.id);
        
        // 1. PRIMERO: Borramos los ítems asociados al presupuesto
        // ⚠️ ATENCIÓN: Asegúrate de que 'ordenItem' sea el nombre exacto de tu modelo en el schema.prisma
        // y que 'ordenId' sea el campo de la relación.
        await prisma.itemOrdenTrabajo.deleteMany({
          where: { ordenTrabajoId: id }
        });

        // 2. SEGUNDO: Ahora sí, borramos el presupuesto principal
        await prisma.ordenTrabajo.delete({
          where: { id: id }
        });

        res.json({ mensaje: 'Presupuesto eliminado correctamente' });
      } catch (error) {
        console.error("Error al eliminar el presupuesto:", error);
        
        // Si Prisma no encuentra el registro, podemos atrapar su error específico
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return res.status(404).json({ mensaje: 'Presupuesto no encontrado' });
        }
        
        res.status(500).json({ mensaje: 'Error interno al intentar eliminar' });
      }
    });
// --- RUTAS DE TRANSACCIONES (CAJA Y COBROS) ---

// 5. Registrar un nuevo movimiento de caja (Ingreso o Egreso)
app.post('/api/transacciones', verificarToken, async (req, res) => {
  try {
    const { tipo, monto, categoria, descripcion, clienteId, proveedorId, ordenTrabajoId, estado, cliente } = req.body;

    if (!tipo || !monto || !categoria) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const nuevaTransaccion = await prisma.transaccion.create({
      data: {
        tipo, monto, categoria, descripcion, clienteId, proveedorId, ordenTrabajoId,
        estado: estado || "COMPLETADO", 
        nombreCliente: cliente || null  // ✅ GUARDAMOS EN LA COLUMNA CORRECTA
      }
    });

    res.status(201).json(nuevaTransaccion);
  } catch (error) {
    console.error("Error al registrar transacción:", error);
    res.status(500).json({ error: 'Hubo un problema al guardar el movimiento' });
  }
});

// 5.1. Actualizar (Editar) un movimiento de caja
app.put('/api/transacciones/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, monto, categoria, descripcion, estado, cliente } = req.body;

    const transaccionActualizada = await prisma.transaccion.update({
      where: { id: Number(id) },
      data: { 
        tipo, monto, categoria, descripcion,
        estado: estado || "COMPLETADO",
        nombreCliente: cliente || null // ✅ GUARDAMOS EN LA COLUMNA CORRECTA
      }
    });
    res.json(transaccionActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Hubo un problema al actualizar el movimiento' });
  }
});

// 5.2. Eliminar un movimiento de caja
app.delete('/api/transacciones/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaccion.delete({ where: { id: Number(id) } });
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Hubo un problema al eliminar el movimiento' });
  }
});

// 6. Obtener el historial de la Caja Diaria y el Saldo Actual
app.get('/api/transacciones', verificarToken, async (req, res) => {
  try {
    const transacciones = await prisma.transaccion.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { select: { nombre: true } }, 
        proveedor: { select: { nombre: true } } 
      }
    });

    let saldo_actual = 0;
    
    const historialFormateado = transacciones.map((t: any) => {
      // Ignorar pagos pendientes en el cálculo
      if (t.estado !== 'PENDIENTE') {
        if (t.tipo === 'Ingreso') saldo_actual += t.monto;
        if (t.tipo === 'Egreso') saldo_actual -= t.monto;
      }

      // ✅ LECTURA SEGURA: Usamos el texto libre, y si no hay, buscamos en la relación oficial
      let nombreC = t.nombreCliente; 
      if (typeof t.cliente === 'object' && t.cliente !== null) {
        nombreC = t.cliente.nombre; 
      }

      return {
        ...t,
        cliente: nombreC
      };
    });

    res.json({
      saldo_actual,
      historial: historialFormateado
    });
  } catch (error) {
    console.error("Error al obtener la caja:", error);
    res.status(500).json({ error: 'Hubo un problema al consultar el historial' });
  }
});

// 7. Obtener el Resumen Semanal Agrupado
app.get('/api/resumen-semanal', verificarToken, async (req, res) => {
  try {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const transaccionesSemana = await prisma.transaccion.findMany({
      where: { fecha: { gte: hace7Dias } },
      orderBy: { fecha: 'desc' },
      include: { cliente: { select: { nombre: true } } } // Incluimos la relación por las dudas
    });

    const pendientesDeCobro: any[] = [];
    const historialAgrupado: any = {};

    transaccionesSemana.forEach((t: any) => {
      // ✅ LECTURA SEGURA DE NOMBRES
      const nombreCli = t.nombreCliente || (t.cliente && t.cliente.nombre ? t.cliente.nombre : 'Sin nombre');

      if (t.estado === 'PENDIENTE') {
        pendientesDeCobro.push({
          id: t.id,
          cliente: nombreCli,
          monto: t.monto,
          descripcion: t.descripcion || t.categoria,
          fecha: t.fecha
        });
        return; 
      }

      const fechaStr = new Date(t.fecha).toISOString().split('T')[0];

      if (!historialAgrupado[fechaStr]) {
        historialAgrupado[fechaStr] = {};
      }

      if (!historialAgrupado[fechaStr][t.categoria]) {
        historialAgrupado[fechaStr][t.categoria] = [];
      }

      historialAgrupado[fechaStr][t.categoria].push({
        id: t.id,
        tipo: t.tipo,
        monto: t.monto,
        descripcion: t.descripcion
      });
    });

    res.json({
      pendientesDeCobro,
      historialAgrupado
    });
  } catch (error) {
    console.error("Error al obtener resumen semanal:", error);
    res.status(500).json({ error: 'Hubo un problema al generar el resumen' });
  }
});

// 7. NUEVO: Obtener el Resumen Semanal Agrupado
app.get('/api/resumen-semanal', verificarToken, async (req, res) => {
  try {
    // Calculamos la fecha de hace 7 días exactos
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const transaccionesSemana = await prisma.transaccion.findMany({
      where: { fecha: { gte: hace7Dias } },
      orderBy: { fecha: 'desc' }
    });

    const pendientesDeCobro: any[] = [];
    const historialAgrupado: any = {};

    transaccionesSemana.forEach((t: any) => {
      const nombreCli = typeof t.cliente === 'object' && t.cliente !== null ? t.cliente.nombre : (t.cliente || 'Sin nombre');

      // A) Separar los pendientes de cobro
      if (t.estado === 'PENDIENTE') {
        pendientesDeCobro.push({
          id: t.id,
          cliente: nombreCli,
          monto: t.monto,
          descripcion: t.descripcion || t.categoria,
          fecha: t.fecha
        });
        return; // Importante: el return evita que el pendiente baje al agrupador de gastos
      }

      // B) Agrupar los movimientos completados por Día (Formato YYYY-MM-DD)
      const fechaStr = new Date(t.fecha).toISOString().split('T')[0];

      if (!historialAgrupado[fechaStr]) {
        historialAgrupado[fechaStr] = {};
      }

      // C) Agrupar por Categoría dentro del Día
      if (!historialAgrupado[fechaStr][t.categoria]) {
        historialAgrupado[fechaStr][t.categoria] = [];
      }

      historialAgrupado[fechaStr][t.categoria].push({
        id: t.id,
        tipo: t.tipo,
        monto: t.monto,
        descripcion: t.descripcion
      });
    });

    res.json({
      pendientesDeCobro,
      historialAgrupado
    });
  } catch (error) {
    console.error("Error al obtener resumen semanal:", error);
    res.status(500).json({ error: 'Hubo un problema al generar el resumen' });
  }
});

// --- RUTAS DE REPORTES ---

// 7. Reporte de Deudores (Clientes con saldo pendiente)
app.get('/api/reportes/deudores',verificarToken, async (req, res) => {
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