const db = require('../config/db');

const normalizarFecha = (fecha) => {
  if (!fecha) return null;
  
  // Si ya es string "YYYY-MM-DD", devolver directo
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }

  // Si viene como Date, convertir manualmente sin usar la zona horaria
  const f = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return f.toISOString().split("T")[0];
};

// Obtener todas las documentaciones
const obtenerTodas = async () => {
  const [rows] = await db.query('SELECT * FROM Documentacion');

  const hoy = normalizarFecha(new Date());
  // Calcular estado dinámico
  const docsConEstado = rows.map(doc => {
    const vencimiento = normalizarFecha(doc.fechaVencimiento);
    const estado = vencimiento < hoy ? 'Vencida' : 'Vigente';
    return { ...doc, estado, fechaVencimiento: vencimiento };
  });

  return docsConEstado;
};

// Obtener una documentación por ID
const obtenerPorId = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM Documentacion WHERE idDocumentacion = ?',
    [id]
  );

  if (rows.length === 0) return null;

  // Fecha de hoy normalizada
  const hoy = normalizarFecha(new Date());

  const docsConEstado = rows.map(doc => {
    const vencimiento = normalizarFecha(doc.fechaVencimiento);

    const estado = vencimiento < hoy ? 'Vencida' : 'Vigente';

    return {
      ...doc,
      estado,
      fechaVencimiento: vencimiento
    };
  });

  return docsConEstado[0];
};

const obtenerPorDetalle = async (detalle) => {
  const [rows] = await db.query("SELECT * FROM Documentacion WHERE detalle = ?", [detalle]);
  return rows[0];
};

// Crear nueva documentación
const crear = async (data) => {
  const { detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer } = data;

  const [existeChofer] = await db.query(
    "SELECT * FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  if (existeChofer.length === 0) {
    throw new Error("El idChofer ingresado no existe");
  }

  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt = parseInt(idVehiculo, 10) || null;
  const idChoferInt = parseInt(idChofer, 10) || null;

  const fechaNormalizada = normalizarFecha(fechaVencimiento);

  const [result] = await db.query(
    `INSERT INTO Documentacion 
      (detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [detalle, nombre, renovacionInt, fechaNormalizada, idVehiculoInt, idChoferInt]
  );

  return { 
    id: result.insertId,
    detalle,
    nombre,
    renovacion: renovacionInt,
    fechaVencimiento: fechaNormalizada,
    idVehiculo: idVehiculoInt,
    idChofer: idChoferInt
  };
};


// Actualizar documentación
const actualizar = async (id, data) => {
  const { detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer } = data;

  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt = parseInt(idVehiculo, 10) || null;
  const idChoferInt = parseInt(idChofer, 10) || null;

let fechaNormalizada = fechaVencimiento || fechaActual;

// Si fecha viene en formato Date de MySQL, corrige:
fechaNormalizada = normalizarFecha(fechaNormalizada);


  await db.query(
    `UPDATE Documentacion 
     SET detalle = ?, nombre = ?, renovacion = ?, fechaVencimiento = ?, 
         idVehiculo = ?, idChofer = ?
     WHERE idDocumentacion = ?`,
    [detalle, nombre, renovacionInt, fechaNormalizada, idVehiculoInt, idChoferInt, id]
  );

  return {
    id,
    detalle,
    nombre,
    renovacion: renovacionInt,
    fechaVencimiento: fechaNormalizada,
    idVehiculo: idVehiculoInt,
    idChofer: idChoferInt
  };
};

// Eliminar documentación
const eliminar = async (id) => {
  await db.query('DELETE FROM Documentacion WHERE idDocumentacion = ?', [id]);
  return { mensaje: 'Documentación eliminada correctamente' };
};

module.exports = { 
    obtenerTodas, 
    obtenerPorId,
    obtenerPorDetalle,
    crear, 
    actualizar, 
    eliminar 
};
