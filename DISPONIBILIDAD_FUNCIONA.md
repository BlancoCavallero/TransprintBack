# ✅ ¿Cómo está funcionando la disponibilidad actualmente?

## 🎯 Respuesta corta: **SÍ, YA ESTÁ IMPLEMENTADO**

La validación dinámica de disponibilidad **está funcionando correctamente** en el back.

---

## 🔍 Detalles técnicos

### 1. Cuando creas un VIAJE (POST /viajes)

El sistema ejecuta esta lógica:

```javascript
// Línea 228 en viajeService.js
await validarDisponibilidadTemporal(idChofer, idVehiculo, fechaInicio, fechaFin);
```

### 2. La función `validarDisponibilidadTemporal()` hace esto:

```javascript
// Líneas 6-27 en viajeService.js
const validarDisponibilidadTemporal = async (idChofer, idVehiculo, fechaInicio, fechaFin) => {
  // CONSULTA LA BD BUSCANDO VIAJES QUE CONFLICTÚEN
  SELECT idViaje FROM Viaje
  WHERE (idChofer = ? OR idVehiculo = ?)      // ← El MISMO chofer O vehículo
  AND estado != 'CANCELADO'                   // ← Que NO estén cancelados
  AND NOT (fechaFin < ? OR fechaInicio > ?)   // ← QUE SOLAPAN EN FECHAS
  
  // Si encuentra conflictos → Lanza error 400
  if (conflictos.length > 0) {
    throw new Error("El chofer o vehículo no está disponible en el rango de fechas seleccionado");
  }
};
```

---

## 📊 Ejemplo práctico

### Escenario:
- **Chofer Juan** (id=1)
- **Vehículo Ford** (id=1)
- Viaje 1: **Noviembre 1 - Diciembre 15, 2026** ✅ Creado

### Intentas crear Viaje 2: Febrero 1 - Marzo 31, 2026

```http
POST /viajes
{
  "idChofer": 1,
  "idVehiculo": 1,
  "fechaInicio": "2026-02-01",
  "fechaFin": "2026-03-31",
  ...
}
```

### El sistema hace:

```sql
-- Busca en BD si Juan (idChofer=1) o Ford (idVehiculo=1)
-- tienen viajes en el rango 02-01 a 03-31
SELECT idViaje FROM Viaje
WHERE (idChofer = 1 OR idVehiculo = 1)
AND estado != 'CANCELADO'
AND NOT (fechaFin < '2026-02-01' OR fechaInicio > '2026-03-31')

-- Resultado: 0 filas → Disponible ✅
-- Crea el viaje exitosamente
```

### Resultado:
```json
{
  "status": "success",
  "data": {
    "idViaje": 2,
    "estado": "INICIADO",
    "fechaInicio": "2026-02-01",
    "fechaFin": "2026-03-31",
    "idChofer": 1,
    "idVehiculo": 1
  }
}
```

---

## ❌ Ejemplo de conflicto

### Intentas crear Viaje 3 que CONFLICTÚA:

```http
POST /viajes
{
  "idChofer": 1,
  "idVehiculo": 1,
  "fechaInicio": "2026-11-15",     // ← Dentro del rango de Viaje 1
  "fechaFin": "2026-12-01",        // ← Conflictúa con Nov 1 - Dic 15
  ...
}
```

### La BD encuentra un conflicto:

```
Viaje 1: Nov 1 ──────────── Dic 15
Viaje 3:        Nov 15 ─ Dic 1
                    ^
                  ¡SOLAPAN!
```

### Respuesta:
```json
{
  "status": "error",
  "message": "El chofer o vehículo no está disponible en el rango de fechas seleccionado",
  "statusCode": 400
}
```

---

## 🧮 Fórmula de solapamiento (SQL):

```sql
NOT (fechaFin < ? OR fechaInicio > ?)
```

Detecta conflicto cuando:
- El viaje nuevo empieza **antes de que termine** el viaje existente
- Y el viaje nuevo termina **después de que empiece** el viaje existente

**Ejemplos de SOLAPAMIENTO:**
```
Viaje actual: 01/11 ────────── 15/12
Intento 1:        01/12 ────── 30/12     ❌ Conflictúa (empieza dentro)
Intento 2:    01/10 ──────────────── 20/01  ❌ Conflictúa (engloba)
Intento 3:                     16/12 ─── 30/12  ✅ No conflictúa (después)
Intento 4:    01/09 ─── 31/10            ✅ No conflictúa (antes)
```

---

## 📍 Dónde se valida

1. **Al crear viaje (POST /viajes)**
   - Línea 228: `await validarDisponibilidadTemporal(...)`

2. **Al actualizar viaje (PUT /viajes/:id)**
   - Línea 298: `await validarDisponibilidadTemporal(..., id)`
   - Excluye el viaje actual para permitir actualizaciones

3. **Al eliminar viaje (DELETE /viajes/:id)**
   - No necesita validación (libera recursos)

---

## 📱 ¿Cómo lo ve el Frontend?

### Para saber si un chofer está disponible en un rango:

**Opción A: Intentar crear viaje** (lo que hace ahora)
```http
POST /viajes
{idChofer, idVehiculo, fechaInicio, fechaFin}

→ Si devuelve error 400 → No disponible
→ Si devuelve 201 → Disponible
```

**Opción B: Endpoint específico de disponibilidad** (propuesta futura)
```http
GET /api/drivers/1/disponibilidad?desde=2026-02-01&hasta=2026-03-31

→ Consulta sin crear nada
→ Retorna: disponible: true/false
```

---

## 🟢 Estado actual: **IMPLEMENTADO CORRECTAMENTE**

| Característica | Estado |
|---|---|
| ✅ Consulta dinámica por fechas | Implementado |
| ✅ Detecta solapamientos | Funciona |
| ✅ Valida al crear viaje | Sí |
| ✅ Valida al actualizar viaje | Sí |
| ✅ Excluye viajes cancelados | Sí |
| ✅ Permite asignar en Febrero aunque esté asignado Noviembre | Funciona |

---

## 🚀 Lo que aún se puede mejorar:

1. **Endpoint GET para consultar disponibilidad sin crear viaje**
   ```http
   GET /api/drivers/:id/disponibilidad?desde=...&hasta=...
   ```

2. **Retornar disponibilidad en GET /api/drivers/:id**
   ```json
   {
     "idChofer": 1,
     "viajes": [...],
     "estaLibre": true/false
   }
   ```

3. **Filtro al listar choferes por disponibilidad**
   ```http
   GET /api/drivers?disponibleDesde=2026-02-01&disponibleHasta=2026-03-31
   ```

---

## 📌 Conclusión

**La disponibilidad dinámica YA ESTÁ FUNCIONANDO.**

El sistema:
- ✅ Consulta la BD dinámicamente
- ✅ Detecta solapamientos de fechas
- ✅ Permite asignar el mismo chofer/vehículo en diferentes períodos
- ✅ Rechaza conflictos con error 400

**No está guardado en un campo `estadoDisponibilidad`** porque es temporal y cambia según las fechas.
