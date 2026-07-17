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
* `POST /api/transacciones` -> Registra un movimiento (Ingreso/Egreso) asociándolo opcionalmente a clientes u órdenes.
* `GET /api/transacciones` -> Devuelve el historial completo y el `saldo_actual` procesado al vuelo.

## Estructura del Backend
El servidor está construido con **Express.js** sobre Node.js, utilizando módulos ESM.
* **Punto de entrada:** `src/index.ts`
* **Ejecución en desarrollo:** Se utiliza `tsx watch` para recarga en caliente y compilación de TypeScript al vuelo.
* **CORS:** Habilitado globalmente para permitir futuras peticiones desde el frontend en React.

### Seguridad y Autenticación
* **Protección de API:** El sistema implementa un modelo de seguridad por tokens. Todas las rutas transaccionales están protegidas por un middleware de Express (`verificarToken`) que rechaza peticiones no firmadas (401/403).
* **Estándar:** Se utilizan **JSON Web Tokens (JWT)** con un tiempo de vida (TTL) de 8 horas para mantener las sesiones activas durante la jornada laboral.
* **Cifrado de Credenciales:** Las contraseñas nunca se almacenan en texto plano. Se emplea `bcryptjs` (factor de costo: 10) para aplicar un hash unidireccional, garantizando que una brecha en la base de datos no exponga las credenciales del administrador.
## Reportes
* `GET /api/reportes/deudores` -> Calcula el saldo pendiente de cada cliente cruzando el `monto_total` de sus `OrdenTrabajo` contra sus `Transaccion` de tipo "Ingreso". Filtra y devuelve solo los saldos mayores a 0.

## Estructura del Frontend
* **Tecnologías:** React + Vite + TypeScript.
* **Estilos:** Tailwind CSS v4.
* **Enrutamiento:** React Router DOM (estructura de Sidebar + Área de Contenido).
* **Módulos Activos:**
  * `Materiales`: Formulario y tabla de catálogo. Inyecta lógica de cálculo de tasas (25.11%) desde la UI hacia el backend.
  * `Presupuestos`: Combina Clientes y Materiales. Calcula mano de obra y genera registros anidados en la base de datos.
  * `Caja`: Muestra el historial de transacciones (`Ingreso`/`Egreso`) y procesa el saldo actual en un panel destacado.
  * `Inicio (Dashboard)`: Pantalla principal que consume el reporte de deudores cruzando órdenes de trabajo contra señas pagadas.
 
### Decisiones de Experiencia de Usuario (UX)
* **Gestión de Diálogos:** Se eliminaron las llamadas bloqueantes nativas de `alert()` y `confirm()`. Se unificó toda la interfaz interactiva bajo **SweetAlert2** con paletas de colores coincidentes con las directivas de marca de Tailwind CSS (azul principal, rojo defensivo).
* **Adaptación Matricial de Planillas:** El lector del catálogo de materiales procesa los flujos de Excel convirtiéndolos en arreglos vectoriales en memoria pura (`ArrayBuffer`). Cuenta con escaneo dinámico de filas para tolerar títulos corporativos de proveedores e identificar columnas con normalización lingüística (independencia de tildes o mayúsculas).
  ---
## Flujo de Vida del Dato (Resumen)
1. **Catálogo:** Los `Materiales` y `Clientes` actúan como entidades maestras independientes.
2. **Operación:** Se crea una `OrdenTrabajo` que congela el precio histórico de los materiales y asocia la deuda al cliente.
3. **Finanzas:** Las `Transacciones` registran los pagos a cuenta (Ingresos) o los gastos del taller (Egresos), impactando en el saldo de caja en tiempo real.
4. **Análisis:** El Dashboard cruza el costo total de las Órdenes contra los Ingresos asociados a cada cliente para calcular el saldo deudor exacto.