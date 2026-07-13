# Sistema de Gestión Financiera - Taller Metalúrgico 40 41

## Descripción
Aplicación web diseñada para centralizar, automatizar y gestionar las finanzas y presupuestos de un taller metalúrgico. El sistema reemplaza el uso de múltiples planillas de Excel aisladas, permitiendo la generación de presupuestos precisos, el control de la caja diaria, el seguimiento de cuentas corrientes de clientes/proveedores y la separación nítida entre los ingresos del negocio y los retiros personales del dueño.

## Tecnologías Utilizadas
* **Frontend:** React
* **Backend:** Node.js
* **Base de Datos:** PostgreSQL
* **ORM:** Prisma
* **Control de Versiones:** Git / GitHub

## Requisitos Previos
* Node.js (v18 o superior)
* PostgreSQL instalado y en ejecución
* Terminal compatible (PowerShell / Git Bash)

## Instalación y Configuración Local
1. Clonar el repositorio:
   `git clone [URL_DEL_REPOSITORIO]`
2. Instalar las dependencias del proyecto:
   `npm install`
3. Configurar las variables de entorno:
   Copiar el archivo `.env.example` a `.env` y configurar la URL de la base de datos PostgreSQL.
4. Ejecutar las migraciones de Prisma para generar las tablas:
   `npx prisma migrate dev`
5. Levantar el servidor de desarrollo:
   `npm run dev`

## Desarrollador
* **Eduardo Navarro**