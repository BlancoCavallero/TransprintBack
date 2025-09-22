const db = require("../config/db");

const obtenerTodos = async () => {
  const [rows] = await db.query("SELECT * FROM Cliente");
  return rows;
};

const obtenerPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Cliente WHERE idCliente = ?", [id]);
  return rows[0] || null;
};

const obtenerPorCorreo = async (correo) => {
  const [rows] = await db.query("SELECT * FROM Cliente WHERE correo = ?", [correo]);
  return rows[0] || null;
};

const crearCliente = async (cliente) => {
  const { codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad } = cliente;
  return db.query(
    `INSERT INTO Cliente (codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [codPostal, correo, observaciones || null, razonSocial, tipo, idPersona || null, idLocalidad || null]
  );
};

const actualizarCliente = async (id, cliente) => {
  const { codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad } = cliente;
  return db.query(
    `UPDATE Cliente SET codPostal=?, correo=?, observaciones=?, razonSocial=?, tipo=?, idPersona=?, idLocalidad=? WHERE idCliente=?`,
    [codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad, id]
  );
};

const eliminarCliente = async (id) => {
  return db.query("DELETE FROM Cliente WHERE idCliente = ?", [id]);
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerPorCorreo,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
