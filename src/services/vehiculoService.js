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

  if (!patente || !marca || !modelo || !estado) {
    const error = new Error(
      "Faltan campos obligatorios (patente, marca, modelo, estado)"
    );
    error.statusCode = 400;
    throw error;
  }

  // Verificar duplicado por patente (si no lo hiciste en el validator)
  const [existe] = await db.query(
    "SELECT idVehiculo FROM Vehiculo WHERE patente = ?",
    [patente]
  );
  if (existe.length > 0) {
    const error = new Error("Ya existe un vehículo con esa patente");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await db.query(
    "INSERT INTO Vehiculo (anio, estado, marca, modelo, patente, tipo) VALUES (?, ?, ?, ?, ?, ?)",
    [anio, estado.toLowerCase(), marca, modelo, patente, tipo]
  );
  return { idVehiculo: result.insertId, ...vehiculo };
};

const actualizar = async (id, vehiculo) => {
  // Verificar existencia
  const [check] = await db.query(
    "SELECT * FROM Vehiculo WHERE idVehiculo = ?",
    [id]
  );
  if (check.length === 0) {
    const error = new Error("Vehículo no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const { anio, estado, marca, modelo, patente, tipo } = vehiculo;
  const [result] = await db.query(
    "UPDATE Vehiculo SET anio = ?, estado = ?, marca = ?, modelo = ?, patente = ?, tipo = ? WHERE idVehiculo = ?",
    [
      anio !== undefined ? anio : check[0].anio,
      estado ? estado.toLowerCase() : check[0].estado,
      marca || check[0].marca,
      modelo || check[0].modelo,
      patente || check[0].patente,
      tipo || check[0].tipo,
      id,
    ]
  );

  if (result.affectedRows === 0) {
    const error = new Error("No se pudo actualizar el vehículo");
    error.statusCode = 500;
    throw error;
  }

  return { idVehiculo: id, ...vehiculo };
};

const eliminarVehiculo = async (id) => {
  const [result] = await db.query("DELETE FROM Vehiculo WHERE idVehiculo = ?", [
    id,
  ]);

  if (result.affectedRows === 0) {
    const error = new Error("Vehículo no encontrado");
    error.status = 404;
    throw error;
  }

  return { message: "Vehículo eliminado correctamente" };
};

module.exports = {
  obtenerVehiculos,
  crear,
  actualizar,
  eliminarVehiculo,
};
