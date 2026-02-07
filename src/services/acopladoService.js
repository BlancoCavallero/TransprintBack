const db = require("../config/db");

const verificarViajeActivoAcoplado = async (idAcoplado) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [viajes] = await db.query(
    `
    SELECT fechaInicio, fechaFin
    FROM Viaje
    WHERE idAcoplado = ?
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


const crearAcoplado = async (data) => {
  const {
    patente,
    tipo,
    capacidadKg,
    estado = "DISPONIBLE",
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO Acoplado (patente, tipo, capacidadKg, estado)
    VALUES (?, ?, ?, ?)
    `,
    [patente, tipo, capacidadKg, estado]
  );

  return {
    idAcoplado: result.insertId,
    patente,
    tipo,
    capacidadKg,
    estado,
  };
};

const listarAcoplados = async () => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM Acoplado
    WHERE estado != 'BAJA'
    `
  );
  return rows;
};

const obtenerAcopladoPorId = async (idAcoplado) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM Acoplado
    WHERE idAcoplado = ?
      AND estado != 'BAJA'
    `,
    [idAcoplado]
  );

  return rows[0];
};

const actualizarAcoplado = async (idAcoplado, data) => {
  const campos = [];
  const valores = [];

  Object.entries(data).forEach(([key, value]) => {
    campos.push(`${key} = ?`);
    valores.push(value);
  });

  if (campos.length === 0) return;

  await db.query(
    `
    UPDATE Acoplado
    SET ${campos.join(", ")}
    WHERE idAcoplado = ?
    `,
    [...valores, idAcoplado]
  );
};

const calcularEstadoAcoplado = async (idAcoplado, activo) => {
  if (activo === 0) {
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
  const acoplados = await obtenerAcoplados();
  const resultado = [];

  for (const acoplado of acoplados) {
    const calculado = await calcularEstadoAcoplado(
      acoplado.idAcoplado,
      acoplado.activo
    );

    if (
      estadoFiltro &&
      calculado.estadoDisponibilidad.toLowerCase() !== estadoFiltro.toLowerCase()
    ) {
      continue;
    }

    resultado.push({
      ...acoplado,
      estadoDisponibilidad: calculado.estadoDisponibilidad,
      motivos: calculado.motivos,
    });
  }

  return resultado;
};


const eliminarAcoplado = async (idAcoplado) => {
  await db.query(
    `
    UPDATE Acoplado
    SET estado = 'BAJA'
    WHERE idAcoplado = ?
    `,
    [idAcoplado]
  );
};

module.exports = {
  crearAcoplado,
  listarAcoplados,
  obtenerAcopladoPorId,
  actualizarAcoplado,
  eliminarAcoplado,
};