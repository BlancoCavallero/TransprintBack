const db = require("../config/db");

// ✅ GET - obtener todos o filtrados
const obtenerViajes = async (filtros = {}) => {
  // Query to bring viaje with cliente and choferVehiculo (with chofer.persona and vehiculo)
  let query = `
    SELECT v.*, 
           c.idCliente AS clienteId, c.razonSocial AS clienteRazonSocial, c.tipo AS clienteTipo, c.correo AS clienteCorreo, c.idPersona AS clienteIdPersona,
           p.nombre AS clienteNombre, p.apellido AS clienteApellido, p.cuit AS clienteCuit,
           cv.idChoferVehiculo AS choferVehiculoId, cv.idChofer AS cvChoferId, cv.idVehiculo AS cvVehiculoId,
           ch.idChofer AS choferId, ch.dni AS choferDni, ch.idPersona AS choferIdPersona,
           per.nombre AS choferPersonaNombre, per.apellido AS choferPersonaApellido, per.cuit AS choferPersonaCuit,
           ve.idVehiculo AS vehiculoId, ve.patente AS vehiculoPatente, ve.marca AS vehiculoMarca, ve.modelo AS vehiculoModelo, ve.tipo AS vehiculoTipo
    FROM Viaje v
    LEFT JOIN Cliente c ON v.idCliente = c.idCliente
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
    LEFT JOIN ChoferXVehiculo cv ON v.idChoferVehiculo = cv.idChoferVehiculo
    LEFT JOIN Chofer ch ON cv.idChofer = ch.idChofer
    LEFT JOIN Persona per ON ch.idPersona = per.idPersona
    LEFT JOIN Vehiculo ve ON cv.idVehiculo = ve.idVehiculo
    WHERE 1=1
  `;
  const params = [];

  if (filtros.idViaje) {
    query += " AND idViaje = ?";
    params.push(filtros.idViaje);
  }
  if (filtros.estado) {
    query += " AND estado LIKE ?";
    params.push(`%${filtros.estado}%`);
  }
  if (filtros.idCliente) {
    query += " AND idCliente = ?";
    params.push(filtros.idCliente);
  }
  if (filtros.idChoferVehiculo) {
    query += " AND idChoferVehiculo = ?";
    params.push(filtros.idChoferVehiculo);
  }
  if (filtros.idLocalidadOrigen) {
    query += " AND idLocalidadOrigen = ?";
    params.push(filtros.idLocalidadOrigen);
  }
  if (filtros.idLocalidadDestino) {
    query += " AND idLocalidadDestino = ?";
    params.push(filtros.idLocalidadDestino);
  }

  const [rows] = await db.query(query, params);
  // For each viaje, attach nested cliente, choferVehiculo and gastos
  const resultado = [];
  for (const r of rows) {
    const gastos = await db.query(
      "SELECT idGasto AS idGasto, detalle, monto, tipo, idViaje FROM Gasto WHERE idViaje = ?",
      [r.idViaje]
    );
    const gastosRows = gastos[0];
    const viajeObj = {
      idViaje: r.idViaje,
      estado: r.estado,
      fecha: r.fecha,
      kilometros: r.kilometros,
      observaciones: r.observaciones,
      motivoCancelacion: r.motivoCancelacion,
      precio: r.precio,
      idCliente: r.clienteId || r.idCliente,
      cliente: r.clienteId
        ? {
            idCliente: r.clienteId,
            razonSocial: r.clienteRazonSocial,
            tipo: r.clienteTipo,
            correo: r.clienteCorreo,
            persona: r.clienteIdPersona
              ? {
                  idPersona: r.clienteIdPersona,
                  nombre: r.clienteNombre,
                  apellido: r.clienteApellido,
                  cuit: r.clienteCuit,
                }
              : null,
          }
        : null,
      idChoferVehiculo: r.choferVehiculoId || r.idChoferVehiculo,
      choferVehiculo: r.choferVehiculoId
        ? {
            idChoferVehiculo: r.choferVehiculoId,
            chofer: r.choferId
              ? {
                  idChofer: r.choferId,
                  dni: r.choferDni,
                  persona: r.choferIdPersona
                    ? {
                        idPersona: r.choferIdPersona,
                        nombre: r.choferPersonaNombre,
                        apellido: r.choferPersonaApellido,
                        cuit: r.choferPersonaCuit,
                      }
                    : null,
                }
              : null,
            vehiculo: r.vehiculoId
              ? {
                  idVehiculo: r.vehiculoId,
                  patente: r.vehiculoPatente,
                  marca: r.vehiculoMarca,
                  modelo: r.vehiculoModelo,
                  tipo: r.vehiculoTipo,
                }
              : null,
          }
        : null,
      idLocalidadOrigen: r.idLocalidadOrigen,
      idLocalidadDestino: r.idLocalidadDestino,
      gastos: gastosRows,
    };
    resultado.push(viajeObj);
  }
  return resultado;
};

// ✅ POST - crear viaje
const crear = async (viaje) => {
  const {
    estado,
    fecha,
    kilometros,
    observaciones,
    motivoCancelacion,
    precio,
    idCliente,
    idLocalidadOrigen,
    idLocalidadDestino,
    idChoferVehiculo,
  } = viaje;

  const [result] = await db.query(
    `INSERT INTO Viaje (estado, fecha, kilometros, observaciones, motivoCancelacion, precio, idCliente, idLocalidadOrigen, idLocalidadDestino, idChoferVehiculo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      estado,
      fecha,
      kilometros,
      observaciones,
      motivoCancelacion,
      precio,
      idCliente,
      idLocalidadOrigen,
      idLocalidadDestino,
      idChoferVehiculo,
    ]
  );

  const idViaje = result.insertId;
  const [rows] = await db.query("SELECT * FROM Viaje WHERE idViaje = ?", [
    idViaje,
  ]);
  // Use obtenerViajes to get enriched object for the single id
  const viajes = await obtenerViajes({ idViaje });
  return viajes[0] || { idViaje, ...viaje };
};

// ✅ PUT - actualizar viaje
const actualizar = async (id, viaje) => {
  const {
    estado,
    fecha,
    kilometros,
    observaciones,
    motivoCancelacion,
    precio,
    idCliente,
    idLocalidadOrigen,
    idLocalidadDestino,
    idChoferVehiculo,
  } = viaje;

  await db.query(
    `UPDATE Viaje SET estado=?, fecha=?, kilometros=?, observaciones=?, motivoCancelacion=?, precio=?, idCliente=?, idLocalidadOrigen=?, idLocalidadDestino=?, idChoferVehiculo=? WHERE idViaje=?`,
    [
      estado,
      fecha,
      kilometros,
      observaciones,
      motivoCancelacion,
      precio,
      idCliente,
      idLocalidadOrigen,
      idLocalidadDestino,
      idChoferVehiculo,
      id,
    ]
  );
  const viajes = await obtenerViajes({ idViaje: id });
  return viajes[0] || { idViaje: id, ...viaje };
};

// ✅ DELETE - eliminar viaje
const eliminar = async (id) => {
  await db.query("DELETE FROM Viaje WHERE idViaje = ?", [id]);
  return { message: "Viaje eliminado correctamente" };
};

module.exports = {
  obtenerViajes,
  crear,
  actualizar,
  eliminar,
};
