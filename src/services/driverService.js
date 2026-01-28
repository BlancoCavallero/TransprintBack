const db = require("../config/db");

// --- Función para verificar la documentación de un chofer ---
const verificarDocumentacion = async (idChofer) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Consultar todos los documentos del chofer
  const [documentos] = await db.query(
    "SELECT nombre, fechaVencimiento FROM Documentacion WHERE idChofer = ?",
    [idChofer]
  );

  if (!documentos.length) {
    return {
      cumpleRequisitos: false,
      motivos: ["No tiene documentación cargada"],
    };
  }

  // Filtrar todos los carnets y exámenes
  const carnets = documentos.filter((d) =>
    d.nombre.toLowerCase().includes("carnet")
  );
  const examenes = documentos.filter((d) =>
    d.nombre.toLowerCase().includes("examen")
  );

  const motivos = []; //no iria mas arriba en la linea 13?
  if (carnets.length === 0) motivos.push("Falta carnet");
  if (examenes.length === 0) motivos.push("Falta examen médico");

  if (motivos.length > 0) {
    return { cumpleRequisitos: false, motivos };
  }

  // Ver si AL MENOS UNO de cada tipo está vigente
  const carnetVigente = carnets.some(
    (c) => new Date(c.fechaVencimiento) >= hoy
  );
  const examenVigente = examenes.some(
    (e) => new Date(e.fechaVencimiento) >= hoy
  );

  if (!carnetVigente) motivos.push("Carnet vencido");
  if (!examenVigente) motivos.push("Examen médico vencido");

  if (motivos.length > 0) {
    return { cumpleRequisitos: false, motivos };
  }

  return {
    cumpleRequisitos: true,
    motivos: ["Documentación completa y vigente"],
  };
};

const verificarViajeActivo = async (idChofer) => {
  const [viajes] = await db.query(
    `
  SELECT idViaje, estado
  FROM Viaje
  WHERE idChofer = ?
`,
    [idChofer]
  );

  // Si no tiene viajes → NO está ocupado
  if (viajes.length === 0) {
    return { activo: false };
  }

  // Buscar si alguno está en estado "activo"
  const viajeActivo = viajes.some(
    (v) => v.estado && v.estado.toLowerCase() === "activo"
  );

  //

  return {
    activo: viajeActivo,
    motivos: viajeActivo ? ["El chofer está en viaje"] : [],
  };
};

