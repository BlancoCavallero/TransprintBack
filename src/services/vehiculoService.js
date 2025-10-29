const db = require("../config/db");


const obtenerVehiculos = async (filtros = {}) => {
  let query = "SELECT * FROM Vehiculo WHERE 1=1";
  const params = [];

  if (filtros.idVehiculo) {
    query += " AND idVehiculo = ?";
    params.push(filtros.idVehiculo);
  }
  if (filtros.marca) {
    query += " AND marca LIKE ?";
    params.push(`%${filtros.marca}%`);
  }
  if (filtros.modelo) {
    query += " AND modelo LIKE ?";
    params.push(`%${filtros.modelo}%`);
  }
  if (filtros.patente) {
    query += " AND patente LIKE ?";
    params.push(`%${filtros.patente}%`);
  }
  if (filtros.tipo) {
    query += " AND tipo LIKE ?";
    params.push(`%${filtros.tipo}%`);
  }
  if (filtros.estado) {
    query += " AND estado LIKE ?";
    params.push(`%${filtros.estado}%`);
  }

  const [rows] = await db.query(query, params);
  return rows;
};


const crear = async (vehiculo) => {
  const { anio, estado, marca, modelo, patente, tipo } = vehiculo;
  const [result] = await db.query(
    "INSERT INTO Vehiculo (anio, estado, marca, modelo, patente, tipo) VALUES (?, ?, ?, ?, ?, ?)",
    [anio, estado, marca, modelo, patente, tipo]
  );
  return { idVehiculo: result.insertId, ...vehiculo };
};


const actualizar = async (id, vehiculo) => {
  const { anio, estado, marca, modelo, patente, tipo } = vehiculo;
  await db.query(
    "UPDATE Vehiculo SET anio = ?, estado = ?, marca = ?, modelo = ?, patente = ?, tipo = ? WHERE idVehiculo = ?",
    [anio, estado, marca, modelo, patente, tipo, id]
  );
  return { idVehiculo: id, ...vehiculo };
};


const eliminarVehiculo = async (id) => {
  await db.query("DELETE FROM Vehiculo WHERE idVehiculo = ?", [id]);
  return { message: "Vehículo eliminado correctamente" };
};

module.exports = {
  obtenerVehiculos,
  crear,
  actualizar,
  eliminarVehiculo,
};
