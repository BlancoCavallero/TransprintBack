/*const db = require("../config/db");

const verificarDocumentacion = async (idChofer) => {

  function normalizarFecha(fecha) {
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  return f;
  }

  const hoy = normalizarFecha(new Date());

  // Traigo toda la documentación del chofer
  const [documentos] = await db.query(
    "SELECT nombre, fechaVencimiento FROM Documentacion WHERE idChofer = ?",
    [idChofer]
  );

  if (!documentos || documentos.length === 0) {
    return false; // no tiene documentación
  }

  // Busco los documentos clave
  const carnet = documentos.find(doc => doc.nombre.toLowerCase() === "carnet");
  const examen = documentos.find(doc => doc.nombre.toLowerCase() === "examen");

  if (!carnet || !examen) {
    return false; // le falta alguno
  }

  // Verifico vencimientos
  const carnetVigente = normalizarFecha(carnet.fechaVencimiento) >= hoy;
  const examenVigente = normalizarFecha(examen.fechaVencimiento) >= hoy;

  return carnetVigente && examenVigente;
};

const registrarChofer = async (data) => {
  const { dni, idPersona } = data;
  const idPersona = personaResult.insertId;
  //const estadoDoc = verificarDocumentacion(idChofer) ? "libre" : "inhabilitado";
  //activar las constantes anteriores cuando se tenga los modulos Persona y Documentacion.
  const estadoDisponibilidad = "inhabilitado";

  const [choferResult] = await db.query(
    "INSERT INTO Chofer (dni, estadoDisponibilidad, idPersona) VALUES (?, ?, ?)",
    [dni, estadoDisponibilidad, idPersona]
  );

  return { idChofer: choferResult.insertId, idPersona, estadoDisponibilidad };
};

exports.modificarChofer = async (idChofer, data) => {
  const { nombre, apellido, telefono, fechaVencimientoCarnet, fechaVencimientoExamen } = data;

  const estadoDoc = verificarDocumentacion({ fechaVencimientoCarnet, fechaVencimientoExamen }) ? "libre" : "inhabilitado";

  await db.query(
    `UPDATE Persona p
     JOIN Chofer c ON c.idPersona = p.idPersona
     SET p.nombre = ?, p.apellido = ?, p.telefono = ?, c.fechaVencimientoCarnet = ?, c.fechaVencimientoExamen = ?, c.estadoDisponibilidad = ?
     WHERE c.idChofer = ?`,
    [nombre, apellido, telefono, fechaVencimientoCarnet, fechaVencimientoExamen, estadoDoc, idChofer]
  );

  return { idChofer, actualizado: true, estadoDisponibilidad: estadoDoc };
};

exports.eliminarChofer = async (idChofer) => {
  const [viajes] = await db.query(
    "SELECT * FROM Viaje WHERE idChofer = ? AND estado = 'activo'",
    [idChofer]
  );
  if (viajes.length > 0) throw new Error("El chofer tiene viajes activos y no puede eliminarse");

  await db.query("UPDATE Chofer SET estadoDisponibilidad = 'inhabilitado' WHERE idChofer = ?", [idChofer]);
};

exports.buscarChofer = async (filters) => {
  let query = `
    SELECT c.idChofer, p.nombre, p.apellido, p.dni, c.estadoDisponibilidad
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE 1=1
  `;
  const params = [];
  if (filters.nombre) { query += " AND p.nombre LIKE ?"; params.push(`%${filters.nombre}%`); }
  if (filters.apellido) { query += " AND p.apellido LIKE ?"; params.push(`%${filters.apellido}%`); }

  const [rows] = await db.query(query, params);
  return rows;
};

exports.consultarHistorial = async (idChofer, { desde, hasta, estado }) => {
  let query = "SELECT fecha, origen, destino, camion, estado, gastos FROM Viaje WHERE idChofer = ?";
  const params = [idChofer];

  if (desde) { query += " AND fecha >= ?"; params.push(desde); }
  if (hasta) { query += " AND fecha <= ?"; params.push(hasta); }
  if (estado) { query += " AND estado = ?"; params.push(estado); }

  const [rows] = await db.query(query, params);
  return rows;
};

exports.consultarDisponibilidad = async (idChofer) => {
  const [[chofer]] = await db.query("SELECT estadoDisponibilidad FROM Chofer WHERE idChofer = ?", [idChofer]);
  return chofer ? chofer.estadoDisponibilidad : null;
};

exports.asignarCamion = async (idChofer, idCamion) => {
  const [[camion]] = await db.query("SELECT estado FROM Camion WHERE idCamion = ?", [idCamion]);
  if (!camion || camion.estado !== "disponible") throw new Error("El camión no está disponible");

  await db.query("UPDATE Camion SET idChofer = ?, estado = 'asignado' WHERE idCamion = ?", [idChofer, idCamion]);
  await db.query("UPDATE Chofer SET estadoDisponibilidad = 'ocupado' WHERE idChofer = ?", [idChofer]);

  return { idChofer, idCamion, asignado: true };
};


module.exports = {
  registrarChofer,
  obtenerTodas,
  obtenerPorId,
  obtenerPorCuit,
  actualizar,
  eliminar
}

*/