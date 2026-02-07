const db = require("../config/db");

const normalizarFecha = (fecha) => {
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  return f;
};


const verificarViajeActivoAcoplado = async (idAcoplado) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [viajes] = await db.query(
    `
    SELECT v.fechaInicio, v.fechaFin
    FROM ViajeAcoplado va
    JOIN Viaje v ON v.idViaje = va.idViaje
    WHERE va.idAcoplado = ?
    `,
    [idAcoplado]
  );

  if (viajes.length === 0) {
    return { enViaje: false };
  }

  const viajeActivo = viajes.some((v) => {
    const inicio = normalizarFecha(v.fechaInicio);
    const fin = normalizarFecha(v.fechaFin);
    return inicio <= hoy && fin >= hoy;
  });

  return {
    enViaje: viajeActivo,
    motivos: viajeActivo ? ["El acoplado está asignado a un viaje"] : [],
  };
};


/*const asignarAcopladoViaje = async (idViaje, idAcoplado, orden = null) => {
  if (!idViaje || !idAcoplado) {
    const error = new Error("Faltan datos obligatorios");
    error.statusCode = 400;
    throw error;
  }

  if (orden !== null && ![1, 2].includes(orden)) {
    const error = new Error("El orden debe ser 1 o 2");
    error.statusCode = 400;
    throw error;
  }

  // 🔎 Verificar viaje
  const [[viaje]] = await db.query(
    `SELECT idViaje, fechaInicio, fechaFin FROM Viaje WHERE idViaje = ?`,
    [idViaje]
  );

  if (!viaje) {
    const error = new Error("El viaje no existe");
    error.statusCode = 404;
    throw error;
  }

  // 🔎 Verificar acoplado
  const [[acoplado]] = await db.query(
    `SELECT activo FROM Acoplado WHERE idAcoplado = ?`,
    [idAcoplado]
  );

  if (!acoplado) {
    const error = new Error("El acoplado no existe");
    error.statusCode = 404;
    throw error;
  }

  if (acoplado.activo === 0) {
    const error = new Error("El acoplado está dado de baja");
    error.statusCode = 400;
    throw error;
  }

  // 🔁 No permitir mismo acoplado dos veces
  const [repetido] = await db.query(
    `SELECT 1 FROM ViajeAcoplado WHERE idViaje = ? AND idAcoplado = ?`,
    [idViaje, idAcoplado]
  );

  if (repetido.length > 0) {
    const error = new Error("El acoplado ya está asignado a este viaje");
    error.statusCode = 400;
    throw error;
  }

  // 🔢 Máximo 2 acoplados
  const [[{ cantidad }]] = await db.query(
    `SELECT COUNT(*) AS cantidad FROM ViajeAcoplado WHERE idViaje = ?`,
    [idViaje]
  );

  if (cantidad >= 2) {
    const error = new Error("El viaje ya tiene el máximo de acoplados permitidos");
    error.statusCode = 400;
    throw error;
  }

  // 🔢 Determinar orden si no viene
  let ordenFinal = orden;

  if (ordenFinal !== null) {
    if (![1, 2].includes(ordenFinal)) {
      const error = new Error("El orden del acoplado debe ser 1 o 2");
      error.statusCode = 400;
      throw error;
    }

    const [ordenUsado] = await db.query(
      `SELECT 1 FROM ViajeAcoplado WHERE idViaje = ? AND orden = ?`,
      [idViaje, ordenFinal]
    );

    if (ordenUsado.length > 0) {
      const error = new Error(`Ya existe un acoplado con orden ${ordenFinal}`);
      error.statusCode = 400;
      throw error;
    }
  } else {
    const [ordenes] = await db.query(
      `SELECT orden FROM ViajeAcoplado WHERE idViaje = ?`,
      [idViaje]
    );

    const usados = ordenes.map(o => o.orden);
    ordenFinal = usados.includes(1) ? 2 : 1;
  }

  // ⏱️ Disponibilidad temporal
  const [conflictos] = await db.query(
    `
    SELECT v.idViaje
    FROM ViajeAcoplado va
    JOIN Viaje v ON v.idViaje = va.idViaje
    WHERE va.idAcoplado = ?
      AND v.idViaje != ?
      AND NOT (v.fechaFin < ? OR v.fechaInicio > ?)
    `,
    [
      idAcoplado,
      idViaje,
      normalizarFecha(viaje.fechaInicio),
      normalizarFecha(viaje.fechaFin),
    ]
  );

  if (conflictos.length > 0) {
    const error = new Error(
      "El acoplado ya está asignado a otro viaje en ese rango de fechas"
    );
    error.statusCode = 400;
    throw error;
  }

  // ✅ Insert
  await db.query(
    `INSERT INTO ViajeAcoplado (idViaje, idAcoplado, orden) VALUES (?, ?, ?)`,
    [idViaje, idAcoplado, ordenFinal]
  );

  return {
    idViaje,
    idAcoplado,
    orden: ordenFinal,
  };
};*/
const calcularEstadoAcoplado = async (idAcoplado) => {
  const [acoplado] = await db.query(
    `SELECT activo FROM Acoplado WHERE idAcoplado = ?`,
    [idAcoplado]
  );

  if (acoplado.length === 0) {
    const error = new Error("El acoplado no existe");
    error.statusCode = 404;
    throw error;
  }

  if (acoplado[0].activo === 0) {
    return {
      estadoDisponibilidad: "DE_BAJA",
      motivos: ["Acoplado dado de baja"],
    };
  }

  const viajeStatus = await verificarViajeActivoAcoplado(idAcoplado);

  if (viajeStatus.enViaje) {
    return {
      estadoDisponibilidad: "OCUPADO",
      motivos: viajeStatus.motivos,
    };
  }

  return {
    estadoDisponibilidad: "HABILITADO",
    motivos: ["Acoplado disponible"],
  };
};


