const db = require("../config/db");
const {
  DOCUMENTO_TIPO_ENTIDAD,
} = require("../validators/documentationValidator");

const normalizarFecha = (fecha) => {
  if (!fecha) return null;

  // Si ya es string "YYYY-MM-DD", devolver directo
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }

  // Si viene como Date, convertir manualmente sin usar la zona horaria
  const f = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return f.toISOString().split("T")[0];
};

// Formatea 'YYYY-MM-DD' a 'DD/MM/YYYY' para mostrar en respuestas cortas
const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) return null;
  // Si ya viene en formato DD/MM/YYYY, devolver directo
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaIso)) return fechaIso;
  // Si viene en ISO 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaIso)) {
    const [y, m, d] = fechaIso.split("-");
    return `${d}/${m}/${y}`;
  }
  // Intentar parsear Date
  const dObj = new Date(fechaIso);
  if (!isNaN(dObj)) {
    const dd = String(dObj.getDate()).padStart(2, "0");
    const mm = String(dObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return null;
};

// Determina el tipoEntidad basado en el nombre del documento
const determinarTipoEntidad = (nombre, tipoEntidadProvidado) => {
  // Si viene explícitamente del cliente, usarlo
  if (tipoEntidadProvidado) {
    return tipoEntidadProvidado;
  }

  // Si el nombre está en el mapeo, usar el tipo por defecto
  const nombreUpper = nombre ? nombre.toUpperCase() : "";
  return DOCUMENTO_TIPO_ENTIDAD[nombreUpper] || null;
};

// Obtener todas las documentaciones
const obtenerTodas = async () => {
  const [rows] = await db.query(`
    SELECT d.*,
           v.idVehiculo AS vehiculoId, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.patente AS vehiculoPatente, v.tipo AS vehiculoTipo,
           c.idChofer AS choferId, c.dni AS choferDni,
           p.idPersona AS personaId, p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Documentacion d
    LEFT JOIN Vehiculo v ON d.idVehiculo = v.idVehiculo
    LEFT JOIN Chofer c ON d.idChofer = c.idChofer
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
  `);

  const hoy = normalizarFecha(new Date());
  const mapped = rows.map((doc) => {
    const vencimiento = normalizarFecha(doc.fechaVencimiento);
    const estado = vencimiento < hoy ? "Vencida" : "Vigente";
    return {
      idDocumentacion: doc.idDocumentacion,
      detalle: doc.detalle,
      nombre: doc.nombre,
      tipoEntidad: doc.tipoEntidad,
      renovacion: doc.renovacion,
      fechaVencimiento: formatearFechaCorta(vencimiento),
      estado,
      vehiculo: doc.vehiculoId
        ? {
            idVehiculo: doc.vehiculoId,
            marca: doc.vehiculoMarca,
            modelo: doc.vehiculoModelo,
            patente: doc.vehiculoPatente,
            tipo: doc.vehiculoTipo,
          }
        : null,
      chofer: doc.choferId
        ? {
            idChofer: doc.choferId,
            dni: doc.choferDni,
            persona: doc.personaId
              ? {
                  idPersona: doc.personaId,
                  nombre: doc.personaNombre,
                  apellido: doc.personaApellido,
                  cuit: doc.personaCuit,
                  telefono: doc.personaTelefono,
                }
              : null,
          }
        : null,
    };
  });
  return mapped;
};

// Obtener una documentación por ID
const obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `
    SELECT d.*,
           v.idVehiculo AS vehiculoId, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.patente AS vehiculoPatente, v.tipo AS vehiculoTipo,
           c.idChofer AS choferId, c.dni AS choferDni,
           p.idPersona AS personaId, p.nombre AS personaNombre, p.apellido AS personaApellido, p.cuit AS personaCuit, p.telefono AS personaTelefono
    FROM Documentacion d
    LEFT JOIN Vehiculo v ON d.idVehiculo = v.idVehiculo
    LEFT JOIN Chofer c ON d.idChofer = c.idChofer
    LEFT JOIN Persona p ON c.idPersona = p.idPersona
    WHERE d.idDocumentacion = ?
  `,
    [id]
  );

  const r = rows[0];
  if (!r) return null;
  const hoy = normalizarFecha(new Date());
  const vencimiento = normalizarFecha(r.fechaVencimiento);
  const estado = vencimiento < hoy ? "Vencida" : "Vigente";
  return {
    idDocumentacion: r.idDocumentacion,
    detalle: r.detalle,
    nombre: r.nombre,
    tipoEntidad: r.tipoEntidad,
    renovacion: r.renovacion,
    fechaVencimiento: formatearFechaCorta(vencimiento),
    estado,
    vehiculo: r.vehiculoId
      ? {
          idVehiculo: r.vehiculoId,
          marca: r.vehiculoMarca,
          modelo: r.vehiculoModelo,
          patente: r.vehiculoPatente,
          tipo: r.vehiculoTipo,
        }
      : null,
    chofer: r.choferId
      ? {
          idChofer: r.choferId,
          dni: r.choferDni,
          persona: r.personaId
            ? {
                idPersona: r.personaId,
                nombre: r.personaNombre,
                apellido: r.personaApellido,
                cuit: r.personaCuit,
                telefono: r.personaTelefono,
              }
            : null,
        }
      : null,
  };
};

