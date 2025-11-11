const db = require("../config/db");

// ✅ GET - obtener todos o filtrados
const obtenerViajes = async (filtros = {}) => {
  let query = "SELECT * FROM Viaje WHERE 1=1";
  const params = [];

  if (filtros.idViaje) {
    query += " AND idViaje = ?";
    params.push(filtros.idViaje);
  }
  if (filtros.estado) {
    query += " AND estado LIKE ?";
    params.push(`%${filtros.estado}%`);
  }
  if (filtros.idCliente) {
    query += " AND idCliente = ?";
    params.push(filtros.idCliente);
  }
  if (filtros.idChoferVehiculo) {
    query += " AND idChoferVehiculo = ?";
    params.push(filtros.idChoferVehiculo);
  }
  if (filtros.idLocalidadOrigen) {
    query += " AND idLocalidadOrigen = ?";
    params.push(filtros.idLocalidadOrigen);
  }
  if (filtros.idLocalidadDestino) {
    query += " AND idLocalidadDestino = ?";
    params.push(filtros.idLocalidadDestino);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

// ✅ POST - crear viaje
const crear = async (viaje) => {
  const { estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo } = viaje;

  const [result] = await db.query(
    `INSERT INTO Viaje (estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo]
  );

  return { idViaje: result.insertId, ...viaje };
};

// ✅ PUT - actualizar viaje
const actualizar = async (id, viaje) => {
  const { estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo } = viaje;

  await db.query(
    `UPDATE Viaje SET estado=?, fecha=?, kilometros=?, observaciones=?, motivoCancelacion=?, precio=?, idCliente=?, idLocalidadOrigen=?, idLocalidadDestino=?, idChoferVehiculo=? WHERE idViaje=?`,
    [estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo, id]
  );

  return { idViaje: id, ...viaje };
};

// ✅ DELETE - eliminar viaje
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
