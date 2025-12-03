const db = require("../config/db");

const obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT c.idCliente, c.correo, c.observaciones, c.razonSocial, c.tipo, c.idPersona, c.idLocalidad,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono,
           l.nombre AS localidadNombre, l.codPostal AS localidadCodPostal, l.idProvincia,
           pr.nombre AS provinciaNombre
    FROM Cliente c
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
    LEFT JOIN Localidad l ON c.idLocalidad = l.idLocalidad
    LEFT JOIN Provincia pr ON l.idProvincia = pr.idProvincia
  `);

  // Map each row into object containing nested persona and localidad
  const mapped = rows.map((r) => ({
    idCliente: r.idCliente,
    correo: r.correo,
    observaciones: r.observaciones,
    razonSocial: r.razonSocial,
    tipo: r.tipo,
    idPersona: r.idPersona,
    idLocalidad: r.idLocalidad,
    persona: r.idPersona
      ? {
          idPersona: r.idPersona,
          nombre: r.personaNombre,
          apellido: r.personaApellido,
          cuit: r.personaCuit,
          telefono: r.personaTelefono,
        }
      : null,
    localidad: r.idLocalidad
      ? {
          idLocalidad: r.idLocalidad,
          nombre: r.localidadNombre,
          codPostal: r.localidadCodPostal,
          idProvincia: r.idProvincia,
          provincia: r.provinciaNombre,
        }
      : null,
  }));

  return mapped;
};

const obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `
    SELECT c.idCliente, c.correo, c.observaciones, c.razonSocial, c.tipo, c.idPersona, c.idLocalidad,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono,
           l.nombre AS localidadNombre, l.codPostal AS localidadCodPostal, l.idProvincia,
           pr.nombre AS provinciaNombre
    FROM Cliente c
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
    LEFT JOIN Localidad l ON c.idLocalidad = l.idLocalidad
    LEFT JOIN Provincia pr ON l.idProvincia = pr.idProvincia
    WHERE c.idCliente = ?
  `,
    [id]
  );

  const r = rows[0];
  if (!r) return null;
  return {
    idCliente: r.idCliente,
    correo: r.correo,
    observaciones: r.observaciones,
    razonSocial: r.razonSocial,
    tipo: r.tipo,
    idPersona: r.idPersona,
    idLocalidad: r.idLocalidad,
    persona: r.idPersona
      ? {
          idPersona: r.idPersona,
          nombre: r.personaNombre,
          apellido: r.personaApellido,
          cuit: r.personaCuit,
          telefono: r.personaTelefono,
        }
      : null,
    localidad: r.idLocalidad
      ? {
          idLocalidad: r.idLocalidad,
          nombre: r.localidadNombre,
          codPostal: r.localidadCodPostal,
          idProvincia: r.idProvincia,
          provincia: r.provinciaNombre,
        }
      : null,
  };
};

// --- Obtener clientes por tipo, nombre, razon social o CUIT ---
const obtenerClientesFiltrados = async (valor) => {
  // Verificamos si el valor es un número para buscar por DNI
  const esNumero = /^\d+$/.test(valor);
  //falta filtrar por localidad o provincia
  const [rows] = await db.query(
    `
    SELECT c.idCliente, c.correo, c.observaciones, c.razonSocial, c.tipo, c.idPersona, c.idLocalidad,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Cliente c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE
      LOWER(CONVERT(c.tipo USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(p.nombre USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(c.razonSocial USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      ${esNumero ? "OR p.cuit = ?" : ""}
  `,
    esNumero ? [valor, valor, valor, valor] : [valor, valor, valor]
  );

  // Map to include persona object
  const mapped = rows.map((r) => ({
    idCliente: r.idCliente,
    correo: r.correo,
    observaciones: r.observaciones,
    razonSocial: r.razonSocial,
    tipo: r.tipo,
    idPersona: r.idPersona,
    idLocalidad: r.idLocalidad,
    persona: {
      idPersona: r.idPersona,
      nombre: r.personaNombre,
      apellido: r.personaApellido,
      cuit: r.personaCuit,
      telefono: r.personaTelefono,
    },
  }));

  return mapped;
};

const obtenerPorCorreo = async (correo) => {
  const [rows] = await db.query("SELECT * FROM Cliente WHERE correo = ?", [
    correo,
  ]);
  return rows[0] || null;
};

const crearCliente = async (cliente) => {
  const { correo, observaciones, razonSocial, tipo, idPersona, idLocalidad } =
    cliente;

  //verifico que el idPersona no esté usado en otro cliente
  const [existe] = await db.query("SELECT * FROM Cliente WHERE idPersona = ?", [
    idPersona,
  ]);
  if (existe.length > 0) {
    throw new Error("Ya existe un cliente registrado con ese idPersona");
  }

  //verifico que la persona ya esté registrada
  const [existePersona] = await db.query(
    "SELECT * FROM Persona WHERE idPersona = ?",
    [idPersona]
  );
  if (existePersona.length == 0) {
    throw new Error("El idPersona ingresado no existe ");
  }

  //verifico que la localidad ya esté registrada
  const [existeLocalidad] = await db.query(
    "SELECT * FROM Localidad WHERE idLocalidad = ?",
    [idLocalidad]
  );
  if (existeLocalidad.length === 0) {
    throw new Error("El idLocalidad ingresado no existe ");
  }

  const [result] = await db.query(
    "INSERT INTO Cliente (correo, observaciones, razonSocial, tipo, idPersona, idLocalidad) VALUES (?, ?, ?, ?, ?, ?)",
    [
      correo,
      observaciones || null,
      razonSocial,
      tipo,
      idPersona,
      idLocalidad || null,
    ]
  );
  const idCliente = result.insertId;
  // Return enriched client object
  return await obtenerPorId(idCliente);
};

const actualizarCliente = async (id, cliente) => {
  const { correo, observaciones, razonSocial, tipo, idPersona, idLocalidad } =
    cliente;
  //Verifico que el cliente exista
  const [clienteExistente] = await db.query(
    "SELECT * FROM Cliente WHERE idCliente = ?",
    [id]
  );
  if (clienteExistente.length === 0) {
    throw new Error("El cliente no existe");
  }

  /*//verifico que no se repita el dni
  const [existeDni] = await db.query(
    "SELECT * FROM Cliente WHERE dni = ?  AND idCliente != ?",
    [dni, idCliente]
  );
  if (existeDni.length > 0) {
    throw new Error("Ya existe un cliente registrado con ese DNI");
  } */

  //verifico que el idPersona no esté usado en otro cliente
  const [existe] = await db.query(
    "SELECT * FROM Cliente WHERE idPersona = ? AND idCliente != ?",
    [idPersona, id] // <-- ignoramos el cliente actual
  );
  if (existe.length > 0) {
    throw new Error("Ya existe un cliente registrado con ese idPersona");
  }

  //verifico que la persona ya esté registrada
  const [existePersona] = await db.query(
    "SELECT * FROM Persona WHERE idPersona = ?",
    [idPersona]
  );
  if (existePersona.length === 0) {
    throw new Error("El idPersona ingresado no existe ");
  }

  //verifico que la localidad ya esté registrada
  const [existeLocalidad] = await db.query(
    "SELECT * FROM Localidad WHERE idLocalidad = ?",
    [idLocalidad]
  );
  if (existeLocalidad.length === 0) {
    throw new Error("El idLocalidad ingresado no existe ");
  }

  await db.query(
    "UPDATE Cliente SET correo = ?, observaciones = ?, razonSocial = ?, tipo = ?, idPersona = ?, idLocalidad = ? WHERE idCliente = ?",
    [correo, observaciones, razonSocial, tipo, idPersona, idLocalidad, id]
  );

  // Return enriched client object
  return await obtenerPorId(id);
};

const eliminarCliente = async (id) => {
  return db.query("DELETE FROM Cliente WHERE idCliente = ?", [id]);
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerClientesFiltrados,
  obtenerPorCorreo,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
