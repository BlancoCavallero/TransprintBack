const db = require("../config/db");

const normalizarFecha = (fecha) => {
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0); // pone la hora a 00:00:00
  return f;
};

const formatearFechaCorta = (fecha) => {
  const f = new Date(fecha);
  const yyyy = f.getFullYear();
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const dd = String(f.getDate() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Obtener todas las documentaciones
const obtenerTodas = async () => {
  const [rows] = await db.query(`
    SELECT d.*,
           v.idVehiculo AS vehiculoId, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.patente AS vehiculoPatente, v.tipo AS vehiculoTipo,
           c.idChofer AS choferId, c.dni AS choferDni,
           p.idPersona AS personaId, p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Documentacion d
    LEFT JOIN Vehiculo v ON d.idVehiculo = v.idVehiculo
    LEFT JOIN Chofer c ON d.idChofer = c.idChofer
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
  `);

  const hoy = normalizarFecha(new Date());
  const mapped = rows.map((doc) => {
    const vencimiento = normalizarFecha(doc.fechaVencimiento);
    const estado = vencimiento < hoy ? "Vencida" : "Vigente";
    return {
      idDocumentacion: doc.idDocumentacion,
      detalle: doc.detalle,
      nombre: doc.nombre,
      renovacion: doc.renovacion,
      fechaVencimiento: formatearFechaCorta(vencimiento),
      estado,
      vehiculo: doc.vehiculoId
        ? {
            idVehiculo: doc.vehiculoId,
            marca: doc.vehiculoMarca,
            modelo: doc.vehiculoModelo,
            patente: doc.vehiculoPatente,
            tipo: doc.vehiculoTipo,
          }
        : null,
      chofer: doc.choferId
        ? {
            idChofer: doc.choferId,
            dni: doc.choferDni,
            persona: doc.personaId
              ? {
                  idPersona: doc.personaId,
                  nombre: doc.personaNombre,
                  apellido: doc.personaApellido,
                  cuit: doc.personaCuit,
                  telefono: doc.personaTelefono,
                }
              : null,
          }
        : null,
    };
  });
  return mapped;
};

// Obtener una documentación por ID
const obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `
    SELECT d.*,
           v.idVehiculo AS vehiculoId, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.patente AS vehiculoPatente, v.tipo AS vehiculoTipo,
           c.idChofer AS choferId, c.dni AS choferDni,
           p.idPersona AS personaId, p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Documentacion d
    LEFT JOIN Vehiculo v ON d.idVehiculo = v.idVehiculo
    LEFT JOIN Chofer c ON d.idChofer = c.idChofer
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
    WHERE d.idDocumentacion = ?
  `,
    [id]
  );

  const r = rows[0];
  if (!r) return null;
  const hoy = normalizarFecha(new Date());
  const vencimiento = normalizarFecha(r.fechaVencimiento);
  const estado = vencimiento < hoy ? "Vencida" : "Vigente";
  return {
    idDocumentacion: r.idDocumentacion,
    detalle: r.detalle,
    nombre: r.nombre,
    renovacion: r.renovacion,
    fechaVencimiento: formatearFechaCorta(vencimiento),
    estado,
    vehiculo: r.vehiculoId
      ? {
          idVehiculo: r.vehiculoId,
          marca: r.vehiculoMarca,
          modelo: r.vehiculoModelo,
          patente: r.vehiculoPatente,
          tipo: r.vehiculoTipo,
        }
      : null,
    chofer: r.choferId
      ? {
          idChofer: r.choferId,
          dni: r.choferDni,
          persona: r.personaId
            ? {
                idPersona: r.personaId,
                nombre: r.personaNombre,
                apellido: r.personaApellido,
                cuit: r.personaCuit,
                telefono: r.personaTelefono,
              }
            : null,
        }
      : null,
  };
};

const obtenerPorDetalle = async (detalle) => {
  const [rows] = await db.query(
    "SELECT * FROM Documentacion WHERE detalle = ?",
    [detalle]
  );
  return rows[0];
};

// Crear nueva documentación
const crear = async (data) => {
  const {
    detalle,
    nombre,
    renovacion,
    fechaVencimiento,
    idVehiculo,
    idChofer,
  } = data;

  //verifico que el Chofer ya esté registrado
  const [existeChofer] = await db.query(
    "SELECT * FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  if (existeChofer.length == 0) {
    throw new Error("El idChofer ingresado no existe ");
  }

  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt = parseInt(idVehiculo, 10) || null;
  const idChoferInt = parseInt(idChofer, 10) || null;

  const fechaNormalizada = normalizarFecha(fechaVencimiento);
  const [result] = await db.query(
    "INSERT INTO Documentacion (detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer) VALUES (?, ?, ?, ?, ?, ?)",
    [
      detalle,
      nombre,
      renovacionInt,
      fechaVencimiento,
      idVehiculoInt,
      idChoferInt,
    ]
  );

  const id = result.insertId;
  // Devolver el objeto completo con vehiculo y chofer anidados
  return await obtenerPorId(id);
};

// Actualizar documentación
const actualizar = async (id, data) => {
  const {
    detalle,
    nombre,
    renovacion,
    fechaVencimiento,
    idVehiculo,
    idChofer,
  } = data;

  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt = parseInt(idVehiculo, 10) || null;
  const idChoferInt = parseInt(idChofer, 10) || null;
  //si no viene fecha de vencimiento queda el valor que estaba
  const fechaNormalizada = fechaVencimiento
    ? normalizarFecha(fechaVencimiento)
    : resultado.fechaVencimiento;
  await db.query(
    "UPDATE Documentacion SET detalle = ?, nombre = ?, renovacion = ?, fechaVencimiento = ?, idVehiculo = ?, idChofer = ? WHERE idDocumentacion = ?", //agregar idChofer e idVehículo
    [
      detalle,
      nombre,
      renovacionInt,
      fechaNormalizada,
      idVehiculoInt,
      idChoferInt,
      id,
    ]
  );
  return await obtenerPorId(id);
};

// Eliminar documentación
const eliminar = async (id) => {
  await db.query("DELETE FROM Documentacion WHERE idDocumentacion = ?", [id]);
  return { mensaje: "Documentación eliminada correctamente" };
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorDetalle,
  crear,
  actualizar,
  eliminar,
};
