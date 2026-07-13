# Manual de Usuario

Este documento servirá como guía de uso para los operadores del sistema una vez que la aplicación esté desplegada. *(Se irá completando a medida que se desarrollen las interfaces gráficas)*.

## 1. Módulo de Presupuestos
**Cómo generar una cotización para un trabajo:**
1. Navegar a la sección "Nuevo Presupuesto".
2. Seleccionar el Cliente.
3. Buscar y añadir los materiales necesarios (indicando cantidad en metros, unidades o kilos).
4. El sistema sumará el costo de los materiales y aplicará automáticamente el coeficiente multiplicador (2.5x) para la mano de obra.
5. Guardar la orden de trabajo.

## 2. Gestión de Caja y Pagos
**Cómo registrar una seña o pago de un cliente:**
1. Navegar a "Cuentas Corrientes" > "Cobros".
2. Seleccionar el cliente y la Orden de Trabajo correspondiente.
3. Ingresar el monto recibido.
4. El sistema actualizará el saldo deudor del cliente e ingresará el dinero automáticamente en la Caja Diaria.

**Cómo registrar un retiro de dinero del dueño:**
1. Navegar a "Caja Diaria" > "Nuevo Egreso".
2. Ingresar el monto retirado.
3. Seleccionar obligatoriamente la categoría `Retiro Dueño`.
4. Añadir una descripción si es necesario y guardar.

## 3. Reportes
**Cómo generar el reporte de deudores:**
1. Ir a la sección "Reportes".
2. Clic en "Trabajos a Cobrar / Saldos".
3. El sistema listará todos los clientes con pagos pendientes, permitiendo exportar la lista para su revisión.