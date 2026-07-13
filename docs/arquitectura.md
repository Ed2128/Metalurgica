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

## Consideraciones de la API (Endpoints Planificados)
* `GET /api/caja/saldo` -> Calcula el saldo actual sumando ingresos y restando egresos.
* `GET /api/clientes/deudas` -> Devuelve un arreglo con los clientes cuyo saldo deudor sea mayor a 0 (El reporte más solicitado).
* `POST /api/ordenes` -> Recibe un array de materiales, calcula el coeficiente 2.5 y genera la orden.