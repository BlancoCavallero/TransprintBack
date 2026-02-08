# 📊 Documentación - Módulo de Reportes (Backend)

## 📋 Descripción General

El módulo de reportes permite generar informes financieros basados en viajes finalizados. Calcula automáticamente ingresos, gastos, ganancias y estadísticas relacionadas con viajes completados.

---

## 🏗️ Arquitectura

### Archivos del Módulo

```
TransprintBack/src/
├── services/
│   └── reporteService.js          # Lógica de negocio y queries SQL
├── controllers/
│   └── reporteController.js       # Manejo de requests HTTP
└── routes/
    └── reportes.js               # Definición de endpoints
```

### Registro en `server.js`

```javascript
const reporteRoutes = require("./src/routes/reportes");
app.use("/api/reportes", reporteRoutes);
```

---

## 🔌 Endpoints Disponibles

### Base URL
```
http://localhost:5000/api/reportes
```

### 1️⃣ Reporte de Ganancias
```http
GET /api/reportes/ganancias?mes=1&anio=2026
```

**Query Parameters:**
- `mes` (opcional): Mes del 1 al 12
- `anio` (opcional): Año (default: año actual)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalizadores": {
      "ingresos": 2000.00,
      "gastos": 208222.00,
      "ganancia": -206222.00,
      "margenGanancia": -10311.10
    },
    "viajes": [
      {
        "idViaje": 7,
        "fechaInicio": "2026-01-20",
        "fechaFin": "2026-01-31",
        "localidadOrigen": "Avellaneda",
        "localidadDestino": "San Carlos de Bariloche",
        "kilometros": 400,
        "precio": 2000.00,
        "gastos": 208222.00,
        "ganancia": -206222.00
      }
    ],
    "filtros": {
      "mes": 1,
      "anio": 2026
    }
  }
}
```

---

### 2️⃣ Reporte de Gastos
```http
GET /api/reportes/gastos?mes=1&anio=2026
```

**Query Parameters:**
- `mes` (opcional): Mes del 1 al 12
- `anio` (opcional): Año (default: año actual)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalizadores": {
      "combustible": 0.00,
      "viatico": 202900.00,
      "peaje": 5322.00,
      "total": 208222.00
    },
    "gastos": [
      {
        "idGasto": 1,
        "fecha": "2026-01-31",
        "tipo": "Viatico",
        "descripcion": "Comida",
        "precio": 100000.00,
        "viaje": {
          "idViaje": 7,
          "localidadOrigen": "Avellaneda",
          "localidadDestino": "San Carlos de Bariloche"
        }
      }
    ],
    "filtros": {
      "mes": 1,
      "anio": 2026
    }
  }
}
```

---

### 3️⃣ Reporte de Viáticos por Chofer
```http
GET /api/reportes/viaticos?mes=1&anio=2026
```

**Query Parameters:**
- `mes` (opcional): Mes del 1 al 12
- `anio` (opcional): Año (default: año actual)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalizadores": {
      "totalViaticos": 202900.00,
      "cantidadChoferes": 1
    },
    "choferes": [
      {
        "idChofer": 1,
        "nombre": "Axel",
        "apellido": "Monzon",
        "nombreCompleto": "Axel Monzon",
        "totalViaticos": 202900.00,
        "cantidadViajes": 1
      }
    ],
    "filtros": {
      "mes": 1,
      "anio": 2026
    }
  }
}
```

---

## 🔍 Lógica de Negocio

### ⚠️ IMPORTANTE: Viajes Finalizados

Los reportes NO usan el campo `estado` de la base de datos, ya que este se calcula dinámicamente en el servicio de viajes.

**Condición para considerar un viaje como finalizado:**
```sql
WHERE v.estado != 'CANCELADO' 
  AND v.fechaFin < CURDATE()
```

Un viaje está "finalizado" cuando:
- ✅ No está cancelado
- ✅ Su fecha de fin es menor que la fecha actual

### Filtrado por Fecha

**Sin filtro de mes (anual):**
```sql
WHERE YEAR(v.fechaFin) = 2026
```

**Con filtro de mes:**
```sql
WHERE YEAR(v.fechaFin) = 2026 
  AND MONTH(v.fechaFin) = 1
