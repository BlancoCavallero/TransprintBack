const db = require("../config/db");

const obtenerGastos = async () => {
  const [rows] = await db.query("SELECT * FROM Gasto");
  return rows;
}

const obtenerPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Gasto WHERE idGasto = ?", [id]);
  return rows[0];
}


const crear = async (gasto) => {
  const { detalle, monto, tipo, idViaje } = gasto;
  const [result] = await db.query(
    "INSERT INTO Persona (detalle, monto, tipo, idViaje) VALUES (?, ?, ?, ?)",
    [detalle, monto, tipo, idViaje]
  );
  return { idGasto: result.insertId, ...gasto };
};

const modificarGasto = async (id, gasto) => {
  const { detalle, monto, tipo, idViaje } = gasto;
  await db.query(
    "UPDATE Gasto SET detalle = ?, monto = ?, tipo = ?, idViaje = ? WHERE idGasto = ?",
    [detalle, monto, tipo, idViaje, id]
  );
  return { idGasto: id, ...gasto };
};

const eliminar = async (id) => {
  await db.query("DELETE FROM Gasto WHERE idPersona = ?", [id]);
  return { message: "Persona eliminada correctamente" };
};


module.exports = {
    obtenerGastos,
    obtenerPorId,
    crear,
    modificarGasto,
    eliminar
}