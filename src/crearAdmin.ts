import bcrypt from 'bcrypt';
// Importamos el Prisma que ya configuraste para tu backend
import { prisma } from './prisma'; // (Si lo exportaste por defecto, quita las llaves { })

async function main() {
  console.log("Conectando a Neon...");
  
  const passwordHash = await bcrypt.hash('admin', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@metalurgica.com' },
    update: {},
    create: {
      email: 'admin@metalurgica.com',
      password: passwordHash,
      nombre: 'Administrador',
    },
  });

  console.log('¡ÉXITO! Usuario creado en la nube:', admin.email);
}

main()
  .catch((e) => {
    console.error("\n❌ ERROR AL CREAR EL USUARIO:");
    console.error(e);
    process.exit(1);
  });