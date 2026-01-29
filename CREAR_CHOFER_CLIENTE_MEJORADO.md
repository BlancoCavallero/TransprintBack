# Crear Chofer y Cliente con Persona Integrada

A partir de ahora puedes crear un Chofer o Cliente en **una sola llamada**, incluyendo los datos de Persona directamente. Ya no necesitas hacer dos llamadas al API.

## 📌 OPCIÓN 1: Crear Chofer CON Persona Existente (forma antigua)

Si ya tienes un `idPersona`, úsalo directamente:

```http
POST /api/drivers
Content-Type: application/json

{
  "dni": 12345678,
  "idPersona": 1
}

Response (201):
{
  "status": "success",
  "data": {
    "idChofer": 5,
    "dni": 12345678,
    "estadoDisponibilidad": "Inhabilitado",
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

---

## ⭐ OPCIÓN 2: Crear Chofer Y Persona AL MISMO TIEMPO (nueva)

Envía los datos de Persona directamente en la misma llamada. **NO incluyas `idPersona`**:

```http
POST /api/drivers
Content-Type: application/json

{
  "dni": 12345678,
  "nombre": "Juan",
  "apellido": "Pérez",
  "cuit": "20123456789",
  "telefono": "1123456789"
}

Response (201):
{
  "status": "success",
  "data": {
    "idChofer": 6,
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

✅ **La Persona se creó automáticamente en la BD**

---

## 📌 OPCIÓN 1: Crear Cliente CON Persona Existente (forma antigua)

Si ya tienes un `idPersona`, úsalo directamente:

```http
POST /api/clients
Content-Type: application/json

{
  "correo": "contacto@empresa.com",
  "razonSocial": "Transporte XYZ",
  "tipo": "Empresa",
  "idPersona": 1,
  "idLocalidad": 5,
  "observaciones": "Cliente VIP"
}

Response (201):
{
  "status": "success",
  "data": {
    "idCliente": 3,
    "correo": "contacto@empresa.com",
    "razonSocial": "Transporte XYZ",
    "tipo": "Empresa",
    "idPersona": 1,
    "idLocalidad": 5,
    "persona": {
      "idPersona": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "cuit": "20123456789",
      "telefono": "1123456789"
    },
    "localidad": {...}
  }
}
```

---

## ⭐ OPCIÓN 2: Crear Cliente Y Persona AL MISMO TIEMPO (nueva)

Envía los datos de Persona directamente. **NO incluyas `idPersona`**:

```http
POST /api/clients
Content-Type: application/json

{
  "correo": "contacto@empresa.com",
  "razonSocial": "Transporte ABC",
  "tipo": "Empresa",
  "nombre": "Pedro",
  "apellido": "González",
  "cuit": "20987654321",
  "telefono": "1187654321",
  "idLocalidad": 5,
  "observaciones": "Cliente nuevo"
}

Response (201):
{
  "status": "success",
  "data": {
    "idCliente": 4,
    "correo": "contacto@empresa.com",
    "razonSocial": "Transporte ABC",
    "tipo": "Empresa",
    "idPersona": 3,
    "idLocalidad": 5,
    "persona": {
      "idPersona": 3,
      "nombre": "Pedro",
      "apellido": "González",
      "cuit": "20987654321",
      "telefono": "1187654321"
    },
    "localidad": {...}
  }
}
```

✅ **La Persona se creó automáticamente en la BD**

---

## 🚨 Validaciones

### Para Chofer:
- **dni**: Obligatorio, debe ser un número de 7-8 dígitos
- **idPersona**: Opcional (si NO lo envías, debes enviar nombre+apellido+cuit+telefono)
- **nombre, apellido, cuit, telefono**: Obligatorios si NO envías idPersona
- El CUIT no debe existir en BD

### Para Cliente:
- **correo**: Obligatorio, debe ser válido
- **razonSocial**: Obligatorio
- **tipo**: Obligatorio ("Productor" o "Empresa")
- **idLocalidad**: Obligatorio
- **idPersona**: Opcional (si NO lo envías, debes enviar nombre+apellido+cuit+telefono)
- **nombre, apellido, cuit, telefono**: Obligatorios si NO envías idPersona
- El CUIT no debe existir en BD

---

## ⚡ Ventajas

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| Llamadas API para crear Chofer+Persona | 2 | 1 |
| Llamadas API para crear Cliente+Persona | 2 | 1 |
| Lógica en Frontend | Compleja | Simple |
| Tiempo de desarrollo | Más lento | Más rápido |
| Experiencia UX | Dos pasos | Un paso |

---

## 📋 Casos de uso

### Caso 1: Tengo una Persona existente (por ej, ya registrada en la BD)
```
POST /api/drivers → {dni, idPersona}
```

### Caso 2: Es una Persona nueva, creo Chofer+Persona juntos
```
POST /api/drivers → {dni, nombre, apellido, cuit, telefono}
```

### Caso 3: Tengo una Persona existente para Cliente
```
POST /api/clients → {correo, razonSocial, tipo, idPersona, idLocalidad}
```

### Caso 4: Es una Persona nueva, creo Cliente+Persona juntos
```
POST /api/clients → {correo, razonSocial, tipo, nombre, apellido, cuit, telefono, idLocalidad}
```

---

## 🔍 Errores comunes

❌ **Error**: Enviar `idPersona` Y datos de persona al mismo tiempo
```json
{
  "dni": 12345678,
  "idPersona": 1,
  "nombre": "Juan"
}
```
✅ **Solución**: Envía SOLO `idPersona` O SOLO los datos de persona, no ambos

❌ **Error**: No enviar ni `idPersona` ni datos de persona
```json
{
  "dni": 12345678
}
```
✅ **Solución**: Proporciona uno de los dos

❌ **Error**: Enviar datos de persona incompletos
```json
{
  "dni": 12345678,
  "nombre": "Juan"
}
```
✅ **Solución**: Si creas Persona integrada, envía nombre, apellido, cuit Y telefono
