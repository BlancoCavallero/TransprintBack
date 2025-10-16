const db = require("../config/db");

const obtenerTodas = async () => {
  const [rows] = await db.query("SELECT * FROM Persona");
  return rows;
};

const obtenerPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Persona WHERE idPersona = ?", [id]);
  return rows[0];
};

const obtenerPorCuit = async (cuit) => {
  const [rows] = await db.query("SELECT * FROM Persona WHERE cuit = ?", [cuit]);
  return rows[0];
};


const crear = async (persona) => {
  const { nombre, apellido, cuit, telefono } = persona;
  const [result] = await db.query(
    "INSERT INTO Persona (nombre, apellido, cuit, telefono) VALUES (?, ?, ?, ?)",
    [nombre, apellido, cuit, telefono]
  );
  return { idPersona: result.insertId, ...persona };
};

const actualizar = async (id, persona) => {
  const { nombre, apellido, cuit, telefono } = persona;
  await db.query(
    "UPDATE Persona SET nombre = ?, apellido = ?, cuit = ?, telefono = ? WHERE idPersona = ?",
    [nombre, apellido, cuit, telefono, id]
  );
  return { idPersona: id, ...persona };
};

const eliminar = async (id) => {
  await db.query("DELETE FROM Persona WHERE idPersona = ?", [id]);
  return { message: "Persona eliminada correctamente" };
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorCuit,
  crear,
  actualizar,
  eliminar
}