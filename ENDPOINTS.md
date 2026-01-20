# ENDPOINTS DISPONIBLES - TransprintBack

## 📋 Tabla de Contenidos
1. [VIAJES](#viajes-endpoints) ⭐ **CRÍTICO PARA REFACTORIZACIÓN**
2. [CHOFERES](#choferes-endpoints)
3. [VEHÍCULOS](#vehículos-endpoints)
4. [CLIENTES](#clientes-endpoints)
5. [DOCUMENTACIÓN](#documentación-endpoints)
6. [GASTOS](#gastos-endpoints)
7. [PERSONAS](#personas-endpoints)
8. [PROVINCIAS](#provincias-endpoints)
9. [LOCALIDADES](#localidades-endpoints)
10. [MANTENIMIENTOS](#mantenimientos-endpoints)
11. [USUARIOS](#usuarios-endpoints)
12. [AUTENTICACIÓN](#autenticación-endpoints)

---

## VIAJES ENDPOINTS
**Base URL:** `/viajes`

### ⭐ CREAR VIAJE (POST)
```http
POST /viajes
Content-Type: application/json

{
  "fechaInicio": "2026-02-01",           // Obligatorio - YYYY-MM-DD
  "fechaFin": "2026-02-05",              // Obligatorio - YYYY-MM-DD
  "precio": 2500.00,                     // Obligatorio - Float > 0
  "idCliente": 1,                        // Obligatorio - Int
  "idChofer": 1,                         // Obligatorio - Int (CAMBIO: antes era idChoferVehiculo)
  "idVehiculo": 1,                       // Obligatorio - Int (CAMBIO: antes era idChoferVehiculo)
  "idLocalidadOrigen": 1,                // Obligatorio - Int
  "idLocalidadDestino": 2,               // Obligatorio - Int
  "kilometros": 150.5,                   // Opcional - Float >= 0
  "observaciones": "Viaje regular",      // Opcional - String
  "motivoCancelacion": null              // Opcional - Solo si estado es CANCELADO
}

Response (201):
{
  "status": "success",
  "data": {
    "idViaje": 5,
    "estado": "INICIADO",                // Se calcula automáticamente
    "fechaInicio": "2026-02-01",
    "fechaFin": "2026-02-05",
    "precio": 2500,
    "idChofer": 1,
    "idVehiculo": 1,
    ...
  }
}

⚠️ IMPORTANTE:
- NO enviar "estado" en POST (se calcula automáticamente)
- El estado se determina automáticamente:
  - Si fechaInicio > hoy → INICIADO
  - Si fechaInicio <= hoy <= fechaFin → EN CURSO
  - Si fechaFin < hoy → FINALIZADO
- Se valida automáticamente que chofer+vehículo no estén ocupados en ese rango
```

### ⭐ OBTENER TODOS LOS VIAJES (GET)
```http
GET /viajes
GET /viajes?idViaje=5
GET /viajes?estado=INICIADO
GET /viajes?idCliente=1
GET /viajes?idChofer=1

Response (200):
{
  "status": "success",
  "data": [
    {
      "idViaje": 5,
      "estado": "INICIADO",
      "fechaInicio": "2026-02-01",
      "fechaFin": "2026-02-05",
      "precio": 2500,
      "idChofer": 1,
      "idVehiculo": 1,
      "idCliente": 1,
      "cliente": {
        "idCliente": 1,
        "razonSocial": "Transporte XYZ",
        "tipo": "empresa",
        "persona": {...}
      },
      "chofer": {
        "idChofer": 1,
        "dni": 12345678,
        "persona": {...}
      },
      "vehiculo": {
        "idVehiculo": 1,
        "patente": "ABC123",
        "marca": "Ford",
        "modelo": "Transit"
      },
      "gastos": [...]
    }
  ]
}
```

### ⭐ ACTUALIZAR VIAJE (PUT)
```http
PUT /viajes/5
Content-Type: application/json

{
  "estado": "CANCELADO",                 // Opcional - Solo cambiar a CANCELADO aquí
  "motivoCancelacion": "Cancelado por cliente",  // Recomendado si estado es CANCELADO
  "fechaInicio": "2026-02-02",          // Opcional
  "fechaFin": "2026-02-06",             // Opcional
  "precio": 3000,                       // Opcional
  "idCliente": 1,                       // Opcional
  "idChofer": 2,                        // Opcional - CAMBIO: antes era idChoferVehiculo
  "idVehiculo": 2,                      // Opcional - CAMBIO: antes era idChoferVehiculo
  "idLocalidadOrigen": 1,               // Opcional
  "idLocalidadDestino": 3,              // Opcional
  "kilometros": 200,                    // Opcional
  "observaciones": "Cambios realizados" // Opcional
}

Response (200):
{
  "status": "success",
  "data": {...viaje actualizado...}
}

⚠️ IMPORTANTE:
- Si cambias chofer/vehículo/fechas → se valida disponibilidad temporal
- Si cambias a estado CANCELADO → se libera chofer+vehículo para otros viajes
- Los campos no enviados mantienen sus valores actuales
```

### ELIMINAR VIAJE (DELETE)
```http
DELETE /viajes/5

Response (200):
{
  "status": "success",
  "message": "Viaje eliminado correctamente"
}

⚠️ También libera chofer+vehículo para otros viajes
```

---

## CHOFERES ENDPOINTS
**Base URL:** `/api/drivers`

### OBTENER TODOS LOS CHOFERES (GET)
```http
GET /api/drivers
GET /api/drivers?estado=Libre ( Anotacion axel:Estos estados funcionan para la documentacion?.)
GET /api/drivers?estado=Ocupado

Response (200):
{
  "status": "success",
  "data": [
    {
      "idChofer": 1,
      "dni": 12345678,
      "estadoDisponibilidad": "Libre",    // Libre, Ocupado, Inhabilitado
      "persona": {
        "idPersona": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "cuit": "20123456789",
        "telefono": "1123456789"
      }
    }
  ]
}
```

### OBTENER CHOFER POR ID (GET)
```http
GET /api/drivers/id/1

Response (200):
{...chofer detail...}
```

### BUSCAR CHOFERES (GET)
```http
GET /api/drivers/buscar/Juan
GET /api/drivers/buscar/Pérez
GET /api/drivers/buscar/12345678

Busca por nombre, apellido o DNI
```

### CREAR CHOFER (POST)

#### ⭐ OPCIÓN 1: Con Persona Existente (forma antigua)
```http
POST /api/drivers
Content-Type: application/json

{
  "dni": 12345678,                      // Obligatorio - Único
  "idPersona": 1                        // Obligatorio - Debe existir Persona
}

Response (201):
{
  "status": "success",
  "data": {
    "idChofer": 1,
    "dni": 12345678,
    "estadoDisponibilidad": "Inhabilitado",  // Inicia en Inhabilitado
    "idPersona": 1,
    "persona": {
      "idPersona": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "cuit": "20123456789",
      "telefono": "1123456789"
    }
  }
}
```

#### ⭐ OPCIÓN 2: Crear Chofer Y Persona AL MISMO TIEMPO (nueva - recomendado)
```http
POST /api/drivers
Content-Type: application/json

{
  "dni": 12345678,                      // Obligatorio - Único
  "nombre": "Juan",                     // Obligatorio si NO envías idPersona
  "apellido": "Pérez",                  // Obligatorio si NO envías idPersona
  "cuit": "20123456789",                // Obligatorio si NO envías idPersona
  "telefono": "1123456789"              // Obligatorio si NO envías idPersona
}

Response (201):
{
  "status": "success",
  "data": {
    "idChofer": 2,
    "dni": 12345678,
    "estadoDisponibilidad": "Inhabilitado",
    "idPersona": 2,
    "persona": {
      "idPersona": 2,
      "nombre": "Juan",
      "apellido": "Pérez",
      "cuit": "20123456789",
      "telefono": "1123456789"
    }
  }
}
```

✅ **La Persona se crea automáticamente**

⚠️ **Importante:**
- Estado inicial: "Inhabilitado" (hasta que valide documentación)
- Debes enviar SOLO `idPersona` O los datos completos de persona, no ambos
- Si creas Persona integrada, el CUIT no debe existir en BD

### ACTUALIZAR CHOFER (PUT)
```http
PUT /api/drivers/1
Content-Type: application/json

{
  "dni": 12345679,                      // Opcional
  "estadoDisponibilidad": "Libre",      // Opcional
  
  // Datos de Persona (Opcional - editar nombre, apellido, teléfono, etc.)
  "nombre": "Juan Nuevo",               // Opcional
  "apellido": "Pérez García",           // Opcional
  "cuit": "20123456789",                // Opcional (debe ser único)
  "telefono": "1199999999"              // Opcional
}

Response (200):
{
  "status": "success",
  "data": {
    "idChofer": 1,
    "dni": 12345679,
    "estadoDisponibilidad": "Libre",
    "idPersona": 1,
    "persona": {
      "idPersona": 1,
      "nombre": "Juan Nuevo",
      "apellido": "Pérez García",
      "cuit": "20123456789",
      "telefono": "1199999999"
    }
  }
}
```

⚠️ **Nota:** Puedes actualizar cualquier combinación de campos. Ejemplos:
- Solo dni: `{dni: 87654321}`
- Solo datos de persona: `{nombre: "Juan", apellido: "Pérez"}`
- Mezcla de ambos: `{dni: 87654321, nombre: "Juan", telefono: "1199999999"}`

### ELIMINAR CHOFER (DELETE)
```http
DELETE /api/drivers/1

Response (200):
{
  "status": "success",
  "message": "Chofer eliminado correctamente"
}
```

### HISTORIAL DE VIAJES DEL CHOFER (GET)
```http
GET /api/drivers/1/historial
GET /api/drivers/1/historial?desde=2026-01-01&hasta=2026-02-28
GET /api/drivers/1/historial?desde=2026-01-01&hasta=2026-02-28&estado=FINALIZADO

Response (200):
{
  "status": "success",
  "data": [
    {
      "idViaje": 5,
      "estado": "FINALIZADO",
      "fechaInicio": "2026-01-10",
      "fechaFin": "2026-01-15",
      "cliente": {...},
      "vehiculo": {...}
    }
  ]
}
```

---

## VEHÍCULOS ENDPOINTS
**Base URL:** `/api/vehiculos`

### OBTENER TODOS LOS VEHÍCULOS (GET)
```http
GET /api/vehiculos
GET /api/vehiculos?marca=Ford
GET /api/vehiculos?modelo=Transit
GET /api/vehiculos?patente=ABC123
GET /api/vehiculos?tipo=Camión
GET /api/vehiculos?estado=activo

Response (200):
{
  "status": "success",
  "data": [
    {
      "idVehiculo": 1,
      "anio": 2020,
      "marca": "Ford",
      "modelo": "Transit",
      "patente": "ABC123",
      "estado": "activo",
      "tipo": "Camión"
    }
  ]
}
```

### CREAR VEHÍCULO (POST)
```http
POST /api/vehiculos
Content-Type: application/json

{
  "marca": "Ford",                      // Obligatorio
  "modelo": "Transit",                  // Obligatorio
  "patente": "ABC123",                  // Obligatorio - Único
  "estado": "activo",                   // Obligatorio
  "anio": 2020,                         // Opcional
  "tipo": "Camión"                      // Opcional
}

Response (201):
{
  "status": "success",
  "message": "Vehículo creado exitosamente"
}
```

### ACTUALIZAR VEHÍCULO (PUT)
```http
PUT /api/vehiculos/1
Content-Type: application/json

{
  "estado": "mantenimiento",            // Opcional
  "anio": 2021                          // Opcional
}

Response (200):
{
  "status": "success",
  "message": "Vehículo actualizado correctamente"
}
```

### ELIMINAR VEHÍCULO (DELETE)
```http
DELETE /api/vehiculos/1

Response (200):
{
  "status": "success",
  "message": "Vehículo eliminado correctamente"
}
```

---

## CLIENTES ENDPOINTS
**Base URL:** `/api/clients`

### OBTENER TODOS LOS CLIENTES (GET)
```http
GET /api/clients

Response (200):
{
  "status": "success",
  "data": [
    {
      "idCliente": 1,
      "razonSocial": "Transporte XYZ",
      "tipo": "empresa",
      "correo": "contacto@xyz.com",
      "observaciones": "Cliente vip",
      "idPersona": 1,
      "idLocalidad": 1,
      "persona": {...},
      "localidad": {...}
    }
  ]
}
```

### OBTENER CLIENTE POR ID (GET)
```http
GET /api/clients/1

Response (200):
{...cliente detail...}
```

### BUSCAR CLIENTES (GET)
```http
GET /api/clients/buscar/XYZ
GET /api/clients/buscar/empresa

Busca por razonSocial, tipo o correo
```

### CREAR CLIENTE (POST)

#### ⭐ OPCIÓN 1: Con Persona Existente (forma antigua)
```http
POST /api/clients
Content-Type: application/json

{
  "razonSocial": "Transporte XYZ",      // Obligatorio
  "tipo": "Empresa",                    // Obligatorio - "Productor" o "Empresa"
  "correo": "contacto@xyz.com",         // Obligatorio
  "idPersona": 1,                       // Obligatorio - Debe existir Persona
  "idLocalidad": 1,                     // Obligatorio
  "observaciones": "Cliente vip"        // Opcional
}

Response (201):
{
  "status": "success",
  "data": {
    "idCliente": 1,
    "razonSocial": "Transporte XYZ",
    "tipo": "Empresa",
    "correo": "contacto@xyz.com",
    "idPersona": 1,
    "idLocalidad": 1,
    "observaciones": "Cliente vip",
    "persona": {...},
    "localidad": {...}
  }
}
```

#### ⭐ OPCIÓN 2: Crear Cliente Y Persona AL MISMO TIEMPO (nueva - recomendado)
```http
POST /api/clients
Content-Type: application/json

{
  "razonSocial": "Transporte ABC",      // Obligatorio
  "tipo": "Empresa",                    // Obligatorio - "Productor" o "Empresa"
  "correo": "contacto@abc.com",         // Obligatorio
  "nombre": "Pedro",                    // Obligatorio si NO envías idPersona
  "apellido": "González",               // Obligatorio si NO envías idPersona
  "cuit": "20987654321",                // Obligatorio si NO envías idPersona
  "telefono": "1187654321",             // Obligatorio si NO envías idPersona
  "idLocalidad": 1,                     // Obligatorio
  "observaciones": "Cliente nuevo"      // Opcional
}

Response (201):
{
  "status": "success",
  "data": {
    "idCliente": 2,
    "razonSocial": "Transporte ABC",
    "tipo": "Empresa",
    "correo": "contacto@abc.com",
    "idPersona": 2,
    "idLocalidad": 1,
    "observaciones": "Cliente nuevo",
    "persona": {
      "idPersona": 2,
      "nombre": "Pedro",
      "apellido": "González",
      "cuit": "20987654321",
      "telefono": "1187654321"
    },
    "localidad": {...}
  }
}
```

✅ **La Persona se crea automáticamente**

⚠️ **Importante:**
- Debes enviar SOLO `idPersona` O los datos completos de persona, no ambos
- Si creas Persona integrada, el CUIT no debe existir en BD

### ACTUALIZAR CLIENTE (PUT)
```http
PUT /api/clients/1
Content-Type: application/json

{
  "razonSocial": "Transporte ABC",      // Opcional
  "tipo": "pyme",                       // Opcional
  "correo": "nuevo@abc.com",            // Opcional
  "idLocalidad": 5,                     // Opcional
  "observaciones": "Cliente regular",   // Opcional
  
  // Datos de Persona (Opcional - editar nombre, apellido, teléfono, etc.)
  "nombre": "Alberto Nuevo",            // Opcional
  "apellido": "Rodríguez López",        // Opcional
  "cuit": "30123456789",                // Opcional (debe ser único)
  "telefono": "1188888888"              // Opcional
}

Response (200):
{
  "status": "success",
  "data": {
    "idCliente": 1,
    "razonSocial": "Transporte ABC",
    "tipo": "pyme",
    "correo": "nuevo@abc.com",
    "idLocalidad": 5,
    "observaciones": "Cliente regular",
    "idPersona": 1,
    "persona": {
      "idPersona": 1,
      "nombre": "Alberto Nuevo",
      "apellido": "Rodríguez López",
      "cuit": "30123456789",
      "telefono": "1188888888"
    },
    "localidad": {
      "idLocalidad": 5,
      "nombre": "San Isidro"
    }
  }
}
```

⚠️ **Nota:** Puedes actualizar cualquier combinación de campos. Ejemplos:
- Solo datos cliente: `{razonSocial: "Nuevo Nombre", correo: "mail@nuevo.com"}`
- Solo datos de persona: `{nombre: "Alberto", telefono: "1188888888"}`
- Mezcla completa: `{razonSocial: "ABC Transport", nombre: "Alberto", cuit: "30123456789"}`

### ELIMINAR CLIENTE (DELETE)
```http
DELETE /api/clients/1

Response (200):
{
  "status": "success",
  "message": "Cliente eliminado correctamente"
}
```

---

## DOCUMENTACIÓN ENDPOINTS
**Base URL:** `/api/documentations`

### OBTENER TODAS LAS DOCUMENTACIONES (GET)
```http
GET /api/documentations

Response (200):
{
  "status": "success",
  "data": [
    {
      "idDocumentacion": 1,
      "nombre": "Licencia de Conducir",
      "estado": "Vigente",
      "fechaVencimiento": "2026-10-12",
      "tipoEntidad": "CHOFER",
      "idChofer": 1,
      "detalle": "Sin detalles",
      "renovacion": 365
    }
  ]
}
```

### OBTENER POR ID (GET)
```http
GET /api/documentations/1
```

### CREAR DOCUMENTACIÓN (POST)
```http
POST /api/documentations
Content-Type: multipart/form-data

{
  "nombre": "Licencia de Conducir",     // Obligatorio
  "estado": "Vigente",                  // Obligatorio - Vigente o Vencida
  "fechaVencimiento": "2026-10-12",     // Obligatorio
  "tipoEntidad": "CHOFER",              // Obligatorio - CHOFER o VEHICULO
  "idChofer": 1,                        // Si tipoEntidad es CHOFER
  "detalle": "Sin detalles",            // Opcional
  "renovacion": 365,                    // OBLIGATORIO - Días
  "file": <archivo>                     // Opcional - Para subir archivo
}

Response (201):
{...documentación creada...}
```

### ACTUALIZAR DOCUMENTACIÓN (PUT)
```http
PUT /api/documentations/1
Content-Type: multipart/form-data

{
  "estado": "Vencida",                  // Opcional
  "fechaVencimiento": "2025-10-12"      // Opcional
}

Response (200):
{...documentación actualizada...}
```

### ELIMINAR DOCUMENTACIÓN (DELETE)
```http
DELETE /api/documentations/1

Response (200):
{
  "status": "success",
  "message": "Documentación eliminada correctamente"
}
```

---

## GASTOS ENDPOINTS
**Base URL:** `/api/expenses`

### OBTENER TODOS LOS GASTOS (GET)
```http
GET /api/expenses
GET /api/expenses?idGasto=1

Response (200):
{
  "status": "success",
  "data": [
    {
      "idGasto": 1,
      "detalle": "Combustible",
      "monto": 500.50,
      "tipo": "Combustible",
      "idViaje": 5
    }
  ]
}
```

### OBTENER GASTO POR ID (GET)
```http
GET /api/expenses/1

Response (200):
{...gasto detail...}
```

### OBTENER GASTOS POR VIAJE (GET)
```http
GET /api/expenses/viaje/5

Response (200):
{...gastos del viaje 5...}
```

### CREAR GASTO (POST)
```http
POST /api/expenses
Content-Type: application/json

{
  "detalle": "Combustible",             // Obligatorio
  "monto": 500.50,                      // Obligatorio
  "tipo": "Combustible",                // Obligatorio
  "idViaje": 5                          // Obligatorio
}

Response (201):
{...gasto creado...}
```

### ACTUALIZAR GASTO (PUT)
```http
PUT /api/expenses/1
Content-Type: application/json

{
  "monto": 600,                         // Opcional
  "detalle": "Combustible - Argentina"  // Opcional
}

Response (200):
{...gasto actualizado...}
```

### ELIMINAR GASTO (DELETE)
```http
DELETE /api/expenses/1

Response (200):
{
  "status": "success",
  "message": "Gasto eliminado correctamente"
}
```

---

## PERSONAS ENDPOINTS
**Base URL:** `/api/persons`

### OBTENER TODAS LAS PERSONAS (GET)
```http
GET /api/persons

Response (200):
{
  "status": "success",
  "data": [
    {
      "idPersona": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "cuit": "20123456789",
      "telefono": "1123456789"
    }
  ]
}
```

### OBTENER PERSONA POR ID (GET)
```http
GET /api/persons/1
```

### CREAR PERSONA (POST)
```http
POST /api/persons
Content-Type: application/json

{
  "nombre": "Juan",                     // Obligatorio
  "apellido": "Pérez",                  // Obligatorio
  "cuit": "20123456789",                // Obligatorio - Único
  "telefono": "1123456789"              // Obligatorio
}

Response (201):
{...persona creada...}
```

### ACTUALIZAR PERSONA (PUT)
```http
PUT /api/persons/1
Content-Type: application/json

{
  "telefono": "1123456790"              // Opcional
}

Response (200):
{...persona actualizada...}
```

### ELIMINAR PERSONA (DELETE)
```http
DELETE /api/persons/1

Response (200):
{
  "status": "success"
}
```

---

## PROVINCIAS ENDPOINTS
**Base URL:** `/api/provincias`

### OBTENER TODAS LAS PROVINCIAS (GET)
```http
GET /api/provincias

Response (200):
{
  "status": "success",
  "data": [
    {
      "idProvincia": 1,
      "nombre": "Buenos Aires"
    }
  ]
}
```

### CREAR PROVINCIA (POST)
```http
POST /api/provincias
Content-Type: application/json

{
  "nombre": "Córdoba"                   // Obligatorio
}

Response (201):
{...provincia creada...}
```

---

## LOCALIDADES ENDPOINTS
**Base URL:** `/api/localidades`

### OBTENER TODAS LAS LOCALIDADES (GET)
```http
GET /api/localidades
GET /api/localidades?idProvincia=1

Response (200):
{
  "status": "success",
  "data": [
    {
      "idLocalidad": 1,
      "nombre": "Quilmes",
      "codPostal": 1880,
      "idProvincia": 1
    }
  ]
}
```

### OBTENER LOCALIDAD POR ID (GET)
```http
GET /api/localidades/1
```

### CREAR LOCALIDAD (POST)
```http
POST /api/localidades
Content-Type: application/json

{
  "nombre": "La Plata",                 // Obligatorio
  "codPostal": 1900,                    // Obligatorio
  "idProvincia": 1                      // Obligatorio
}

Response (201):
{...localidad creada...}
```

### ACTUALIZAR LOCALIDAD (PUT)
```http
PUT /api/localidades/1
Content-Type: application/json

{
  "codPostal": 1901                     // Opcional
}

Response (200):
{...localidad actualizada...}
```

### ELIMINAR LOCALIDAD (DELETE)
```http
DELETE /api/localidades/1
```

---

## MANTENIMIENTOS ENDPOINTS
**Base URL:** `/api/mantenimientos`

### OBTENER TODOS (GET)
```http
GET /api/mantenimientos

Response (200):
{
  "status": "success",
  "data": [
    {
      "idMantenimiento": 1,
      "fechaInicio": "2026-01-15",
      "fechaFin": "2026-01-18",
      "tipo": "Revisión",
      "observaciones": "Cambio de aceite",
      "idVehiculo": 1
    }
  ]
}
```

### OBTENER POR ID (GET)
```http
GET /api/mantenimientos/1
```

### CREAR MANTENIMIENTO (POST)
```http
POST /api/mantenimientos
Content-Type: application/json

{
  "fechaInicio": "2026-01-15",          // Obligatorio
  "fechaFin": "2026-01-18",             // Obligatorio
  "tipo": "Revisión",                   // Obligatorio
  "idVehiculo": 1,                      // Obligatorio
  "observaciones": "Cambio de aceite"   // Opcional
}

Response (201):
{...mantenimiento creado...}
```

### ACTUALIZAR MANTENIMIENTO (PUT)
```http
PUT /api/mantenimientos/1
Content-Type: application/json

{
  "tipo": "Reparación",                 // Opcional
  "observaciones": "Reparación de motor" // Opcional
}

Response (200):
{...mantenimiento actualizado...}
```

### ELIMINAR MANTENIMIENTO (DELETE)
```http
DELETE /api/mantenimientos/1

Response (200):
{
  "status": "success",
  "message": "Mantenimiento eliminado correctamente"
}
```

---

## USUARIOS ENDPOINTS
**Base URL:** `/api/users`

### REGISTRAR USUARIO (POST)
```http
POST /api/users/register
Content-Type: application/json

{
  "nombreUsuario": "juan_perez",        // Obligatorio - Único
  "contraseña": "password123",          // Obligatorio
  "rol": "admin",                       // Obligatorio
  "idPersona": 1                        // Obligatorio
}

Response (201):
{
  "status": "success",
  "data": {
    "idUsuario": 1,
    "nombreUsuario": "juan_perez",
    "rol": "admin"
  }
}
```

---

## AUTENTICACIÓN ENDPOINTS
**Base URL:** `/api` (auth)

### LOGIN (POST)
```http
POST /api/login
Content-Type: application/json

{
  "nombreUsuario": "juan_perez",
  "contraseña": "password123"
}

Response (200):
{
  "status": "success",
  "token": "eyJhbGc..."
}
```

---

## 🚫 ENDPOINTS ELIMINADOS (No usar)

**Ya no existen después de la refactorización:**

- ❌ `GET /api/chofer-vehiculos` 
- ❌ `POST /api/chofer-vehiculos`
- ❌ `PUT /api/chofer-vehiculos/:id`
- ❌ `DELETE /api/chofer-vehiculos/:id`
- ❌ `POST /api/drivers/:id/asignar-camion`

**Razón:** La tabla `ChoferXVehiculo` ahora se mantiene automáticamente con triggers desde la tabla `Viaje`.

---

## ⚡ CAMBIOS CLAVE EN LA API

### Crear/Actualizar Viajes

| Campo | Antes | Después | Notas |
|-------|-------|---------|-------|
| `idChoferVehiculo` | ✅ Obligatorio | ❌ Eliminado | |
| `idChofer` | ❌ No existía | ✅ Obligatorio | Enviar directamente |
| `idVehiculo` | ❌ No existía | ✅ Obligatorio | Enviar directamente |
| `estado` | ✅ Manual | ❌ Automático (POST) | Solo enviar en PUT si es CANCELADO |

### Validaciones Automáticas

| Situación | Antes | Después |
|-----------|-------|---------|
| Chofer ocupado en rango | ❌ No se validaba | ✅ Se valida con temporal |
| Vehículo ocupado en rango | ❌ No se validaba | ✅ Se valida con temporal |
| Viaje futuro (estado) | ❌ Manual | ✅ Automático |
| Viaje cancelado libera recursos | ❌ Manual | ✅ Automático |

---

## 📌 RESUMEN PARA FRONTEND

### Flujo típico:

1. **Crear Viaje**
   ```
   POST /viajes {idChofer, idVehiculo, fechaInicio, fechaFin, ...}
   → Sistema valida disponibilidad temporal
   → Estado se calcula automáticamente
   ```

2. **Cancelar Viaje**
   ```
   PUT /viajes/5 {estado: "CANCELADO", motivoCancelacion: "..."}
   → Se libera chofer y vehículo automáticamente
   → Ahora pueden usarse en ese rango de fechas
   ```

3. **Cambiar asignación**
   ```
   PUT /viajes/5 {idChofer: 2, idVehiculo: 3}
   → Sistema valida que nuevo chofer/vehículo estén disponibles
   → Si hay conflicto, retorna error 400
   ```

4. **Ver historial chofer**
   ```
   GET /api/drivers/1/historial?desde=2026-01-01&hasta=2026-02-28
   → Todos los viajes del chofer en ese período
   ```
