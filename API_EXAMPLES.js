/**
 * EJEMPLO DE USO - Crear Viaje sin ChoferXVehiculo
 * 
 * Después de la refactorización, los viajes se crean directamente con:
 * - idChofer
 * - idVehiculo
 * 
 * Sin necesidad de crear primero una entrada en ChoferXVehiculo
 */

// ============================================================
// 1. CREAR UN VIAJE (POST /viajes)
// ============================================================

const nuevoViaje = {
  // Fechas obligatorias
  fechaInicio: "2026-02-01",
  fechaFin: "2026-02-05",
  
  // Asignaciones directas (NUEVO - sin ChoferXVehiculo)
  idChofer: 1,        // Chofer específico
  idVehiculo: 1,      // Vehículo específico
  
  // Cliente y rutas
  idCliente: 1,
  idLocalidadOrigen: 1,
  idLocalidadDestino: 2,
  
  // Otros campos
  precio: 2500.00,
  kilometros: 150,
  observaciones: "Viaje regular"
};

/*
POST /viajes
Content-Type: application/json

{
  "fechaInicio": "2026-02-01",
  "fechaFin": "2026-02-05",
  "idChofer": 1,
  "idVehiculo": 1,
  "idCliente": 1,
  "idLocalidadOrigen": 1,
  "idLocalidadDestino": 2,
  "precio": 2500.00,
  "kilometros": 150,
  "observaciones": "Viaje regular"
}

Response (201):
{
  "status": "success",
  "data": {
    "idViaje": 5,
    "estado": "INICIADO",
    "fechaInicio": "2026-02-01",
    "fechaFin": "2026-02-05",
    "idChofer": 1,
    "idVehiculo": 1,
    "idCliente": 1,
    ...
  }
}
*/


// ============================================================
// 2. VALIDACIÓN AUTOMÁTICA DE CONFLICTOS
// ============================================================

const viajeConflictivo = {
  fechaInicio: "2026-02-03",  // Overlaps con el viaje anterior
  fechaFin: "2026-02-08",
  idChofer: 1,                // MISMO CHOFER → Conflicto
  idVehiculo: 1,              // MISMO VEHÍCULO → Conflicto
  idCliente: 1,
  idLocalidadOrigen: 1,
  idLocalidadDestino: 2,
  precio: 2000.00
};

/*
POST /viajes
Content-Type: application/json
{...viajeConflictivo...}

Response (400):
{
  "status": "error",
  "message": "El chofer o vehículo no está disponible en el rango de fechas seleccionado"
}
*/


// ============================================================
// 3. VIAJES QUE NO CONFLICTÚAN (Mismo chofer, fechas diferentes)
// ============================================================

const viajeValido = {
  fechaInicio: "2026-02-10",  // Después del primer viaje (05)
  fechaFin: "2026-02-15",
  idChofer: 1,                // MISMO CHOFER pero sin solapamiento
  idVehiculo: 2,              // VEHÍCULO DIFERENTE
  idCliente: 1,
  idLocalidadOrigen: 1,
  idLocalidadDestino: 2,
  precio: 2500.00
};

/*
POST /viajes
Content-Type: application/json
{...viajeValido...}

Response (201):
{
  "status": "success",
  "data": {
    "idViaje": 6,
    ...
  }
}
*/


// ============================================================
// 4. ACTUALIZAR VIAJE (PUT /viajes/:id)
// ============================================================

// Cambiar chofer/vehículo
const actualizacionParcial = {
  idChofer: 2,          // Cambiar a diferente chofer
  idVehiculo: 3         // Cambiar a diferente vehículo
};

/*
PUT /viajes/5
Content-Type: application/json
{
  "idChofer": 2,
  "idVehiculo": 3
}

Response (200):
{
  "status": "success",
  "data": {
    "idViaje": 5,
    "idChofer": 2,
    "idVehiculo": 3,
    ...
  }
}
*/


// ============================================================
// 5. LÓGICA DE DISPONIBILIDAD TEMPORAL
// ============================================================

/*
La función validarDisponibilidadTemporal valida que:

1. El chofer NO esté en otro viaje en el rango [fechaInicio, fechaFin]
2. El vehículo NO esté en otro viaje en el rango [fechaInicio, fechaFin]
3. Se ignoran viajes con estado CANCELADO
4. Al actualizar, se ignora el viaje siendo actualizado

Query SQL:
SELECT idViaje FROM Viaje
WHERE (idChofer = ? OR idVehiculo = ?)
AND estado != 'CANCELADO'
AND NOT (fechaFin < ? OR fechaInicio > ?)
AND idViaje != ?

Explicación de la condición de solapamiento:
- NOT (fechaFin < ? OR fechaInicio > ?)
- Es equivalente a: (fechaFin >= ? AND fechaInicio <= ?)
- Detecta cualquier intersección entre dos rangos de fechas
*/


// ============================================================
// 6. EJEMPLOS DE RANGOS DE FECHAS
// ============================================================

/*
Viaje 1: 10 Ene - 15 Ene

CONFLICTÚA:
- Viaje 2: 05 Ene - 12 Ene    (overlaps at 10-12)
- Viaje 2: 10 Ene - 15 Ene    (mismo rango)
- Viaje 2: 12 Ene - 18 Ene    (overlaps at 12-15)
- Viaje 2: 05 Ene - 20 Ene    (contiene al primero)

NO CONFLICTÚA:
- Viaje 2: 01 Ene - 09 Ene    (termina antes)
- Viaje 2: 16 Ene - 20 Ene    (comienza después)
- Viaje 2: CANCELADO (01 Ene - 20 Ene)  (estado CANCELADO)
*/


// ============================================================
// 7. VIAJES CANCELADOS NO BLOQUEAN
// ============================================================

const viajeConEstado = {
  fechaInicio: "2026-01-10",
  fechaFin: "2026-01-15",
  estado: "CANCELADO",
  idChofer: 1,
  idVehiculo: 1,
  ...
};

// Luego, crear un nuevo viaje en el mismo período:
const nuevoViajeEnSamoPeriodo = {
  fechaInicio: "2026-01-12",
  fechaFin: "2026-01-14",
  idChofer: 1,        // MISMO CHOFER
  idVehiculo: 1,      // MISMO VEHÍCULO
  ...
};

/*
POST /viajes
{...nuevoViajeEnSamoPeriodo...}

Response (201): SUCCESS
{
  "status": "success",
  ...
}

Explicación:
El viaje anterior está CANCELADO, por lo que:
  AND estado != 'CANCELADO'  → lo excluye de la búsqueda de conflictos
*/


// ============================================================
// 8. DIFERENCIA CON EL ANTERIOR SISTEMA
// ============================================================

/*
ANTES (con ChoferXVehiculo):
1. POST /api/chofer-vehiculos  → Crear asignación fija
   { idChofer: 1, idVehiculo: 1, fechaAsignacion: "2026-01-01" }

2. POST /viajes                 → Usar esa asignación
   { idChoferVehiculo: 1, ... }

3. Problema: estado fijo no permitía viajes superpuestos

---

DESPUÉS (sin ChoferXVehiculo):
1. POST /viajes                 → Asignar directo + validar fechas
   { idChofer: 1, idVehiculo: 1, fechaInicio: "...", fechaFin: "..." }

2. Automático: Se valida disponibilidad temporal
3. Ventaja: Mismo chofer puede trabajar múltiples viajes sin solapamiento
*/