```

---

## 📊 Cálculos Realizados

### Reporte de Ganancias

```javascript
// Por cada viaje
precio = viaje.precio
gastos = SUM(gastos del viaje)
ganancia = precio - gastos

// Totales
ingresosTotal = SUM(precio de todos los viajes)
gastosTotal = SUM(gastos de todos los viajes)
gananciaTotal = ingresosTotal - gastosTotal
margenGanancia = (gananciaTotal / ingresosTotal) * 100
```

### Reporte de Gastos

Agrupa gastos por tipo:
- **Combustible**: Suma de gastos tipo "Combustible"
- **Viatico**: Suma de gastos tipo "Viatico"
- **Peaje**: Suma de gastos tipo "Peaje"

### Reporte de Viáticos

Agrupa por chofer:
```sql
SUM(g.monto) WHERE g.tipo = 'Viatico'
GROUP BY c.idChofer
```

---

## 🔄 Flujo de Ejecución

```
1. Request HTTP → routes/reportes.js
2. Validación de parámetros → controllers/reporteController.js
   - Valida mes (1-12)
   - Valida año (2000-2100)
3. Lógica de negocio → services/reporteService.js
   - Construye query SQL
   - Ejecuta consulta a base de datos
   - Calcula totalizadores
   - Formatea respuesta
4. Response HTTP ← controllers/reporteController.js
```

---

## 🐛 Debugging

El módulo incluye logs detallados:

```javascript
🔵 [BACKEND] obtenerReporteGanancias - INICIO
📥 [BACKEND] Parámetros recibidos: { mes: 1, anio: 2026 }
📊 [BACKEND] Params: [ 2026, 1 ]
🔍 [BACKEND-DEBUG] Viajes con fechaFin < HOY
📊 [BACKEND-DEBUG] Total viajes FINALIZADOS (por fecha): 1
✅ [BACKEND] Viajes encontrados: 1
📤 [BACKEND] Retornando resultado: {...}
```

---

## 🧪 Ejemplos de Uso

### Obtener reporte anual completo (2026)
```bash
curl http://localhost:5000/api/reportes/ganancias?anio=2026
```

### Obtener reporte de enero 2026
```bash
curl http://localhost:5000/api/reportes/ganancias?mes=1&anio=2026
```

### Obtener gastos del mes actual
```bash
curl http://localhost:5000/api/reportes/gastos
```

---

## ⚙️ Validaciones

### Controller Level
- Mes entre 1 y 12
- Año entre 2000 y 2100

### Service Level
- Conversión a números enteros
- Valores por defecto (año actual si no se especifica)
- Formato de decimales (2 decimales)

---

## 🚀 Mantenimiento

### Para agregar un nuevo tipo de reporte:

1. **Crear función en `services/reporteService.js`**:
```javascript
const obtenerNuevoReporte = async (mes = null, anio = null) => {
  // Lógica del reporte
  return resultado;
};
```

2. **Exportar la función**:
```javascript
module.exports = {
  obtenerReporteGanancias,
  obtenerReporteGastos,
  obtenerReporteViaticos,
  obtenerNuevoReporte, // ← Nuevo
};
```

3. **Crear endpoint en `controllers/reporteController.js`**:
```javascript
const obtenerNuevoReporte = async (req, res, next) => {
  try {
    const reporte = await reporteService.obtenerNuevoReporte();
    successResponse(res, reporte);
  } catch (error) {
    next(error);
  }
};
```

4. **Registrar ruta en `routes/reportes.js`**:
```javascript
router.get("/nuevo", reporteController.obtenerNuevoReporte);
```

---

## 📝 Notas Importantes

- ⚠️ Los reportes solo consideran viajes con `fechaFin < CURDATE()`
- ⚠️ Los viajes cancelados NO se incluyen en ningún reporte
- ⚠️ El margen de ganancia puede ser negativo si los gastos superan los ingresos
- ⚠️ Todos los montos se formatean con 2 decimales
- ⚠️ Si no se especifica año, se usa el año actual por defecto
