const db = require("../config/db");
const viajeService = require("./viajeService");

const obtenerGastos = async () => {
  const [rows] = await db.query("SELECT * FROM Gasto");
  // For each expense, attach viaje enriched object
  const resultado = [];
  for (const r of rows) {
    const viajes = await viajeService.obtenerViajes({ idViaje: r.idViaje });
    const viajeCompleto = viajes[0] || null;

    // Mapear solo los campos necesarios para evitar referencias circulares
    const viaje = viajeCompleto
      ? {
          idViaje: viajeCompleto.idViaje,
          estado: viajeCompleto.estado,
          fecha: viajeCompleto.fecha,
          kilometros: viajeCompleto.kilometros,
          observaciones: viajeCompleto.observaciones,
          motivoCancelacion: viajeCompleto.motivoCancelacion,
          precio: viajeCompleto.precio,
          idLocalidadOrigen: viajeCompleto.idLocalidadOrigen,
          idLocalidadDestino: viajeCompleto.idLocalidadDestino,
          chofer: viajeCompleto.chofer
            ? {
                idChofer: viajeCompleto.chofer.idChofer,
                dni: viajeCompleto.chofer.dni,
                persona: viajeCompleto.chofer.persona,
              }
            : null,
          vehiculo: viajeCompleto.vehiculo
            ? {
                idVehiculo: viajeCompleto.vehiculo.idVehiculo,
                patente: viajeCompleto.vehiculo.patente,
                marca: viajeCompleto.vehiculo.marca,
                modelo: viajeCompleto.vehiculo.modelo,
                tipo: viajeCompleto.vehiculo.tipo,
              }
            : null,
        }
      : null;

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
  const viajeCompleto = viajes[0] || null;

  // Mapear solo los campos necesarios para evitar referencias circulares
  const viaje = viajeCompleto
    ? {
        idViaje: viajeCompleto.idViaje,
        estado: viajeCompleto.estado,
        fecha: viajeCompleto.fecha,
        kilometros: viajeCompleto.kilometros,
        observaciones: viajeCompleto.observaciones,
        motivoCancelacion: viajeCompleto.motivoCancelacion,
        precio: viajeCompleto.precio,
        idLocalidadOrigen: viajeCompleto.idLocalidadOrigen,
        idLocalidadDestino: viajeCompleto.idLocalidadDestino,
        chofer: viajeCompleto.chofer
          ? {
              idChofer: viajeCompleto.chofer.idChofer,
              dni: viajeCompleto.chofer.dni,
              persona: viajeCompleto.chofer.persona,
            }
          : null,
        vehiculo: viajeCompleto.vehiculo
          ? {
              idVehiculo: viajeCompleto.vehiculo.idVehiculo,
              patente: viajeCompleto.vehiculo.patente,
              marca: viajeCompleto.vehiculo.marca,
              modelo: viajeCompleto.vehiculo.modelo,
              tipo: viajeCompleto.vehiculo.tipo,
            }
          : null,
      }
    : null;

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
  const viajeCompleto = viajes[0] || null;

  // Mapear solo los campos necesarios para evitar referencias circulares
  const viaje = viajeCompleto
    ? {
        idViaje: viajeCompleto.idViaje,
        estado: viajeCompleto.estado,
        fecha: viajeCompleto.fecha,
        kilometros: viajeCompleto.kilometros,
        observaciones: viajeCompleto.observaciones,
        motivoCancelacion: viajeCompleto.motivoCancelacion,
        precio: viajeCompleto.precio,
        idLocalidadOrigen: viajeCompleto.idLocalidadOrigen,
        idLocalidadDestino: viajeCompleto.idLocalidadDestino,
        chofer: viajeCompleto.chofer
          ? {
              idChofer: viajeCompleto.chofer.idChofer,
              dni: viajeCompleto.chofer.dni,
              persona: viajeCompleto.chofer.persona,
            }
          : null,
        vehiculo: viajeCompleto.vehiculo
          ? {
              idVehiculo: viajeCompleto.vehiculo.idVehiculo,
              patente: viajeCompleto.vehiculo.patente,
              marca: viajeCompleto.vehiculo.marca,
              modelo: viajeCompleto.vehiculo.modelo,
              tipo: viajeCompleto.vehiculo.tipo,
            }
          : null,
      }
    : null;

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
  const viajeCompleto = viajes[0] || null;

  // Mapear solo los campos necesarios para evitar referencias circulares
  const viaje = viajeCompleto
    ? {
        idViaje: viajeCompleto.idViaje,
        estado: viajeCompleto.estado,
        fecha: viajeCompleto.fecha,
        kilometros: viajeCompleto.kilometros,
        observaciones: viajeCompleto.observaciones,
        motivoCancelacion: viajeCompleto.motivoCancelacion,
        precio: viajeCompleto.precio,
        idLocalidadOrigen: viajeCompleto.idLocalidadOrigen,
        idLocalidadDestino: viajeCompleto.idLocalidadDestino,
        chofer: viajeCompleto.chofer
          ? {
              idChofer: viajeCompleto.chofer.idChofer,
              dni: viajeCompleto.chofer.dni,
              persona: viajeCompleto.chofer.persona,
            }
          : null,
        vehiculo: viajeCompleto.vehiculo
          ? {
              idVehiculo: viajeCompleto.vehiculo.idVehiculo,
              patente: viajeCompleto.vehiculo.patente,
              marca: viajeCompleto.vehiculo.marca,
              modelo: viajeCompleto.vehiculo.modelo,
              tipo: viajeCompleto.vehiculo.tipo,
            }
          : null,
      }
    : null;

  return { idGasto, detalle, monto, tipo, idViaje, viaje };
};

const modificarGasto = async (id, gasto) => {
  const { detalle, monto, tipo, idViaje } = gasto;

  // Obtener el gasto actual
  const existente = await obtenerPorId(id);
  if (!existente) {
    throw new Error("Gasto no encontrado");
  }

  // Usar valores proporcionados o mantener los existentes
  const campos = {};
  if (detalle !== undefined) campos.detalle = detalle;
  if (monto !== undefined) campos.monto = monto;
  if (tipo !== undefined) campos.tipo = tipo;
  if (idViaje !== undefined) {
    // Verificar que el viaje existe si se proporciona
    const [existeViaje] = await db.query(
      "SELECT * FROM Viaje WHERE idViaje = ?",
      [idViaje]
    );
    if (existeViaje.length === 0) {
      throw new Error("El idViaje ingresado no existe");
    }
    campos.idViaje = idViaje;
  }

  // Si no hay campos a actualizar, simplemente devolver el gasto actual
  if (Object.keys(campos).length === 0) {
    return await obtenerPorId(id);
  }

  // Construir la query dinámicamente
  const setClauses = Object.keys(campos)
    .map((key) => `${key} = ?`)
    .join(", ");
  const valores = Object.values(campos);
  valores.push(id);

  await db.query(`UPDATE Gasto SET ${setClauses} WHERE idGasto = ?`, valores);

  // Obtener el gasto actualizado completo
  const gastoActualizado = await obtenerPorId(id);

  return gastoActualizado;
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
  eliminar,
};
