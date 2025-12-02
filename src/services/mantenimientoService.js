const db = require("../config/db");

const obtenerMantenimientos = async (filtros = {}) => {
  const { idVehiculo, tipo, fechaDesde, fechaHasta } = filtros;
  
  let query = `
    SELECT m.*, v.patente 
    FROM Mantenimiento m
    JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
  `;
  let conditions = [];
  let values = [];
  
  if (idVehiculo) {
    conditions.push('m.idVehiculo = ?');
    values.push(idVehiculo);
  }
  
  if (tipo) {
    conditions.push('m.tipo = ?');
    values.push(tipo);
  }
  
  if (fechaDesde) {
    conditions.push('m.fecha >= ?');
    values.push(fechaDesde);
  }
  
  if (fechaHasta) {
    conditions.push('m.fecha <= ?');
    values.push(fechaHasta);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY m.fecha DESC';

  const [rows] = await db.query(query, values);
  
  // FORMATEAR FECHAS para que no salgan con hora y zona horaria
  return rows.map(mantenimiento => ({
    ...mantenimiento,
    fecha: formatFecha(mantenimiento.fecha)
  }));
};

const obtenerMantenimientoPorId = async (id) => {
  const [rows] = await db.query(`
    SELECT m.*, v.patente 
    FROM Mantenimiento m
    JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
    WHERE m.idMantenimiento = ?
  `, [id]);
  
  if (rows[0]) {
    return {
      ...rows[0],
      fecha: formatFecha(rows[0].fecha) // ✅ Formatear fecha
    };
  }
  return null;
};

const crear = async (mantenimiento) => {
  const { fecha, observaciones, tipo, idVehiculo } = mantenimiento;
  
  const [result] = await db.query(
    "INSERT INTO Mantenimiento (fecha, observaciones, tipo, idVehiculo) VALUES (?, ?, ?, ?)",
    [fecha, observaciones, tipo, idVehiculo]
  );
  
  return { idMantenimiento: result.insertId, ...mantenimiento };
};

const actualizar = async (id, mantenimiento) => {
  // VALIDAR que mantenimiento existe
  if (!mantenimiento) {
    throw new Error("No se proporcionaron datos de mantenimiento");
  }

  const { fecha, observaciones, tipo, idVehiculo } = mantenimiento;
  
  // VALIDAR campos obligatorios
  if (!fecha || !tipo || !idVehiculo) {
    throw new Error("Faltan campos obligatorios: fecha, tipo, idVehiculo");
  }

  await db.query(
    "UPDATE Mantenimiento SET fecha = ?, observaciones = ?, tipo = ?, idVehiculo = ? WHERE idMantenimiento = ?",
    [fecha, observaciones, tipo, idVehiculo, id]
  );
  
  return { idMantenimiento: id, ...mantenimiento };
};

const eliminarMantenimiento = async (id) => {
  await db.query("DELETE FROM Mantenimiento WHERE idMantenimiento = ?", [id]);
  return { message: "Mantenimiento eliminado correctamente" };
};

// FUNCIÓN PARA FORMATEAR FECHA
const formatFecha = (fecha) => {
  if (!fecha) return null;
  
  // Si ya es string en formato YYYY-MM-DD, devolverlo tal cual
  if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fecha;
  }
  
  // Si es objeto Date o string con hora, formatear a YYYY-MM-DD
  const dateObj = new Date(fecha);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

module.exports = {
  obtenerMantenimientos,
  obtenerMantenimientoPorId,
  crear,
  actualizar,
  eliminarMantenimiento,
};