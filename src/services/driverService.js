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

    // 🆕 NO TIENE NINGÚN DOCUMENTO
  if (documentos.length === 0) {
    return {
      estado: "PREHABILITADO",
      motivos: ["Chofer sin documentación cargada"],
    };
  }

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
    return {
      estado: "INHABILITADO",
      motivos,
    };
  }

  return {
    estado: "HABILITADO",
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
    return { enViaje: false };
  }

  const viajeActivo = viajes.some((v) => {
    const inicio = normalizarFecha(v.fechaInicio);
    const fin = normalizarFecha(v.fechaFin);
    return inicio <= hoy && fin >= hoy;
  });

  return {
    enViaje: viajeActivo,
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
    "INSERT INTO Chofer (dni, idPersona) VALUES (?, ?)",
    [dni, idPersonaFinal]
  );

  const idChofer = result.insertId;

  // Return enriched chofer object
  return await obtenerPorId(idChofer);
};

// --- Solo se permite modificar choferes activos (activo = 1) ---
const modificarChofer = async (idChofer, data) => {
  const {
    dni,
    idPersona,
    nombre,
    apellido,
    cuit,
    telefono,
    activo,
  } = data;

  //Verifico que el chofer exista y esté activo
  const [choferExistente] = await db.query(
    "SELECT * FROM Chofer WHERE activo = 1 AND idChofer = ?",
    [idChofer]
  );

  if (choferExistente.length === 0) {
    throw new Error("El chofer no existe o está dado de baja");
  }

  // No se permite modificar el idPersona para no romper la relacion
  if (idPersona !== undefined ) {
    throw new Error("No está permitido cambiar la persona asociada al chofer");
  }
  //No se permite modificar el campo activo que referencia a la baja del chofer
  if (activo !== undefined ) {
    throw new Error("No está permitido modificar el campo activo");
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
  return await obtenerPorId(idChofer); // ojo aca puede no ser necesaria la funcion ya que trae el estadoDisponibilidad calculado dinamicamente.
};

// --- Dar de baja un chofer ---
const bajaChofer = async (idChofer, accion) => {
  const { enViaje: estaEnViaje } = await verificarViajeActivo(idChofer);
  //console.log(estaEnViaje);

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
  // Inactivar chofer
  if (!["baja", "reactivar"].includes(accion)) {
        throw new Error("Acción invalida, ingrese 'baja' o 'reactivar'");
  }

  if(accion === "baja") {
  await db.query(
    "UPDATE Chofer SET activo = 0 WHERE idChofer = ?",
    [idChofer]
  );
  } else if (accion === "reactivar") {
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
    SELECT c.idChofer, c.dni, c.activo, c.activo, c.idPersona,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE c.idChofer = ?
  `,
    [idChofer]
  );

  const base = {
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
      
      : null
  }

  if (!r) {
    throw new Error("Chofer no encontrado");
  }

  // 🔴 Caso DE_BAJA
  if (r.activo === 0) {
    return {
      ...base,
      estadoDisponibilidad: "DE_BAJA",
      motivos: ["Chofer dado de baja"],
    };
  }

  // 🟢 Caso activo → calcular estado normal
  const estado = await calcularEstadoChofer(r.idChofer);

  return {
    ...base,
    estadoDisponibilidad: estado.estadoDisponibilidad,
    motivos: estado.motivos,
  };

// ⚠️ estadoDisponibilidad NO se obtiene de BD
// Se calcula siempre dinámicamente

};

/*const obtenerChoferesCompleto = async () => { //no se utiliza
  const [rows] = await db.query(`
    SELECT DISTINCT
      c.idChofer,
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
    SELECT c.idChofer, c.dni,
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
    SELECT c.idChofer, c.dni,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE p.apellido COLLATE utf8mb4_general_ci = ?
  `, [apellido]);
  return rows;
};

// --- Obtener un chofer por DNI ---
const obtenerPorDni = async (dni) => {
  const [rows] = await db.query(`
    SELECT c.idChofer, c.dni,
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
    SELECT c.idChofer, c.dni, c.idPersona,
           p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Chofer c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE
      LOWER(CONVERT(p.nombre USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(p.apellido USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      ${esNumero ? "OR c.dni = ?" : ""}
  `,
    esNumero ? [valor, valor, valor, valor] : [valor, valor, valor]
  );
  const mapped = rows.map((r) => ({
    idChofer: r.idChofer,
    dni: r.dni,
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

/*// --- Consultar historial de viajes ---
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
};*/ //no se usa pero funcionaba para ChoferXVehiculo

const calcularEstadoChofer = async (idChofer) => {

  /*// Traigo documentos directamente
  const [documentos] = await db.query(
    `SELECT nombre, fechaVencimiento 
     FROM Documentacion 
     WHERE idChofer = ?`,
    [idChofer]
  );

  // 🔵 Si no tiene NINGÚN documento → PREHABILITADO
  if (documentos.length === 0) {
    return {
      estadoDisponibilidad: "PREHABILITADO",
      motivos: ["Chofer sin documentación cargada"],
    };
  }

  // Si tiene documentos → usamos validación normal
*/
  const docStatus = await verificarDocumentacion(idChofer);
  const viajeStatus = await verificarViajeActivo(idChofer);

  //let estado;
  //const motivos = [];
  
  
  // 🚛 Prioridad máxima
  if (viajeStatus.enViaje) {
    return {
      estadoDisponibilidad: "OCUPADO",
      motivos: viajeStatus.motivos,
    };
  }

  // 🔄 Si no está en viaje → usar estado documental
  return {
    estadoDisponibilidad: docStatus.estado,
    motivos: docStatus.motivos,
  };
};

// --- Consultar disponibilidad ---
const consultarDisponibilidad = async (estadoFiltro) => { //aca no se le pasa un estado

  const choferes = await obtenerChoferes();
  const resultado = [];
  
  for (const chofer of choferes) {

  let estado;
  let motivos;

  if (chofer.activo === 0) {
    estado = "DE_BAJA";
    motivos = ["Chofer dado de baja"];
  } else {
    const calculado = await calcularEstadoChofer(chofer.idChofer);
    estado = calculado.estadoDisponibilidad;
    motivos = calculado.motivos;
  }


    // Si hay filtro y no coincide → salteo
    if (
      estadoFiltro &&
      estado.toLowerCase() !== estadoFiltro.toLowerCase()
    ) continue;
    

    resultado.push({
      ...chofer,
      estadoDisponibilidad: estado,
      motivos,
    });
  }

  return resultado;
}

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
  //consultarHistorial,
  consultarDisponibilidad,
};