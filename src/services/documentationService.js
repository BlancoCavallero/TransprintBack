const db = require('../config/db');

const normalizarFecha = (fecha) => {
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0); // pone la hora a 00:00:00
  return f;
};

const formatearFechaCorta = (fecha) => {
  const f = new Date(fecha);
  const yyyy = f.getFullYear();
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  const dd = String(f.getDate() + 1).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Obtener todas las documentaciones
const obtenerTodas = async () => {
  const [rows] = await db.query('SELECT * FROM Documentacion');

  const hoy = normalizarFecha(new Date());
  // Calcular estado dinámico
  const docsConEstado = rows.map(doc => {
    const vencimiento = normalizarFecha(doc.fechaVencimiento);
    const estado = vencimiento < hoy ? 'Vencida' : 'Vigente';
    return { ...doc, estado, fechaVencimiento: formatearFechaCorta(vencimiento) };
  });

  return docsConEstado;
};

// Obtener una documentación por ID
const obtenerPorId = async (id) => {
  const [rows] = await db.query('SELECT * FROM Documentacion WHERE idDocumentacion = ?', [id]);

  const hoy = normalizarFecha(new Date());
  // Calcular estado dinámico
  const docsConEstado = rows.map(doc => {
    const vencimiento = normalizarFecha(doc.fechaVencimiento);
    const estado = vencimiento < hoy ? 'Vencida' : 'Vigente';
    return { ...doc, estado, fechaVencimiento: formatearFechaCorta(vencimiento) };
  });

  return docsConEstado[0] || null;
};

const obtenerPorDetalle = async (detalle) => {
  const [rows] = await db.query("SELECT * FROM Documentacion WHERE detalle = ?", [detalle]);
  return rows[0];
};

// Crear nueva documentación
const crear = async (data) => {
  const { detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer} = data;

  //verifico que el Chofer ya esté registrado
  const [existeChofer] = await db.query(
    "SELECT * FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  if (existeChofer.length == 0) {
    throw new Error("El idChofer ingresado no existe ");
  }

  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt = parseInt(idVehiculo, 10) || null;
  const idChoferInt = parseInt(idChofer, 10) || null;

  const fechaNormalizada = normalizarFecha(fechaVencimiento);
  const [result] = await db.query(    
    'INSERT INTO Documentacion (detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer) VALUES (?, ?, ?, ?, ?, ?)',
    [detalle, nombre, renovacionInt, fechaVencimiento, idVehiculoInt, idChoferInt]
  );
  return { id: result.insertId, ...data, fechaVencimiento: fechaNormalizada };
};

// Actualizar documentación
const actualizar = async (id, data) => {
  const { detalle, nombre, renovacion, fechaVencimiento, idVehiculo, idChofer } = data;
  
  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt = parseInt(idVehiculo, 10) || null;
  const idChoferInt = parseInt(idChofer, 10) || null;
  //si no viene fecha de vencimiento queda el valor que estaba
  const fechaNormalizada = fechaVencimiento ? normalizarFecha(fechaVencimiento) : resultado.fechaVencimiento;
  await db.query(
    'UPDATE Documentacion SET detalle = ?, nombre = ?, renovacion = ?, fechaVencimiento = ?, idVehiculo = ?, idChofer = ? WHERE idDocumentacion = ?',//agregar idChofer e idVehículo
    [detalle, nombre, renovacionInt, fechaNormalizada, idVehiculoInt, idChoferInt, id]
  );


  return { id, ...data, fechaVencimiento: fechaNormalizada};
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
