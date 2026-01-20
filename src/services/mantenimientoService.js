const db = require("../config/db");

const obtenerMantenimientos = async (filtros = {}) => {
  const { idVehiculo, tipo, fechaDesde, fechaHasta } = filtros;

  let query = `
    SELECT m.*, v.idVehiculo AS vehiculoId, v.patente AS vehiculoPatente, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.tipo AS vehiculoTipo
    FROM Mantenimiento m
    LEFT JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
  `;
  let conditions = [];
  let values = [];

  if (idVehiculo) {
    conditions.push("m.idVehiculo = ?");
    values.push(idVehiculo);
  }

  if (tipo) {
    conditions.push("m.tipo = ?");
    values.push(tipo);
  }

  if (fechaDesde) {
    conditions.push("m.fechaInicio >= ?");
    values.push(fechaDesde);
  }

  if (fechaHasta) {
    conditions.push("m.fechaFin <= ?");
    values.push(fechaHasta);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY m.fechaInicio DESC";

  const [rows] = await db.query(query, values);

  return rows.map((mantenimiento) => ({
    idMantenimiento: mantenimiento.idMantenimiento,
    fechaInicio: formatFecha(mantenimiento.fechaInicio),
    fechaFin: formatFecha(mantenimiento.fechaFin),
    observaciones: mantenimiento.observaciones,
    tipo: mantenimiento.tipo,
    vehiculo: mantenimiento.vehiculoId
      ? {
          idVehiculo: mantenimiento.vehiculoId,
          patente: mantenimiento.vehiculoPatente,
          marca: mantenimiento.vehiculoMarca,
          modelo: mantenimiento.vehiculoModelo,
          tipo: mantenimiento.vehiculoTipo,
        }
      : null,
  }));
};

const obtenerMantenimientoPorId = async (id) => {
  const [rows] = await db.query(
    `
    SELECT m.*, v.idVehiculo AS vehiculoId, v.patente AS vehiculoPatente, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.tipo AS vehiculoTipo
    FROM Mantenimiento m
    LEFT JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
    WHERE m.idMantenimiento = ?
  `,
    [id]
  );

  if (rows[0]) {
    const r = rows[0];
    return {
      idMantenimiento: r.idMantenimiento,
      fechaInicio: formatFecha(r.fechaInicio),
      fechaFin: formatFecha(r.fechaFin),
      observaciones: r.observaciones,
      tipo: r.tipo,
      vehiculo: r.vehiculoId
        ? {
            idVehiculo: r.vehiculoId,
            patente: r.vehiculoPatente,
            marca: r.vehiculoMarca,
            modelo: r.vehiculoModelo,
            tipo: r.vehiculoTipo,
          }
        : null,
    };
  }
  return null;
};

const crear = async (mantenimiento) => {
  const { fechaInicio, fechaFin, observaciones, tipo, idVehiculo } =
    mantenimiento;

  const [result] = await db.query(
    "INSERT INTO Mantenimiento (fechaInicio, fechaFin, observaciones, tipo, idVehiculo) VALUES (?, ?, ?, ?, ?)",
    [fechaInicio, fechaFin, observaciones, tipo, idVehiculo]
  );

  return await obtenerMantenimientoPorId(result.insertId);
};

const actualizar = async (id, mantenimiento) => {
  if (!mantenimiento) {
    throw new Error("No se proporcionaron datos de mantenimiento");
  }

  // Obtener el mantenimiento actual
  const existente = await obtenerMantenimientoPorId(id);
  if (!existente) {
    throw new Error("Mantenimiento no encontrado");
  }

  const { fechaInicio, fechaFin, observaciones, tipo, idVehiculo } =
    mantenimiento;

  // Usar valores proporcionados o mantener los existentes
  const campos = {};
  if (fechaInicio !== undefined) campos.fechaInicio = fechaInicio;
  if (fechaFin !== undefined) campos.fechaFin = fechaFin;
  if (observaciones !== undefined) campos.observaciones = observaciones;
  if (tipo !== undefined) campos.tipo = tipo;
  if (idVehiculo !== undefined) campos.idVehiculo = idVehiculo;

  // Si no hay campos a actualizar, simplemente devolver el mantenimiento actual
  if (Object.keys(campos).length === 0) {
    return await obtenerMantenimientoPorId(id);
  }

  // Construir la query dinámicamente
  const setClauses = Object.keys(campos)
    .map((key) => `${key} = ?`)
    .join(", ");
  const valores = Object.values(campos);
  valores.push(id);

  await db.query(
    `UPDATE Mantenimiento SET ${setClauses} WHERE idMantenimiento = ?`,
    valores
  );

  return await obtenerMantenimientoPorId(id);
};

const eliminarMantenimiento = async (id) => {
  await db.query("DELETE FROM Mantenimiento WHERE idMantenimiento = ?", [id]);
  return { message: "Mantenimiento eliminado correctamente" };
};

// Función para formatear fecha a YYYY-MM-DD
const formatFecha = (fecha) => {
  if (!fecha) return null;

  if (typeof fecha === "string" && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fecha;
  }

  const dateObj = new Date(fecha);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

module.exports = {
  obtenerMantenimientos,
  obtenerMantenimientoPorId,
  crear,
  actualizar,
  eliminarMantenimiento,
};
