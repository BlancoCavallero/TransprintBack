const db = require("../config/db");

// ============================================================
// Función auxiliar para calcular estado automáticamente
// ============================================================
const calcularEstado = (fechaInicio, fechaFin, estadoActual) => {
  // Si el estado es CANCELADO, se mantiene
  if (estadoActual === "CANCELADO") {
    return "CANCELADO";
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(fechaFin);
  fin.setHours(0, 0, 0, 0);

  // Si hoy < fechaInicio → INICIADO
  if (hoy < inicio) {
    return "INICIADO";
  }

  // Si hoy >= fechaInicio AND hoy <= fechaFin → EN CURSO
  if (hoy >= inicio && hoy <= fin) {
    return "EN CURSO";
  }

  // Si hoy > fechaFin → FINALIZADO
  if (hoy > fin) {
    return "FINALIZADO";
  }

  return "INICIADO"; // Por defecto
};

// ============================================================
// GET - obtener todos o filtrados
// ============================================================
const obtenerViajes = async (filtros = {}) => {
  let query = `
    SELECT v.*, 
           c.idCliente AS clienteId, c.razonSocial AS clienteRazonSocial, c.tipo AS clienteTipo, c.correo AS clienteCorreo, c.idPersona AS clienteIdPersona,
           p.nombre AS clienteNombre, p.apellido AS clienteApellido, p.cuit AS clienteCuit,
           
           ch.idChofer AS choferId, ch.dni AS choferDni, ch.idPersona AS choferIdPersona,
           per.nombre AS choferPersonaNombre, per.apellido AS choferPersonaApellido, per.cuit AS choferPersonaCuit,
           
           ve.idVehiculo AS vehiculoId, ve.patente AS vehiculoPatente, ve.marca AS vehiculoMarca, ve.modelo AS vehiculoModelo, ve.tipo AS vehiculoTipo
           
    FROM Viaje v
    LEFT JOIN Cliente c ON v.idCliente = c.idCliente
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
    LEFT JOIN Chofer ch ON v.idChofer = ch.idChofer
    LEFT JOIN Persona per ON ch.idPersona = per.idPersona
    LEFT JOIN Vehiculo ve ON v.idVehiculo = ve.idVehiculo
    
    WHERE 1=1
  `;
  const params = [];

  if (filtros.idViaje) {
    query += " AND v.idViaje = ?";
    params.push(filtros.idViaje);
  }
  if (filtros.estado) {
    query += " AND v.estado LIKE ?";
    params.push(`%${filtros.estado}%`);
  }
  if (filtros.idCliente) {
    query += " AND v.idCliente = ?";
    params.push(filtros.idCliente);
  }
  if (filtros.idChofer) {
    query += " AND v.idChofer = ?";
    params.push(filtros.idChofer);
  }

  const [rows] = await db.query(query, params);

  const resultado = [];
  for (const r of rows) {
    // Obtener gastos
    const [gastos] = await db.query(
      "SELECT idGasto, detalle, monto, tipo, idViaje FROM Gasto WHERE idViaje = ?",
      [r.idViaje]
    );

    // Calcular estado automáticamente
    const estadoCalculado = calcularEstado(r.fechaInicio, r.fechaFin, r.estado);

    const viajeObj = {
      idViaje: r.idViaje,
      estado: estadoCalculado,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      kilometros: r.kilometros,
      observaciones: r.observaciones,
      motivoCancelacion: r.motivoCancelacion,
      precio: r.precio,
      idLocalidadOrigen: r.idLocalidadOrigen,
      idLocalidadDestino: r.idLocalidadDestino,
      
      // Estructura Cliente
      idCliente: r.idCliente,
      cliente: r.clienteId ? {
        idCliente: r.clienteId,
        razonSocial: r.clienteRazonSocial,
        tipo: r.clienteTipo,
        correo: r.clienteCorreo,
        persona: r.clienteIdPersona ? {
           nombre: r.clienteNombre,
           apellido: r.clienteApellido,
           cuit: r.clienteCuit
        } : null
      } : null,

      // Estructura Chofer
      idChofer: r.choferId,
      chofer: r.choferId ? {
         idChofer: r.choferId,
         dni: r.choferDni,
         persona: r.choferIdPersona ? {
            nombre: r.choferPersonaNombre,
            apellido: r.choferPersonaApellido,
            cuit: r.choferPersonaCuit
         } : null
      } : null,

      // Estructura Vehiculo
      idVehiculo: r.vehiculoId,
      vehiculo: r.vehiculoId ? {
         idVehiculo: r.vehiculoId,
         patente: r.vehiculoPatente,
         marca: r.vehiculoMarca,
         modelo: r.vehiculoModelo
      } : null,

      gastos: gastos
    };
    resultado.push(viajeObj);
  }
  return resultado;
};

// ============================================================
// POST - crear viaje
// ============================================================
const crear = async (viaje) => {
  const {
    fechaInicio, fechaFin, kilometros, observaciones, motivoCancelacion,
    precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
    idChoferVehiculo 
  } = viaje;

  // Obtener idChofer e idVehiculo a partir del idChoferVehiculo
  const [cvRows] = await db.query(
    "SELECT idChofer, idVehiculo FROM ChoferXVehiculo WHERE idChoferVehiculo = ?",
    [idChoferVehiculo]
  );
  
  if (cvRows.length === 0) {
    throw new Error("La relación Chofer–Vehículo ingresada no existe");
  }

  const { idChofer, idVehiculo } = cvRows[0];

  // Calcular estado al crear (siempre INICIADO)
  const estadoInicial = "INICIADO";

  // Insertar usando fechaInicio y fechaFin
  const [result] = await db.query(
    `INSERT INTO Viaje (estado, fechaInicio, fechaFin, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChofer, idVehiculo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      estadoInicial, fechaInicio, fechaFin, kilometros, observaciones, 
      motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
      idChofer, idVehiculo
    ]
  );

  return obtenerViajes({ idViaje: result.insertId }).then(rows => rows[0]);
};

// ============================================================
// PUT - actualizar viaje
// ============================================================
const actualizar = async (id, viaje) => {
  const {
    fechaInicio, fechaFin, kilometros, observaciones, motivoCancelacion,
    precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
    estado, idChoferVehiculo 
  } = viaje;

  // Obtener viaje actual para valores por defecto
  const [viajeActual] = await db.query(
    "SELECT * FROM Viaje WHERE idViaje = ?",
    [id]
  );

  if (viajeActual.length === 0) {
    throw new Error("Viaje no encontrado");
  }

  const actual = viajeActual[0];

  // Si se proporciona idChoferVehiculo, validar y obtener IDs
  let idChofer = actual.idChofer;
  let idVehiculo = actual.idVehiculo;

  if (idChoferVehiculo) {
    const [cvRows] = await db.query(
      "SELECT idChofer, idVehiculo FROM ChoferXVehiculo WHERE idChoferVehiculo = ?",
      [idChoferVehiculo]
    );
    if (cvRows.length === 0) {
      throw new Error("La relación Chofer–Vehículo ingresada no existe");
    }
    idChofer = cvRows[0].idChofer;
    idVehiculo = cvRows[0].idVehiculo;
  }

  // Usar valores actuales si no se proporcionan
  const nuevaFechaInicio = fechaInicio || actual.fechaInicio;
  const nuevaFechaFin = fechaFin || actual.fechaFin;
  const nuevoEstado = estado || actual.estado;

  // Actualizar en BD
  await db.query(
    `UPDATE Viaje SET 
      fechaInicio=?, fechaFin=?, kilometros=?, observaciones=?, motivoCancelacion=?, 
      precio=?, idCliente=?, idLocalidadOrigen=?, idLocalidadDestino=?,
      idChofer=?, idVehiculo=?, estado=?
     WHERE idViaje=?`,
    [
      nuevaFechaInicio, nuevaFechaFin, kilometros || actual.kilometros,
      observaciones || actual.observaciones, motivoCancelacion || actual.motivoCancelacion,
      precio || actual.precio, idCliente || actual.idCliente,
      idLocalidadOrigen || actual.idLocalidadOrigen, idLocalidadDestino || actual.idLocalidadDestino,
      idChofer, idVehiculo, nuevoEstado,
      id
    ]
  );

  return obtenerViajes({ idViaje: id }).then(rows => rows[0]);
};

const eliminar = async (id) => {
  await db.query("DELETE FROM Viaje WHERE idViaje = ?", [id]);
  return { message: "Viaje eliminado correctamente" };
};

module.exports = { obtenerViajes, crear, actualizar, eliminar };