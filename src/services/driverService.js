const db = require("../config/db");

const normalizarFecha = (fecha) => {
  if (fecha instanceof Date) {
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  }

  // Si viene como YYYY-MM-DD
  if (typeof fecha === "string" && fecha.includes("-")) {
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return f;
  }

  // Si viene como DD/MM/YYYY
  if (typeof fecha === "string" && fecha.includes("/")) {
    const [d, m, y] = fecha.split("/");
    return new Date(y, m - 1, d);
  }

  return null;
};

// --- Función para verificar la documentación de un chofer ---
const verificarDocumentacion = async (idChofer) => {

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Consultar todos los documentos del chofer
  const [documentos] = await db.query(
    `SELECT nombre, fechaVencimiento 
    FROM Documentacion 
    WHERE idChofer = ? 
    ORDER BY fechaVencimiento DESC`,
    [idChofer]
  );

    // Último carnet
  const ultimoCarnet = documentos.find(d =>
    d.nombre.toLowerCase().includes("carnet")
  );
  // Último apto físico
  const ultimoApto = documentos.find(d =>
    d.nombre.toLowerCase().includes("apto fisico")
  );

  const motivos = [];
  


 // Carnet
if (!ultimoCarnet) {
  motivos.push("Falta carnet");
} else {
  const vencCarnet = normalizarFecha(ultimoCarnet.fechaVencimiento);
  if (!vencCarnet || vencCarnet < hoy) {
    motivos.push("Carnet vencido");
  }
}

// Apto físico
if (!ultimoApto) {
  motivos.push("Falta apto físico");
} else {
  const vencApto = normalizarFecha(ultimoApto.fechaVencimiento);
  if (!vencApto || vencApto < hoy) {
    motivos.push("Apto físico vencido");
  }
}

if (motivos.length > 0) {
  return { cumpleRequisitos: false, motivos };
}


  return {
    cumpleRequisitos: true,
    motivos: ["Documentación completa y vigente"],
  };
};

const verificarViajeActivo = async (idChofer) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [viajes] = await db.query(
    `
    SELECT idViaje, fechaInicio, fechaFin
    FROM Viaje
    WHERE idChofer = ?
    `,
    [idChofer]
  );

  if (viajes.length === 0) {
    return { activo: false };
  }

  const viajeActivo = viajes.some((v) => {
    const inicio = normalizarFecha(v.fechaInicio);
    const fin = normalizarFecha(v.fechaFin);
    return inicio <= hoy && fin >= hoy;
  });

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
    "INSERT INTO Chofer (dni, estadoDisponibilidad, idPersona) VALUES (?, 'Inhabilitado', ?)", //chequear valor estadoDisponibilidad, posible accion innecesaria.
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

// --- Dar de baja un chofer ---
const bajaChofer = async (idChofer, accion) => {
  const { activo: estaEnViaje } = await verificarViajeActivo(idChofer);
  console.log(estaEnViaje);

  //si el chofer esta en viaje no permite eliminarlo
  if (estaEnViaje) {
    throw new Error("El chofer se encuentra en viaje y no puede eliminarse");
  }

  /* Buscar si tiene un vehículo asignado
  const [[relacion]] = await db.query(
    `SELECT idVehiculo FROM ChoferXVehiculo WHERE idChofer = ?`,
    [idChofer]
  );
//al final no se le asigna el vehiculo, borrar esta funcionalidad :
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
  }*/
  // Inhabilitar chofer
  if (!["baja", "reactivar"].includes(accion)) {
        throw new Error("Acción invalida, ingrese 'baja' o 'reactivar' ");
  }

  if(accion == "baja") {
  await db.query(
    "UPDATE Chofer SET activo = 0 WHERE idChofer = ?",
    [idChofer]
  );
  } else if (accion == "reactivar") {
  await db.query(
    "UPDATE Chofer SET activo = 1 WHERE idChofer = ?",
    [idChofer]
  );
} 
return await obtenerPorId(idChofer);

};

// --- Obtener todos los choferes ---
const obtenerChoferes = async () => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni, c.activo, c.idPersona,
       p.nombre AS personaNombre,
       p.apellido AS personaApellido,
       p.cuit AS personaCuit,
       p.telefono AS personaTelefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
  `);

  const mapped = rows.map((r) => ({
    idChofer: r.idChofer,
    dni: r.dni,
    activo: r.activo,
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
    SELECT c.idChofer, c.dni, c.activo, c.idPersona,
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
    activo: r.activo,
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
// ⚠️ estadoDisponibilidad NO se obtiene de BD
// Se calcula siempre dinámicamente

};

/*const obtenerChoferesCompleto = async () => {
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

const calcularEstadoChofer = async (idChofer) => {

  // si NO está de baja, lógica normal
  const docStatus = await verificarDocumentacion(idChofer);
  const viajeStatus = await verificarViajeActivo(idChofer);

  let estado;
  const motivos = [];

  
  
  if (viajeStatus.activo) {
    estado = "OCUPADO";
    motivos.push(...viajeStatus.motivos);
  } else if (docStatus.cumpleRequisitos) {
    estado = "HABILITADO";
    motivos.push(...docStatus.motivos);
  } else {
    estado = "INHABILITADO";
    motivos.push(...docStatus.motivos);
  }

  return {
    estadoDisponibilidad: estado,
    motivos,
  };
};

// --- Consultar disponibilidad ---
const consultarDisponibilidad = async (estadoFiltro) => { //aca no se le pasa un estado

  const choferes = await obtenerChoferes();
  const resultado = [];

  for (const chofer of choferes) {
    const { estadoDisponibilidad, motivos } =
      await calcularEstadoChofer(chofer.idChofer);

    // Si hay filtro y no coincide → salteo
    if (
      estadoFiltro &&
      estadoDisponibilidad.toLowerCase() !== estadoFiltro.toLowerCase()
    ) {
      continue;
    }

    resultado.push({
      ...chofer,
      estadoDisponibilidad,
      motivos,
    });
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
  bajaChofer,
  obtenerChoferes,
  obtenerPorId,
  calcularEstadoChofer,
  obtenerChoferesFiltrados,
  verificarDocumentacion,
  consultarHistorial,
  consultarDisponibilidad,
};