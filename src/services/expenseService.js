const db = require("../config/db");

const obtenerGastos = async () => {
  const [rows] = await db.query("SELECT * FROM Gasto");
  return rows;
}

const obtenerPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Gasto WHERE idGasto = ?", [id]);
  return rows[0];
}

const obtenerPorIdViaje = async (id) => {
  const [rows] = await db.query("SELECT * FROM Gasto WHERE idViaje = ?", [id]);
  return rows;
}


const crear = async (gasto) => {
  const { detalle, monto, tipo, idViaje } = gasto;

  //verifico que el viaje ya esté registrado
  const [existeViaje] = await db.query(
    "SELECT * FROM Viaje WHERE idViaje = ?",
    [idViaje]
  );
  if (existeViaje.length == 0) {
    throw new Error("El idViaje ingresado no existe ");
  }

  const [result] = await db.query(
    "INSERT INTO Gasto (detalle, monto, tipo, idViaje) VALUES (?, ?, ?, ?)",
    [detalle, monto, tipo, idViaje]
  );

  const idGasto = result.insertId;
  return { idGasto, detalle, monto, tipo, idViaje };
};

const modificarGasto = async (id, gasto) => {
  const { detalle, monto, tipo, idViaje } = gasto;

  //verifico que el viaje ya esté registrado
  const [existeViaje] = await db.query(
    "SELECT * FROM Viaje WHERE idViaje = ?",
    [idViaje]
  );
  if (existeViaje.length == 0) {
    throw new Error("El idViaje ingresado no existe ");
  }

  await db.query(
    "UPDATE Gasto SET detalle = ?, monto = ?, tipo = ?, idViaje = ? WHERE idGasto = ?",
    [detalle, monto, tipo, idViaje, id]
  );
  return { idGasto: id, ...gasto };
};

const eliminar = async (id) => {
  await db.query("DELETE FROM Gasto WHERE idGasto = ?", [id]);
  return { message: "Gasto eliminado correctamente" };
};


module.exports = {
    obtenerGastos,
    obtenerPorId,
    obtenerPorIdViaje,
    crear,
    modificarGasto,
    eliminar
}