// --- Registrar chofer ---
const registrarChofer = async (data) => {
  const { dni, idPersona, nombre, apellido, cuit, telefono } = data;

  //verifico que no se repita el dni
  const [existeDni] = await db.query("SELECT * FROM Chofer WHERE dni = ?", [
    dni,
  ]);
  if (existeDni.length > 0) {
    throw new Error("Ya existe un chofer registrado con ese dni");
  }

  let idPersonaFinal = idPersona;

  // OPCIÓN 1: Si se envía idPersona, usar ese
  if (idPersona) {
    //verifico que el idPersona no esté usado en otro chofer
    const [existe] = await db.query(
      "SELECT * FROM Chofer WHERE idPersona = ?",
      [idPersona]
    );
    if (existe.length > 0) {
      throw new Error("Ya existe un chofer registrado con ese idPersona");
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

  const [result] = await db.query(
    "INSERT INTO Chofer (dni, estadoDisponibilidad, idPersona) VALUES (?, 'Inhabilitado', ?)",
    [dni, idPersonaFinal]
  );

  const idChofer = result.insertId;

  /*// Verificar documentación real del chofer
  const estadoDoc = await verificarDocumentacion(data.idChofer);
  const nuevoEstado = estadoDoc ? "Libre" : "Inhabilitado";

  // actualizo su disponibilidad real
  await db.query(
    "UPDATE Chofer SET estadoDisponibilidad = ? WHERE idChofer = ?",
    [nuevoEstado, idChofer]
  );*/

  // Return enriched chofer object
  return await obtenerPorId(idChofer);
};

// --- Modificar chofer ---
const modificarChofer = async (idChofer, data) => {
  const {
    dni,
    idPersona,
    nombre,
    apellido,
    cuit,
    telefono,
    estadoDisponibilidad,
  } = data;

  //Verifico que el chofer exista
  const [choferExistente] = await db.query(
    "SELECT * FROM Chofer WHERE idChofer = ?",
    [idChofer]
  );
  if (choferExistente.length === 0) {
    throw new Error("El chofer no existe");
  }

  // Validar DNI si se proporciona
  if (dni) {
    const [existeDni] = await db.query(
      "SELECT * FROM Chofer WHERE dni = ? AND idChofer != ?",
      [dni, idChofer]
    );
    if (existeDni.length > 0) {
      throw new Error("Ya existe un chofer registrado con ese DNI");
    }
  }

  // Actualizar datos del Chofer
  const datosChoferActualizar = {};
  if (dni !== undefined) datosChoferActualizar.dni = dni;
  if (estadoDisponibilidad !== undefined)
    datosChoferActualizar.estadoDisponibilidad = estadoDisponibilidad;

  if (Object.keys(datosChoferActualizar).length > 0) {
    const setClause = Object.keys(datosChoferActualizar)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(datosChoferActualizar);
    values.push(idChofer);

    await db.query(`UPDATE Chofer SET ${setClause} WHERE idChofer = ?`, values);
  }

  // Actualizar datos de la Persona si se proporcionan
  if (nombre || apellido || cuit || telefono) {
    // Obtener idPersona del chofer
    const [chofer] = await db.query(
      "SELECT idPersona FROM Chofer WHERE idChofer = ?",
      [idChofer]
    );
    const idPersonaActual = chofer[0].idPersona;

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

  // return enriched chofer
  return await obtenerPorId(idChofer);
};

// --- Eliminar chofer ---
const eliminarChofer = async (idChofer) => {
  const { activo: estaEnViaje } = await verificarViajeActivo(idChofer);
  console.log(estaEnViaje);

  //si el chofer esta en viaje no permite eliminarlo
  if (estaEnViaje) {
    throw new Error("El chofer se encuentra en viaje y no puede eliminarse");
  }

  // Buscar si tiene un vehículo asignado
  const [[relacion]] = await db.query(
    `SELECT idVehiculo FROM ChoferXVehiculo WHERE idChofer = ?`,
    [idChofer]
  );

  if (relacion) {
    // Liberar el vehículo
    await db.query(
      "UPDATE Vehiculo SET estado = 'activo' WHERE idVehiculo = ?",
      [relacion.idVehiculo]
    );

    // Eliminar relación chofer-vehículo
    await db.query("DELETE FROM ChoferXVehiculo WHERE idChofer = ?", [
      idChofer,
    ]);
  }
  // Inhabilitar chofer
  await db.query(
    "UPDATE Chofer SET estadoDisponibilidad = 'Inhabilitado' WHERE idChofer = ?", // es incoherente ya que si lo dejo como inhabilitado, cuando consulto su estadoDisponibilidad se calcula devuelta y me traeria la respuesta desde esa funcion
    [idChofer]
  );
};

// --- Obtener todos los choferes ---
const obtenerChoferes = async () => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad, c.idPersona,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
  `);

  const mapped = rows.map((r) => ({
    idChofer: r.idChofer,
    dni: r.dni,
    estadoDisponibilidad: r.estadoDisponibilidad,
    idPersona: r.idPersona,
    persona: r.idPersona
      ? {
          idPersona: r.idPersona,
          nombre: r.personaNombre,
          apellido: r.personaApellido,
          cuit: r.personaCuit,
          telefono: r.personaTelefono,
        }
      : null,
  }));

  return mapped;
};

// --- Obtener un chofer ID---
const obtenerPorId = async (idChofer) => {
  const [[r]] = await db.query(
    `
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad, c.idPersona,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE c.idChofer = ?
  `,
    [idChofer]
  );
  if (!r) return null;
  return {
    idChofer: r.idChofer,
    dni: r.dni,
    estadoDisponibilidad: r.estadoDisponibilidad,
    idPersona: r.idPersona,
    persona: r.idPersona
      ? {
          idPersona: r.idPersona,
          nombre: r.personaNombre,
          apellido: r.personaApellido,
          cuit: r.personaCuit,
          telefono: r.personaTelefono,
        }
      : null,
  };
};

const obtenerChoferesCompleto = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT
      c.idChofer,
      c.estadoDisponibilidad,
      p.idPersona,
      p.nombre,
      p.apellido,
      p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    LEFT JOIN Documentacion d ON c.idChofer = d.idChofer
  `);

  return rows;
};

/*
// --- Obtener un chofer por nombre---
const obtenerPorNombre = async (nombre) => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE p.nombre COLLATE utf8mb4_general_ci = ?
  `, [nombre]);
  return rows;
};
// --- Obtener un chofer por apellido---
const obtenerPorApellido = async (apellido) => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE p.apellido COLLATE utf8mb4_general_ci = ?
  `, [apellido]);
  return rows;
};
// --- Obtener un chofer por estado de disponibilidad---
const obtenerPorEstado = async (estado) => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE LOWER(c.estadoDisponibilidad) = LOWER(?)
  `, [estado]);
  return rows;
};
// --- Obtener un chofer por DNI ---
const obtenerPorDni = async (dni) => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE c.dni = ?
  `, [dni]);
  return rows;
};
*/

// --- Obtener choferes por nombre, apellido, DNI ---
const obtenerChoferesFiltrados = async (valor) => {
  // Verificamos si el valor es un número para buscar por DNI
  const esNumero = /^\d+$/.test(valor);

  const [rows] = await db.query(
    `
    SELECT c.idChofer, c.dni, c.estadoDisponibilidad, c.idPersona,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE
      LOWER(CONVERT(p.nombre USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(p.apellido USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(c.estadoDisponibilidad USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      ${esNumero ? "OR c.dni = ?" : ""}
  `,
    esNumero ? [valor, valor, valor, valor] : [valor, valor, valor]
  );
  const mapped = rows.map((r) => ({
    idChofer: r.idChofer,
    dni: r.dni,
    estadoDisponibilidad: r.estadoDisponibilidad,
    idPersona: r.idPersona,
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

// --- Consultar historial de viajes ---
const consultarHistorial = async (idChofer, { desde, hasta, estado }) => {
  let query = `
    SELECT 
    v.fecha,
    lo.nombre AS origen,
    ld.nombre AS destino,
    v.estado,
    v.gastos
    FROM Viaje v
    INNER JOIN ChoferXVehiculo cv ON v.idChoferVehiculo = cv.idChoferVehiculo
    INNER JOIN Localidad lo ON v.idLocalidadOrigen = lo.idLocalidad
    INNER JOIN Localidad ld ON v.idLocalidadDestino = ld.idLocalidad
    WHERE cv.idChofer = ?`;
  const params = [idChofer];

  if (desde) {
    query += " AND fecha >= ?";
    params.push(desde);
  }
  if (hasta) {
    query += " AND fecha <= ?";
    params.push(hasta);
  }
  if (estado) {
    query += " AND estado = ?";
    params.push(estado);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

// --- Consultar disponibilidad ---
const consultarDisponibilidad = async (estado) => {
  const choferes = await obtenerChoferesCompleto();
  const resultado = [];

  for (const chofer of choferes) {
    const docStatus = await verificarDocumentacion(chofer.idChofer);
    const viajeStatus = await verificarViajeActivo(chofer.idChofer);

    let estadoActualizado;

    if (viajeStatus.activo) {
      estadoActualizado = "Ocupado";
    } else if (docStatus.cumpleRequisitos) {
      estadoActualizado = "Libre";
    } else {
      estadoActualizado = "Inhabilitado";
    }

    // Actualizar en base de datos
    await db.query(
      "UPDATE Chofer SET estadoDisponibilidad = ? WHERE idChofer = ?",
      [estadoActualizado, chofer.idChofer]
    );

    // Filtrar por estado pedido
    if (estadoActualizado.toLowerCase() === estado.toLowerCase()) {
      resultado.push({
        ...chofer,
        estadoDisponibilidad: estadoActualizado,
        motivos: [...(docStatus.motivos || []), ...(viajeStatus.motivos || [])],
      });
    }
  }
  return resultado;
};

// --- Asignar vehiculo a chofer (DEPRECADO - Ya no se usa) ---
// Esta función ya no es necesaria ya que los viajes manejan la asignación temporal
// const asignarVehiculo = async (idChofer, idVehiculo) => {
//   // Lógica eliminada
// };

module.exports = {
  registrarChofer,
  modificarChofer,
  eliminarChofer,
  obtenerChoferes,
  obtenerPorId,

  obtenerChoferesFiltrados,
  verificarDocumentacion,
  consultarHistorial,
  consultarDisponibilidad,
};
