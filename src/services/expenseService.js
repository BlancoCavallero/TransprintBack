const db = require("../config/db");
const viajeService = require("./viajeService");

const obtenerGastos = async () => {
  const [rows] = await db.query("SELECT * FROM Gasto");
  // For each expense, attach viaje enriched object
  const resultado = [];
  for (const r of rows) {
    const viajes = await viajeService.obtenerViajes({ idViaje: r.idViaje });
    const viaje = viajes[0] || null;
    resultado.push({
      idGasto: r.idGasto,
      detalle: r.detalle,
      monto: r.monto,
      tipo: r.tipo,
      idViaje: r.idViaje,
      viaje,
    });
  }
  return resultado;
};

const obtenerPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Gasto WHERE idGasto = ?", [id]);
  const r = rows[0];
  if (!r) return null;
  const viajes = await viajeService.obtenerViajes({ idViaje: r.idViaje });
  const viaje = viajes[0] || null;
  return {
    idGasto: r.idGasto,
    detalle: r.detalle,
    monto: r.monto,
    tipo: r.tipo,
    idViaje: r.idViaje,
    viaje,
  };
};

const obtenerPorIdViaje = async (id) => {
  const [rows] = await db.query("SELECT * FROM Gasto WHERE idViaje = ?", [id]);
  // Attach viaje (enriched) for all
  const viajes = await viajeService.obtenerViajes({ idViaje: id });
  const viaje = viajes[0] || null;
  const mapped = rows.map((r) => ({
    idGasto: r.idGasto,
    detalle: r.detalle,
    monto: r.monto,
    tipo: r.tipo,
    idViaje: r.idViaje,
    viaje,
  }));
  return mapped;
};

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
  const viajes = await viajeService.obtenerViajes({ idViaje });
  const viaje = viajes[0] || null;
  return { idGasto, detalle, monto, tipo, idViaje, viaje };
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
  const viajes = await viajeService.obtenerViajes({ idViaje });
  const viaje = viajes[0] || null;
  return { idGasto: id, detalle, monto, tipo, idViaje, viaje };
};

const eliminar = async (id) => {
  await db.query("DELETE FROM Gasto WHERE idPersona = ?", [id]);
  return { message: "Persona eliminada correctamente" };
};

module.exports = {
  obtenerGastos,
  obtenerPorId,
  obtenerPorIdViaje,
  crear,
  modificarGasto,
  eliminar,
};
