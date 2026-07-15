# Arquitectura del Sistema y Modelado de Datos

El sistema sigue una arquitectura Cliente-Servidor separando la lógica de presentación (React) de la lógica de negocio y acceso a datos (Node.js + Prisma + PostgreSQL).

## Estructura de Entidades Principales (Borrador Prisma)

La base de datos relacional se estructura en torno a los siguientes modelos centrales:

### `Material`
Almacena el catálogo de insumos.
* Campos clave: `id`, `descripcion`, `unidad_medida`, `precio_base`, `tiene_iva`, `precio_final`, `fecha_actualizacion`.

### `Cliente` y `Proveedor`
Gestionan las entidades comerciales para las cuentas corrientes.
* Campos clave: `id`, `nombre`, `contacto`, `direccion`.

### `OrdenTrabajo` (Presupuestos)
Agrupa los items de un trabajo y calcula totales.
* Campos clave: `id`, `clienteId`, `fecha`, `estado` (Pendiente, En Curso, Terminado), `total_materiales`, `total_mano_obra`, `monto_total`.
* Relaciones: Contiene múltiples `ItemOrdenTrabajo` (relación con `Material` y `cantidad`).

### `Transaccion` (Caja Diaria y Cuentas Corrientes)
Tabla central inmutable para registrar movimientos de dinero.
* Campos clave: `id`, `fecha`, `tipo` (Ingreso, Egreso), `monto`, `categoria`, `descripcion`, `clienteId` (opcional), `proveedorId` (opcional), `ordenTrabajoId` (opcional).
* Lógica: Si una transacción tiene un `clienteId`, afecta el saldo de su cuenta corriente. Si la categoría es "Retiro Dueño", se filtra para el reporte personal.

## Conexión a Base de Datos (Prisma Adapter)
Debido a los estándares recientes de Prisma, la conexión a PostgreSQL no se realiza directamente desde el archivo `schema.prisma`. 
* Se utiliza el driver nativo `pg` junto con `@prisma/adapter-pg`.
* La instancia del cliente de base de datos se exporta como un singleton desde `src/prisma.ts` para evitar la saturación del pool de conexiones en el entorno de desarrollo.
* La URL de conexión se gestiona estrictamente a través de variables de entorno en el archivo `.env` y se mapea mediante `prisma.config.ts`.

## Consideraciones de la API (Endpoints Planificados)
* `GET /api/caja/saldo` -> Calcula el saldo actual sumando ingresos y restando egresos.
* `GET /api/clientes/deudas` -> Devuelve un arreglo con los clientes cuyo saldo deudor sea mayor a 0 (El reporte más solicitado).
* `POST /api/ordenes` -> Recibe un array de materiales, calcula el coeficiente 2.5 y genera la orden.

## Estructura del Backend
El servidor está construido con **Express.js** sobre Node.js, utilizando módulos ESM.
* **Punto de entrada:** `src/index.ts`
* **Ejecución en desarrollo:** Se utiliza `tsx watch` para recarga en caliente y compilación de TypeScript al vuelo.
* **CORS:** Habilitado globalmente para permitir futuras peticiones desde el frontend en React.