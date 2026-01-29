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
  const {
    correo,
    observaciones,
    razonSocial,
    tipo,
    idPersona,
    idLocalidad,
    nombre,
    apellido,
    cuit,
    telefono,
  } = cliente;

  let idPersonaFinal = idPersona;

  // OPCIÓN 1: Si se envía idPersona, usar ese
  if (idPersona) {
    //verifico que el idPersona no esté usado en otro cliente
    const [existe] = await db.query(
      "SELECT * FROM Cliente WHERE idPersona = ?",
      [idPersona]
    );
    if (existe.length > 0) {
      throw new Error("Ya existe un cliente registrado con ese idPersona");
    }

    //verifico que la persona ya esté registrada
    const [existePersona] = await db.query(
      "SELECT * FROM Persona WHERE idPersona = ?",
      [idPersona]
    );
    if (existePersona.length == 0) {
      throw new Error("El idPersona ingresado no existe");
    }
  }
  // OPCIÓN 2: Si se envían datos de persona, crearla
  else if (nombre && apellido && cuit && telefono) {
    // Verificar que la persona no exista por CUIT
    const [personaExistente] = await db.query(
      "SELECT * FROM Persona WHERE cuit = ?",
      [cuit]
    );
    if (personaExistente.length > 0) {
      throw new Error("Ya existe una persona con ese CUIT");
    }

    // Crear nueva persona
    const [resultPersona] = await db.query(
      "INSERT INTO Persona (nombre, apellido, cuit, telefono) VALUES (?, ?, ?, ?)",
      [nombre, apellido, cuit, telefono]
    );
    idPersonaFinal = resultPersona.insertId;
  } else {
    throw new Error(
      "Debe proporcionar idPersona o los datos completos de la persona (nombre, apellido, cuit, telefono)"
    );
  }

  //verifico que la localidad ya esté registrada
  const [existeLocalidad] = await db.query(
    "SELECT * FROM Localidad WHERE idLocalidad = ?",
    [idLocalidad]
  );
  if (existeLocalidad.length === 0) {
    throw new Error("El idLocalidad ingresado no existe");
  }

  const [result] = await db.query(
    "INSERT INTO Cliente (correo, observaciones, razonSocial, tipo, idPersona, idLocalidad) VALUES (?, ?, ?, ?, ?, ?)",
    [
      correo,
      observaciones || null,
      razonSocial,
      tipo,
      idPersonaFinal,
      idLocalidad || null,
    ]
  );
  const idCliente = result.insertId;
  // Return enriched client object
  return await obtenerPorId(idCliente);
};

const actualizarCliente = async (id, cliente) => {
  const {
    correo,
    observaciones,
    razonSocial,
    tipo,
    idPersona,
    idLocalidad,
    nombre,
    apellido,
    cuit,
    telefono,
  } = cliente;

  //Verifico que el cliente exista
  const [clienteExistente] = await db.query(
    "SELECT * FROM Cliente WHERE idCliente = ?",
    [id]
  );
  if (clienteExistente.length === 0) {
    throw new Error("El cliente no existe");
  }

  // Obtener idPersona actual del cliente
  const idPersonaActual = clienteExistente[0].idPersona;

  // Actualizar datos del Cliente
  const datosClienteActualizar = {};
  if (correo !== undefined) datosClienteActualizar.correo = correo;
  if (observaciones !== undefined)
    datosClienteActualizar.observaciones = observaciones;
  if (razonSocial !== undefined)
    datosClienteActualizar.razonSocial = razonSocial;
  if (tipo !== undefined) datosClienteActualizar.tipo = tipo;
  if (idLocalidad !== undefined) {
    // Verificar que la localidad exista
    const [existeLocalidad] = await db.query(
      "SELECT * FROM Localidad WHERE idLocalidad = ?",
      [idLocalidad]
    );
    if (existeLocalidad.length === 0) {
      throw new Error("El idLocalidad ingresado no existe");
    }
    datosClienteActualizar.idLocalidad = idLocalidad;
  }

  if (Object.keys(datosClienteActualizar).length > 0) {
    const setClause = Object.keys(datosClienteActualizar)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(datosClienteActualizar);
    values.push(id);

    await db.query(
      `UPDATE Cliente SET ${setClause} WHERE idCliente = ?`,
      values
    );
  }

  // Actualizar datos de la Persona si se proporcionan
  if (nombre || apellido || cuit || telefono) {
    // Validar CUIT si se proporciona y es diferente
    if (cuit) {
      const [existeCuit] = await db.query(
        "SELECT * FROM Persona WHERE cuit = ? AND idPersona != ?",
        [cuit, idPersonaActual]
      );
      if (existeCuit.length > 0) {
        throw new Error("Ya existe una persona con ese CUIT");
      }
    }

    // Actualizar Persona
    const datosPersonaActualizar = {};
    if (nombre !== undefined) datosPersonaActualizar.nombre = nombre;
    if (apellido !== undefined) datosPersonaActualizar.apellido = apellido;
    if (cuit !== undefined) datosPersonaActualizar.cuit = cuit;
    if (telefono !== undefined) datosPersonaActualizar.telefono = telefono;

    if (Object.keys(datosPersonaActualizar).length > 0) {
      const setClause = Object.keys(datosPersonaActualizar)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(datosPersonaActualizar);
      values.push(idPersonaActual);

      await db.query(
        `UPDATE Persona SET ${setClause} WHERE idPersona = ?`,
        values
      );
    }
  }

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
