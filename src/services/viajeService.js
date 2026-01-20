const db = require("../config/db");

// ============================================================
// Función para validar disponibilidad temporal de chofer y vehículo
// ============================================================
const validarDisponibilidadTemporal = async (idChofer, idVehiculo, fechaInicio, fechaFin, idViajeActual = null) => {
  // Buscar viajes que se superponen en fechas (excluyendo el viaje actual si se está actualizando)
  let query = `
    SELECT idViaje FROM Viaje
    WHERE (idChofer = ? OR idVehiculo = ?)
    AND estado != 'CANCELADO'
    AND NOT (fechaFin < ? OR fechaInicio > ?)
  `;
  const params = [idChofer, idVehiculo, fechaInicio, fechaFin];

  // Si estamos actualizando un viaje, excluirlo de la validación
  if (idViajeActual) {
    query += " AND idViaje != ?";
    params.push(idViajeActual);
  }

  const [conflictos] = await db.query(query, params);
  
  if (conflictos.length > 0) {
    const error = new Error(
      `El chofer o vehículo no está disponible en el rango de fechas seleccionado`
    );
    error.statusCode = 400;
    throw error;
  }
};

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
      cliente: r.clienteId
        ? {
            idCliente: r.clienteId,
            razonSocial: r.clienteRazonSocial,
            tipo: r.clienteTipo,
            correo: r.clienteCorreo,
            persona: r.clienteIdPersona
              ? {
                  nombre: r.clienteNombre,
                  apellido: r.clienteApellido,
                  cuit: r.clienteCuit,
                }
              : null,
          }
        : null,

      // Estructura Chofer
      idChofer: r.choferId,
      chofer: r.choferId
        ? {
            idChofer: r.choferId,
            dni: r.choferDni,
            persona: r.choferIdPersona
              ? {
                  nombre: r.choferPersonaNombre,
                  apellido: r.choferPersonaApellido,
                  cuit: r.choferPersonaCuit,
                }
              : null,
          }
        : null,

      // Estructura Vehiculo
      idVehiculo: r.vehiculoId,
      vehiculo: r.vehiculoId
        ? {
            idVehiculo: r.vehiculoId,
            patente: r.vehiculoPatente,
            marca: r.vehiculoMarca,
            modelo: r.vehiculoModelo,
          }
        : null,

      gastos: gastos,
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
    fechaInicio,
    fechaFin,
    kilometros,
    observaciones,
    motivoCancelacion,
    precio,
    idCliente,
    idLocalidadOrigen,
    idLocalidadDestino,
    idChofer,
    idVehiculo,
  } = viaje;

  // Validar que chofer y vehículo existan
  const [choferCheck] = await db.query(
    "SELECT idChofer FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  if (choferCheck.length === 0) {
    const error = new Error("El chofer ingresado no existe");
    error.statusCode = 404;
    throw error;
  }

  const [vehiculoCheck] = await db.query(
    "SELECT idVehiculo FROM Vehiculo WHERE idVehiculo = ?",
    [idVehiculo]
  );
  if (vehiculoCheck.length === 0) {
    const error = new Error("El vehículo ingresado no existe");
    error.statusCode = 404;
    throw error;
  }

  // Validar disponibilidad temporal
  await validarDisponibilidadTemporal(idChofer, idVehiculo, fechaInicio, fechaFin);

  // Calcular estado al crear (siempre INICIADO)
  const estadoInicial = "INICIADO";

  // Insertar usando fechaInicio y fechaFin
  const [result] = await db.query(
    `INSERT INTO Viaje (estado, fechaInicio, fechaFin, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChofer, idVehiculo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      estadoInicial,
      fechaInicio,
      fechaFin,
      kilometros,
      observaciones,
      motivoCancelacion,
      precio,
      idCliente,
      idLocalidadOrigen,
      idLocalidadDestino,
      idChofer,
      idVehiculo,
    ]
  );

  return obtenerViajes({ idViaje: result.insertId }).then((rows) => rows[0]);
};

// ============================================================
// PUT - actualizar viaje
// ============================================================
const actualizar = async (id, viaje) => {
  const {
    fechaInicio,
    fechaFin,
    kilometros,
    observaciones,
    motivoCancelacion,
    precio,
    idCliente,
    idLocalidadOrigen,
    idLocalidadDestino,
    estado,
    idChofer: newIdChofer,
    idVehiculo: newIdVehiculo,
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

  // Usar nuevos IDs si se proporcionan, sino mantener los actuales
  const idChofer = newIdChofer || actual.idChofer;
  const idVehiculo = newIdVehiculo || actual.idVehiculo;

  // Usar valores actuales si no se proporcionan
  const nuevaFechaInicio = fechaInicio || actual.fechaInicio;
  const nuevaFechaFin = fechaFin || actual.fechaFin;
  const nuevoEstado = estado || actual.estado;

  // Validar disponibilidad temporal si cambian chofer, vehículo o fechas
  if (newIdChofer || newIdVehiculo || fechaInicio || fechaFin) {
    await validarDisponibilidadTemporal(idChofer, idVehiculo, nuevaFechaInicio, nuevaFechaFin, id);
  }

  // Actualizar en BD
  await db.query(
    `UPDATE Viaje SET 
      fechaInicio=?, fechaFin=?, kilometros=?, observaciones=?, motivoCancelacion=?, 
      precio=?, idCliente=?, idLocalidadOrigen=?, idLocalidadDestino=?,
      idChofer=?, idVehiculo=?, estado=?
     WHERE idViaje=?`,
    [
      nuevaFechaInicio,
      nuevaFechaFin,
      kilometros || actual.kilometros,
      observaciones || actual.observaciones,
      motivoCancelacion || actual.motivoCancelacion,
      precio || actual.precio,
      idCliente || actual.idCliente,
      idLocalidadOrigen || actual.idLocalidadOrigen,
      idLocalidadDestino || actual.idLocalidadDestino,
      idChofer,
      idVehiculo,
      nuevoEstado,
      id,
    ]
  );

  return obtenerViajes({ idViaje: id }).then((rows) => rows[0]);
};

const eliminar = async (id) => {
  await db.query("DELETE FROM Viaje WHERE idViaje = ?", [id]);
  return { message: "Viaje eliminado correctamente" };
};

module.exports = { obtenerViajes, crear, actualizar, eliminar, validarDisponibilidadTemporal };
