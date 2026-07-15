import 'dotenv/config'; // Forzamos la carga de variables de entorno AQUÍ mismo
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// Escudo de seguridad: si no encuentra la URL, frena el programa con un mensaje claro
if (!connectionString) {
  throw new Error("CRÍTICO: No se encontró DATABASE_URL. Verifica que el archivo .env exista y esté bien escrito.");
}

// Configuramos el Pool de conexiones
const pool = new pg.Pool({ connectionString });

// Creamos el adaptador
const adapter = new PrismaPg(pool);

// Pasamos el adaptador al constructor
const globalForPrisma = globalThis as unknown as {
  prisma: typeof PrismaClient.prototype | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;