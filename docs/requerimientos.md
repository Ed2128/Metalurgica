# Requerimientos y Reglas de Negocio

Este documento detalla la lógica interna, las fórmulas matemáticas y los flujos de trabajo que el sistema debe automatizar basándose en la operativa histórica del taller.

## 1. Gestión de Precios y Presupuestos
El sistema debe permitir la creación de presupuestos detallados sumando diferentes insumos y calculando la mano de obra automáticamente.

### Ingreso de Materiales
Los materiales se miden y almacenan en tres unidades posibles:
* **Unidad** (Ej: Chapas, Bisagras, Ruedas)
* **Barra / Metro** (Ej: Caños inoxidables, Ángulos)
* **Kilo** (Ej: Hierro liso)

### Lógica Impositiva (IVA y Tasas)
El sistema debe soportar un modelo de ingreso dual para los precios de los materiales:
* **Con IVA Incluido:** El valor ingresado es el final.
* **Sin IVA:** El sistema debe calcular el precio final aplicando recargos dinámicos que el usuario puede modificar en la interfaz. Por defecto, los valores son:
  * IVA: 21% (0.21)
  * Ingresos Brutos (IIBB): 3.31% (0.0331)
  * Tasa Municipal: 0.80% (0.008)

### Cálculo de Mano de Obra
La mano de obra no se ingresa manualmente. El sistema la calcula aplicando un coeficiente fijo sobre el costo total de los materiales del trabajo.
* **Fórmula:** `Costo Mano de Obra = Costo Total Materiales * 2.5`
* *Nota:* El valor `2.5` debe ser una variable de entorno o configuración del sistema para permitir futuros ajustes.

## 2. Flujo de Caja (Caja Diaria y Mensual)
Todas las transacciones de dinero (entradas y salidas) deben centralizarse en un libro de caja.
* Las entradas y salidas deben estar categorizadas (Ej: Insumos, Viáticos, Adelanto a cuenta, Combustible).
* **Retiros del Dueño:** Se utilizará una categoría específica (ej. "Retiro Ariel") que descuenta del saldo de la caja del taller, pero permite filtrarse rápidamente para generar el reporte de finanzas personales, evitando mezclar conceptos.

## 3. Cuentas Corrientes (Clientes y Proveedores)
El sistema no utiliza ventas "simples", sino un modelo transaccional de deuda y saldo.
* **Presupuesto / Orden de Trabajo:** Genera un incremento en la deuda del cliente.
* **Señas / Pagos Parciales:** Generan un descuento en la deuda.
* **Saldo:** Se calcula dinámicamente (`Total Obra - Pagos Recibidos`).
* Esta misma lógica se aplica a la inversa para los proveedores (Compras de insumos a crédito).