const obtenerPorDetalle = async (detalle) => {
  const [rows] = await db.query(
    "SELECT * FROM Documentacion WHERE detalle = ?",
    [detalle]
  );
  return rows[0];
};

// Crear nueva documentación
const crear = async (data) => {
  const {
    detalle,
    nombre,
    renovacion,
    fechaVencimiento,
    idVehiculo,
    idChofer,
    tipoEntidad,
  } = data;

  // Determinar tipoEntidad
  let tipoEntidadFinal = determinarTipoEntidad(nombre, tipoEntidad);
  if (!tipoEntidadFinal) {
    throw new Error(
      "No se pudo determinar el tipoEntidad. Proporciónelo explícitamente."
    );
  }

  // Validar que existe el Chofer si tipoEntidad es CHOFER
  if (tipoEntidadFinal === "CHOFER") {
    const [existeChofer] = await db.query(
      "SELECT * FROM Chofer WHERE idChofer = ?",
      [idChofer]
    );
    if (existeChofer.length === 0) {
      throw new Error("El idChofer ingresado no existe");
    }

    // Verificar si ya existe este tipo de documento para este chofer
    const [documentoDuplicado] = await db.query(
      "SELECT * FROM Documentacion WHERE nombre = ? AND idChofer = ?",
      [nombre, idChofer]
    );
    if (documentoDuplicado.length > 0) {
      throw new Error(
        `El chofer ya tiene un documento de tipo "${nombre}" cargado`
      );
    }
  }

  // Validar que existe el Vehículo si tipoEntidad es VEHICULO
  if (tipoEntidadFinal === "VEHICULO") {
    const [existeVehiculo] = await db.query(
      "SELECT * FROM Vehiculo WHERE idVehiculo = ?",
      [idVehiculo]
    );
    if (existeVehiculo.length === 0) {
      throw new Error("El idVehiculo ingresado no existe");
    }

    // Verificar si ya existe este tipo de documento para este vehículo
    const [documentoDuplicado] = await db.query(
      "SELECT * FROM Documentacion WHERE nombre = ? AND idVehiculo = ?",
      [nombre, idVehiculo]
    );
    if (documentoDuplicado.length > 0) {
      throw new Error(
        `El vehículo ya tiene un documento de tipo "${nombre}" cargado`
      );
    }
  }

  const renovacionInt = parseInt(renovacion, 10) || null;
  const idVehiculoInt =
    tipoEntidadFinal === "VEHICULO" ? parseInt(idVehiculo, 10) || null : null;
  const idChoferInt =
    tipoEntidadFinal === "CHOFER" ? parseInt(idChofer, 10) || null : null;

  const fechaNormalizada = normalizarFecha(fechaVencimiento);
  const [result] = await db.query(
    "INSERT INTO Documentacion (detalle, nombre, renovacion, fechaVencimiento, tipoEntidad, idVehiculo, idChofer) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      detalle,
      nombre,
      renovacionInt,
      fechaNormalizada,
      tipoEntidadFinal,
      idVehiculoInt,
      idChoferInt,
    ]
  );

  const id = result.insertId;
  // Devolver el objeto completo con vehiculo y chofer anidados
  return await obtenerPorId(id);
};

