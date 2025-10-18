const db = require("../config/db");

const obtenerVehiculos = async () => {
  const [rows] = await db.query("SELECT * FROM Vehiculo");
  return rows;
};

const obtenerVehiculoPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Vehiculo WHERE idVehiculo = ?", [id]);
  return rows[0];
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
  obtenerVehiculos ,
  obtenerVehiculoPorId,
  crear,
  actualizar,
  eliminarVehiculo,
};
