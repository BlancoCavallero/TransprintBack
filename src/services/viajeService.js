const db = require("../config/db");

// ============================================================
// GET - obtener todos o filtrados
// ============================================================
const obtenerViajes = async (filtros = {}) => {
  // CORRECCIÓN: Hacemos JOIN directo a Chofer y Vehiculo usando las columnas de Viaje.
  // Opcionalmente hacemos JOIN a ChoferXVehiculo si necesitamos ese ID específico,
  // pero la relación principal sale de v.idChofer y v.idVehiculo.
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
    
    -- Joins corregidos según las columnas reales de Viaje
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
  // Filtro corregido: Si filtras por chofer, usas v.idChofer
  if (filtros.idChofer) {
    query += " AND v.idChofer = ?";
    params.push(filtros.idChofer);
  }

  const [rows] = await db.query(query, params);

  const resultado = [];
  for (const r of rows) {
    // Traer gastos (esto se mantiene igual)
    const [gastos] = await db.query(
      "SELECT idGasto, detalle, monto, tipo, idViaje FROM Gasto WHERE idViaje = ?",
      [r.idViaje]
    );

    const viajeObj = {
      idViaje: r.idViaje,
      estado: r.estado,
      fecha: r.fecha,
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

      // Estructura Chofer (Directo)
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

      // Estructura Vehiculo (Directo)
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
    estado, fecha, kilometros, observaciones, motivoCancelacion,
    precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
    // Nota: El frontend puede mandarte idChoferVehiculo (la relación) O idChofer e idVehiculo separados.
    // Asumiré que te mandan el ID de la relación para validar que existe.
    idChoferVehiculo 
  } = viaje;

  // 1. Obtener idChofer e idVehiculo a partir del idChoferVehiculo
  // Esto valida que la relación existe y obtiene los IDs individuales para la tabla Viaje
  const [cvRows] = await db.query(
    "SELECT idChofer, idVehiculo FROM ChoferXVehiculo WHERE idChoferVehiculo = ?",
    [idChoferVehiculo]
  );
  
  if (cvRows.length === 0) {
    throw new Error("La relación Chofer–Vehículo ingresada no existe");
  }

  const { idChofer, idVehiculo } = cvRows[0];

  // 2. Insertar usando las columnas REALES de la BBDD (idChofer, idVehiculo)
  const [result] = await db.query(
    `INSERT INTO Viaje (estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChofer, idVehiculo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      estado, fecha, kilometros, observaciones, motivoCancelacion,
      precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
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
    estado, fecha, kilometros, observaciones, motivoCancelacion,
    precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
    idChoferVehiculo 
  } = viaje;

  // 1. Validar y obtener IDs desglosados
  const [cvRows] = await db.query(
    "SELECT idChofer, idVehiculo FROM ChoferXVehiculo WHERE idChoferVehiculo = ?",
    [idChoferVehiculo]
  );
  if (cvRows.length === 0) {
    throw new Error("La relación Chofer–Vehículo ingresada no existe");
  }
  const { idChofer, idVehiculo } = cvRows[0];

  // 2. Actualizar columnas idChofer e idVehiculo
  await db.query(
    `UPDATE Viaje SET 
      estado=?, fecha=?, kilometros=?, observaciones=?, motivoCancelacion=?, 
      precio=?, idCliente=?, idLocalidadOrigen=?, idLocalidadDestino=?,
      idChofer=?, idVehiculo=?
     WHERE idViaje=?`,
    [
      estado, fecha, kilometros, observaciones, motivoCancelacion,
      precio, idCliente, idLocalidadOrigen, idLocalidadDestino,
      idChofer, idVehiculo,
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