// Actualizar documentación
const actualizar = async (id, data) => {
  const {
    detalle,
    nombre,
    renovacion,
    fechaVencimiento,
    idVehiculo,
    idChofer,
    tipoEntidad,
  } = data;

  // Obtener documento actual para valores por defecto
  const existente = await obtenerPorId(id);
  if (!existente) {
    throw new Error("Documentación no encontrada");
  }

  // Usar valores proporcionados o mantener los existentes
  const detalleActual = detalle !== undefined ? detalle : existente.detalle;
  const nombreActual = nombre !== undefined ? nombre : existente.nombre;
  const renovacionActual =
    renovacion !== undefined ? parseInt(renovacion, 10) : existente.renovacion;
  const tipoEntidadActual = tipoEntidad || existente.tipoEntidad;
  const fechaActual = fechaVencimiento
    ? normalizarFecha(fechaVencimiento)
    : existente.fechaVencimiento;

  // Para idChofer e idVehiculo, usar los proporcionados o mantener los existentes
  const idChoferActual =
    idChofer !== undefined
      ? parseInt(idChofer, 10) || null
      : existente.chofer?.idChofer || null;
  const idVehiculoActual =
    idVehiculo !== undefined
      ? parseInt(idVehiculo, 10) || null
      : existente.vehiculo?.idVehiculo || null;

  // Validar que existe el Chofer si se proporciona
  if (idChoferActual && tipoEntidadActual === "CHOFER") {
    const [existeChofer] = await db.query(
      "SELECT * FROM Chofer WHERE idChofer = ?",
      [idChoferActual]
    );
    if (existeChofer.length === 0) {
      throw new Error("El idChofer ingresado no existe");
    }
  }

  // Validar que existe el Vehículo si se proporciona
  if (idVehiculoActual && tipoEntidadActual === "VEHICULO") {
    const [existeVehiculo] = await db.query(
      "SELECT * FROM Vehiculo WHERE idVehiculo = ?",
      [idVehiculoActual]
    );
    if (existeVehiculo.length === 0) {
      throw new Error("El idVehiculo ingresado no existe");
    }
  }

  // Solo actualizar los campos que realmente cambiaron
  const actualizaciones = {};
  if (detalle !== undefined) actualizaciones.detalle = detalleActual;
  if (nombre !== undefined) actualizaciones.nombre = nombreActual;
  if (renovacion !== undefined) actualizaciones.renovacion = renovacionActual;
  if (fechaVencimiento !== undefined)
    actualizaciones.fechaVencimiento = fechaActual;
  if (tipoEntidad !== undefined)
    actualizaciones.tipoEntidad = tipoEntidadActual;
  if (idChofer !== undefined) actualizaciones.idChofer = idChoferActual;
  if (idVehiculo !== undefined) actualizaciones.idVehiculo = idVehiculoActual;

  // Si no hay campos a actualizar, simplemente devolver el documento actual
  if (Object.keys(actualizaciones).length === 0) {
    return await obtenerPorId(id);
  }

  // Construir la query dinámicamente
  const campos = Object.keys(actualizaciones)
    .map((key) => `${key} = ?`)
    .join(", ");
  const valores = Object.values(actualizaciones);
  valores.push(id);

  await db.query(
    `UPDATE Documentacion SET ${campos} WHERE idDocumentacion = ?`,
    valores
  );

  return await obtenerPorId(id);
};

// Eliminar documentación
const eliminar = async (id) => {
  await db.query("DELETE FROM Documentacion WHERE idDocumentacion = ?", [id]);
  return { mensaje: "Documentación eliminada correctamente" };
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorDetalle,
  crear,
  actualizar,
  eliminar,
};