const consultarDisponibilidadAcoplados = async (estadoFiltro) => {
  const [acoplados] = await db.query(
    `SELECT idAcoplado, patente, tipo, activo FROM Acoplado`
  );

  const resultado = [];

  for (const acoplado of acoplados) {
    let estado;
    let motivos;

    if (acoplado.activo === 0) {
      estado = "DE_BAJA";
      motivos = ["Acoplado dado de baja"];
    } else {
      const calculado = await calcularEstadoAcoplado(acoplado.idAcoplado);
      estado = calculado.estadoDisponibilidad;
      motivos = calculado.motivos;
    }

    if (
      estadoFiltro &&
      estado.toLowerCase() !== estadoFiltro.toLowerCase()
    ) {
      continue;
    }

    resultado.push({
      ...acoplado,
      estadoDisponibilidad: estado,
      motivos,
    });
  }

  return resultado;
};


const asignarAcopladoViaje = async (idViaje, idAcoplado, orden) => {
  if (!idViaje || !idAcoplado) {
    const error = new Error("Faltan datos obligatorios");
    error.statusCode = 400;
    throw error;
  }

  // orden opcional
  if (orden !== null && orden !== undefined && ![1, 2].includes(orden)) {
    const error = new Error("El orden debe ser 1 o 2");
    error.statusCode = 400;
    throw error;
  }

  // Verificar estado acoplado
  const estado = await calcularEstadoAcoplado(idAcoplado);
  if (estado.estadoDisponibilidad !== "HABILITADO") {
    const error = new Error("El acoplado no está disponible");
    error.statusCode = 400;
    throw error;
  }

  await db.query(
    `
    INSERT INTO ViajeAcoplado (idViaje, idAcoplado, orden)
    VALUES (?, ?, ?)
    `,
    [idViaje, idAcoplado, orden ?? null]
  );

  return {
    message: "Acoplado asignado al viaje",
    idViaje,
    idAcoplado,
    orden,
  };
};

module.exports = {
  asignarAcopladoViaje,
  consultarDisponibilidadAcoplados,
  asignarAcopladoViaje
};
