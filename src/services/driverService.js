const db = require("../config/db");

// --- Función para verificar la documentación de un chofer ---
const verificarDocumentacion = async (idChofer) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [documentos] = await db.query(
    "SELECT nombre, fechaVencimiento FROM Documentacion WHERE idChofer = ?",
    [idChofer]
  );

  if (!documentos.length) return false;

  // Buscar carnet y examen médico, por ejemplo
  const carnet = documentos.find(d => d.nombre.toLowerCase().includes("carnet"));
  const examen = documentos.find(d => d.nombre.toLowerCase().includes("examen"));

  if (!carnet || !examen) return false;

  const carnetVigente = new Date(carnet.fechaVencimiento) >= hoy;
  const examenVigente = new Date(examen.fechaVencimiento) >= hoy;

  return carnetVigente && examenVigente;
};

// --- Registrar chofer ---
const registrarChofer = async (data) => {
  const { dni, idPersona } = data;

  const estadoDoc = await verificarDocumentacion(data.idChofer);
  const estadoDisponibilidad = estadoDoc ? "Libre" : "Inhabilitado";
  
  //verifico que no se repita el dni
  const [existeDni] = await db.query(
    "SELECT * FROM Chofer WHERE dni = ?",
    [dni]
  );
  if (existeDni.length > 0) {
    throw new Error("Ya existe un chofer registrado con ese dni");
  } 

  //verifico que el idPersona no esté usado en otro chofer
  const [existe] = await db.query(
    "SELECT * FROM Chofer WHERE idPersona = ?",
    [idPersona]
  );
  if (existe.length > 0) {
    throw new Error("Ya existe un chofer registrado con ese idPersona");
  } 

  //verifico que la persona ya esté registrada
  const [existePersona] = await db.query(
    "SELECT * FROM Persona WHERE idPersona = ?",
    [idPersona]
  );
  if (existePersona.length == 0) {
    throw new Error("El idPersona ingresado no existe ");
  }
  
  const [result] = await db.query(
    "INSERT INTO Chofer (dni, estadoDisponibilidad, idPersona) VALUES (?, ?, ?)",
    [dni, estadoDisponibilidad, idPersona]
  );

  return { idChofer: result.insertId, idPersona, estadoDisponibilidad };
};

// --- Modificar chofer ---
const modificarChofer = async (idChofer, data) => {
  const { dni, idPersona } = data;

  //Verifico que el chofer exista
  const [choferExistente] = await db.query(
    "SELECT * FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  if (choferExistente.length === 0) {
    throw new Error("El chofer no existe");
  }

  //verifico que no se repita el dni
  const [existeDni] = await db.query(
    "SELECT * FROM Chofer WHERE dni = ?  AND idChofer != ?",
    [dni, idChofer]
  );
  if (existeDni.length > 0) {
    throw new Error("Ya existe un chofer registrado con ese DNI");
  } 

  //verifico que el idPersona no esté usado en otro chofer
  const [existe] = await db.query(
    "SELECT * FROM Chofer WHERE idPersona = ?",
    [idPersona]
  );
  if (existe.length > 0) {
    throw new Error("Ya existe un chofer registrado con ese idPersona");
  } 

   //verifico que la persona ya esté registrada
  const [existePersona] = await db.query(
    "SELECT * FROM Persona WHERE idPersona = ?",
    [idPersona]
  );
  if (existePersona.length === 0) {
    throw new Error("El idPersona ingresado no existe ");
  }

  await db.query(
    "UPDATE Chofer SET dni = ?, idPersona = ? WHERE idChofer = ?",
    [dni, idPersona, idChofer]
  );

  return { idChofer, actualizado: true };
};

// --- Eliminar chofer ---
const eliminarChofer = async (idChofer) => {
//activar cuando exista viaje
/*  const [viajes] = await db.query(
    "SELECT * FROM Viaje WHERE idChofer = ? AND estado = 'activo'",
    [idChofer]
  );
  if (viajes.length > 0)
    throw new Error("El chofer tiene viajes activos y no puede eliminarse");
*/
  await db.query(
    "UPDATE Chofer SET estadoDisponibilidad = 'Inhabilitado' WHERE idChofer = ?",
    [idChofer]
  );
};

// --- Obtener todos los choferes ---
const obtenerChoferes = async () => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad,
           p.nombre, p.apellido, p.cuit, p.telefono, p.idPersona
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
  `);
  return rows;
};

// --- Obtener un chofer ---
const obtenerPorId = async (idChofer) => {
  const [[row]] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE c.idChofer = ?
  `, [idChofer]);
  return row;
};


// --- Consultar historial de viajes ---
const consultarHistorial = async (idChofer, { desde, hasta, estado }) => {
  let query = "SELECT fecha, origen, destino, vehiculo, estado, gastos FROM Viaje WHERE idChofer = ?";
  const params = [idChofer];

  if (desde) { query += " AND fecha >= ?"; params.push(desde); }
  if (hasta) { query += " AND fecha <= ?"; params.push(hasta); }
  if (estado) { query += " AND estado = ?"; params.push(estado); }

  const [rows] = await db.query(query, params);
  return rows;
};

// --- Consultar disponibilidad ---
const consultarDisponibilidad = async (idChofer) => {
  const [[chofer]] = await db.query(
    "SELECT estadoDisponibilidad FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  return chofer ? chofer.estadoDisponibilidad : null;
};

// --- Asignar vehiculo a chofer ---
const asignarVehiculo = async (idChofer, idVehiculo) => {
  const [[vehiculo]] = await db.query(
    "SELECT estado FROM Vehiculo WHERE idVehiculo = ?",
    [idVehiculo]
  );
  if (!vehiculo || vehiculo.estado !== "disponible") throw new Error("El vehículo no está disponible");

  await db.query(
    "UPDATE Vehiculo SET idChofer = ?, estado = 'asignado' WHERE idVehiculo = ?",
    [idChofer, idVehiculo]
  );

  await db.query(
    "UPDATE Chofer SET estadoDisponibilidad = 'Ocupado' WHERE idChofer = ?",
    [idChofer]
  );

  return { idChofer, idVehiculo, asignado: true };
};

module.exports = {
  registrarChofer,
  modificarChofer,
  eliminarChofer,
  obtenerChoferes,
  obtenerPorId,
  verificarDocumentacion,
  consultarHistorial,
  consultarDisponibilidad,
  asignarVehiculo
};
