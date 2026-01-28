# Refactorización: Eliminación de ChoferXVehiculo

## Resumen de cambios

Se han refactorizado los servicios de viajes para eliminar la dependencia en la tabla `ChoferXVehiculo`. Ahora la disponibilidad de choferes y vehículos se valida temporalmente en función de los rangos de fechas de los viajes.

## Cambios realizados

### 1. **viajeValidator.js**
- ❌ Eliminado: `idChoferVehiculo` (campo obligatorio)
- ✅ Añadido: `idChofer` (campo obligatorio)
- ✅ Añadido: `idVehiculo` (campo obligatorio)
- En actualizaciones, estos campos son opcionales para permitir actualizaciones parciales

### 2. **viajeService.js**
- ✅ Función nueva: `validarDisponibilidadTemporal(idChofer, idVehiculo, fechaInicio, fechaFin, idViajeActual)`
  - Valida que el chofer y vehículo no tengan conflictos de fechas con otros viajes
  - Detecta solapamientos de fechas usando: `NOT (fechaFin < ? OR fechaInicio > ?)`
  - Excluye viajes cancelados y el viaje actual (si es actualización)
  - Lanza error 400 si hay conflicto

- **Modificado: `crear(viaje)`**
  - Ahora recibe `idChofer` e `idVehiculo` directamente (no `idChoferVehiculo`)
  - Valida existencia de chofer y vehículo
  - Valida disponibilidad temporal
  - Inserta directamente en Viaje

- **Modificado: `actualizar(id, viaje)`**
  - Recibe `idChofer` e `idVehiculo` opcionales
  - Mantiene IDs actuales si no se proporcionan nuevos
  - Valida disponibilidad temporal si cambian IDs o fechas
  - Permite cambiar chofer/vehículo sin afectar otros viajes

### 3. **driverService.js**
- ❌ Eliminado: `asignarVehiculo()` 
  - Ya no necesario, la asignación se maneja como parte de la creación de viajes
  - Se mantiene el código comentado con nota de deprecación

- ✅ Actualizado: `module.exports`
  - Removido export de `asignarVehiculo`

### 4. **driverController.js**
- ❌ Eliminado: `asignarVehiculo()` function
- ✅ Actualizado: `module.exports`
  - Removido export de `asignarVehiculo`

### 5. **routes/drivers.js**
- ❌ Eliminado endpoint: `POST /:id/asignar-camion`
- ✅ Mantenido: `GET /:id/historial`

### 6. **server.js**
- ❌ Comentado: Require de `choferVehiculosRoutes`
- ❌ Comentado: Endpoint `app.use("/api/chofer-vehiculos", choferVehiculosRoutes)`
- ℹ️ La ruta se mantiene comentada (no eliminada) para compatibilidad con código legacy

## Beneficios de la refactorización

1. **Eliminación de redundancia**: No se guarda dos veces la asignación (ChoferXVehiculo + Viaje)

2. **Disponibilidad temporal correcta**:
   - Antes: estado fijo que no permitía solapamientos
   - Ahora: valida solo en rangos de fechas específicos

3. **Mejor lógica de negocio**:
   - Un chofer puede estar ocupado en Enero pero libre en Marzo
   - Ejemplo: Viaje 1 (10-15 Ene) bloquea esas fechas
   - Permite crear Viaje 2 (1-8 Ene) o Viaje 3 (20-28 Ene)

4. **Simplificación del código**:
   - Una tabla de historial (Viaje) en lugar de dos
   - Menores consultas a BD
   - Lógica centralizada en `validarDisponibilidadTemporal`

## API Changes

### Crear Viaje (antes)
```json
{
  "fechaInicio": "2026-01-20",
  "fechaFin": "2026-01-25",
  "precio": 1000,
  "idCliente": 1,
  "idChoferVehiculo": 1,
  "idLocalidadOrigen": 1,
  "idLocalidadDestino": 2
}
```

### Crear Viaje (después)
```json
{
  "fechaInicio": "2026-01-20",
  "fechaFin": "2026-01-25",
  "precio": 1000,
  "idCliente": 1,
  "idChofer": 1,
  "idVehiculo": 1,
  "idLocalidadOrigen": 1,
  "idLocalidadDestino": 2
}
```

## Validación de Conflictos

La función `validarDisponibilidadTemporal` detecta conflictos usando la siguiente lógica SQL:

```sql
SELECT idViaje FROM Viaje
WHERE (idChofer = ? OR idVehiculo = ?)
AND estado != 'CANCELADO'
AND NOT (fechaFin < ? OR fechaInicio > ?)
AND idViaje != ? -- (si es actualización)
```

Esto encuentra todos los viajes que se superponen en fechas con el nuevo viaje.

## Rutas que ya no existen

- ❌ `GET /api/chofer-vehiculos` - Listar asignaciones
- ❌ `GET /api/chofer-vehiculos/:id` - Obtener asignación
- ❌ `POST /api/chofer-vehiculos` - Crear asignación
- ❌ `DELETE /api/chofer-vehiculos/:id` - Eliminar asignación
- ❌ `POST /api/drivers/:id/asignar-camion` - Asignar vehículo a chofer

## Archivos NO modificados

- `src/routes/choferVehiculos.js` - Se puede eliminar cuando sea seguro
- `src/controllers/choferVehiculoController.js` - Se puede eliminar cuando sea seguro
- `src/services/choferVehiculoService.js` - Se puede eliminar cuando sea seguro
- `src/validators/` - Todos los demás validadores sin cambios

## Tabla ChoferXVehiculo

⚠️ La tabla `ChoferXVehiculo` sigue existiendo en la BD pero ya no se usa. Se recomienda:
1. Hacer backup de datos si es necesario
2. Eliminarla del init.sql
3. Eliminar tabla de BD cuando todo esté en producción

## Testing

Probar los siguientes casos:

1. **Crear viaje sin conflictos** ✓
   - POST /viajes con fechas libres debe funcionar

2. **Crear viaje con conflicto** ✓
   - POST /viajes con chofer/vehículo ocupado debe retornar error 400

3. **Actualizar viaje manteniendo asignación** ✓
   - PUT /viajes/:id sin cambiar idChofer/idVehiculo debe funcionar

4. **Actualizar viaje con nueva asignación conflictiva** ✓
   - PUT /viajes/:id cambiando chofer/vehículo a uno ocupado debe fallar

5. **Viajes cancelados no bloquean** ✓
   - Un viaje CANCELADO no debe impedir crear otro en mismo rango
