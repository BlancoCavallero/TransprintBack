const db = require("../config/db");

const listarChoferVehiculos = async (filtros = {}) => {
  let query = `
    SELECT cv.idChoferVehiculo, cv.fechaAsignacion,
           ch.idChofer AS choferId, ch.dni AS choferDni, ch.idPersona AS choferPersonaId,
           p.nombre AS choferPersonaNombre, p.apellido AS choferPersonaApellido, p.cuit AS choferPersonaCuit, p.telefono AS choferPersonaTelefono,
           v.idVehiculo AS vehiculoId, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.patente AS vehiculoPatente, v.anio AS vehiculoAnio, v.tipo AS vehiculoTipo
    FROM ChoferXVehiculo cv
    LEFT JOIN Chofer ch ON cv.idChofer = ch.idChofer
    LEFT JOIN Persona p ON ch.idPersona = p.idPersona
    LEFT JOIN Vehiculo v ON cv.idVehiculo = v.idVehiculo
    WHERE 1=1
  `;
  const params = [];

  if (filtros.idChoferVehiculo) {
    query += " AND cv.idChoferVehiculo = ?";
    params.push(filtros.idChoferVehiculo);
  }
  if (filtros.idChofer) {
    query += " AND cv.idChofer = ?";
    params.push(filtros.idChofer);
  }
  if (filtros.idVehiculo) {
    query += " AND cv.idVehiculo = ?";
    params.push(filtros.idVehiculo);
  }

  const [rows] = await db.query(query, params);
  return rows.map((r) => ({
    idChoferVehiculo: r.idChoferVehiculo,
    fechaAsignacion: r.fechaAsignacion,
    chofer: r.choferId
      ? {
          idChofer: r.choferId,
          dni: r.choferDni,
          persona: r.choferPersonaId
            ? {
                idPersona: r.choferPersonaId,
                nombre: r.choferPersonaNombre,
                apellido: r.choferPersonaApellido,
                cuit: r.choferPersonaCuit,
                telefono: r.choferPersonaTelefono,
              }
            : null,
        }
      : null,
    vehiculo: r.vehiculoId
      ? {
          idVehiculo: r.vehiculoId,
          marca: r.vehiculoMarca,
          modelo: r.vehiculoModelo,
          patente: r.vehiculoPatente,
          anio: r.vehiculoAnio,
          tipo: r.vehiculoTipo,
        }
      : null,
  }));
};

const obtenerPorId = async (id) => {
  const rows = await listarChoferVehiculos({ idChoferVehiculo: id });
  return rows[0] || null;
};

const crearChoferVehiculo = async ({ idChofer, idVehiculo, fechaAsignacion = null }) => {
  // Verificar existencia de chofer
  const [choferRows] = await db.query("SELECT idChofer FROM Chofer WHERE idChofer = ?", [idChofer]);
  if (choferRows.length === 0) throw new Error("El idChofer ingresado no existe");

  // Verificar existencia de vehiculo
  const [vehRows] = await db.query("SELECT idVehiculo FROM Vehiculo WHERE idVehiculo = ?", [idVehiculo]);
  if (vehRows.length === 0) throw new Error("El idVehiculo ingresado no existe");

  // Verificar que no exista la relación (uq_chofer_vehiculo)
  const [existe] = await db.query("SELECT * FROM ChoferXVehiculo WHERE idChofer = ? AND idVehiculo = ?", [idChofer, idVehiculo]);
  if (existe.length > 0) throw new Error("La relación chofer-vehículo ya existe");

  const [result] = await db.query(
    "INSERT INTO ChoferXVehiculo (idChofer, idVehiculo, fechaAsignacion) VALUES (?, ?, ?)",
    [idChofer, idVehiculo, fechaAsignacion]
  );
  return await obtenerPorId(result.insertId);
};

const eliminarChoferVehiculo = async (id) => {
  return db.query("DELETE FROM ChoferXVehiculo WHERE idChoferVehiculo = ?", [id]);
};

module.exports = {
  listarChoferVehiculos,
  obtenerPorId,
  crearChoferVehiculo,
  eliminarChoferVehiculo,
};
