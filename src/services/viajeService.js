const db = require("../config/db");

// ============================================================
// GET - obtener todos o filtrados
// ============================================================
const obtenerViajes = async (filtros = {}) => {
  let query = `
    SELECT v.*, cv.idChoferVehiculo
    FROM Viaje v
    LEFT JOIN ChoferVehiculo cv ON v.idChofer = cv.idChofer AND v.idVehiculo = cv.idVehiculo
    WHERE 1=1
  `;
  const params = [];

  if (filtros.idViaje) {
    query += " AND v.idViaje = ?";
    params.push(filtros.idViaje);
  }
  if (filtros.estado) {
    query += " AND v.estado LIKE ?";
    params.push(`%${filtros.estado}%`);
  }
  if (filtros.idCliente) {
    query += " AND v.idCliente = ?";
    params.push(filtros.idCliente);
  }
  if (filtros.idChoferVehiculo) {
    query += " AND cv.idChoferVehiculo = ?";
    params.push(filtros.idChoferVehiculo);
  }
  if (filtros.idLocalidadOrigen) {
    query += " AND v.idLocalidadOrigen = ?";
    params.push(filtros.idLocalidadOrigen);
  }
  if (filtros.idLocalidadDestino) {
    query += " AND v.idLocalidadDestino = ?";
    params.push(filtros.idLocalidadDestino);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

// ============================================================
// POST - crear viaje
// ============================================================
const crear = async (viaje) => {
  const { 
    estado, fecha, kilometros, observaciones, motivoCancelacion,
    precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo 
  } = viaje;

  // 1. Buscar chofer y vehículo desde idChoferVehiculo
  const [cv] = await db.query(
    `SELECT idChofer, idVehiculo 
     FROM ChoferVehiculo 
     WHERE idChoferVehiculo = ?`,
    [idChoferVehiculo]
  );

  if (cv.length === 0) {
    throw new Error("La relación Chofer–Vehículo no existe");
  }

  const { idChofer, idVehiculo } = cv[0];

  // 2. Crear viaje con esos datos
  const [result] = await db.query(
    `INSERT INTO Viaje 
      (estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, 
       idLocalidadOrigen, idLocalidadDestino, idChofer, idVehiculo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      estado, fecha, kilometros, observaciones, motivoCancelacion, precio,
      idCliente, idLocalidadOrigen, idLocalidadDestino, idChofer, idVehiculo
    ]
  );

  return { idViaje: result.insertId, ...viaje };
};

// ============================================================
// PUT - actualizar viaje
// ============================================================
const actualizar = async (id, viaje) => {
  const { 
    estado, fecha, kilometros, observaciones, motivoCancelacion, 
    precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo 
  } = viaje;

  // 1. Buscar los FKs desde ChoferVehiculo
  const [cv] = await db.query(
    `SELECT idChofer, idVehiculo 
     FROM ChoferVehiculo 
     WHERE idChoferVehiculo = ?`,
    [idChoferVehiculo]
  );

  if (cv.length === 0) {
    throw new Error("La relación Chofer–Vehículo no existe");
  }

  const { idChofer, idVehiculo } = cv[0];

  // 2. Actualizar viaje con nuevos FK
  await db.query(
    `UPDATE Viaje SET 
      estado=?, fecha=?, kilometros=?, observaciones=?, motivoCancelacion=?, 
      precio=?, idCliente=?, idLocalidadOrigen=?, idLocalidadDestino=?,
      idChofer=?, idVehiculo=?
     WHERE idViaje=?`,
    [
      estado, fecha, kilometros, observaciones, motivoCancelacion, 
      precio, idCliente, idLocalidadOrigen, idLocalidadDestino, 
      idChofer, idVehiculo, id
    ]
  );

  return { idViaje: id, ...viaje };
};

// ============================================================
// DELETE - eliminar viaje
// ============================================================
const eliminar = async (id) => {
  await db.query("DELETE FROM Viaje WHERE idViaje = ?", [id]);
  return { message: "Viaje eliminado correctamente" };
};

module.exports = {
  obtenerViajes,
  crear,
  actualizar,
  eliminar,
};
