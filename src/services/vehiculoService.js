const db = require("../config/db");

const TIPOS_VEHICULO = [
  "LIGERO",
  "MEDIANO",
  "PESADO",
  "TERAPESADO",
];

const normalizarTipoVehiculo = (tipo) =>
  tipo ? tipo.trim().toUpperCase() : null;

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

// --- Función para verificar la documentación de un Vehiculo ---
const verificarDocumentacion = async (idVehiculo) => {

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Consultar todos los documentos del Vehiculo
  const [documentos] = await db.query(
    `SELECT nombre, fechaVencimiento 
    FROM Documentacion 
    WHERE idVehiculo = ? 
    ORDER BY fechaVencimiento DESC`,
    [idVehiculo]
  );

  // Última Vtv
  const ultimaVtv = documentos.find(d =>
    d.nombre.toLowerCase().includes("vtv")
  );
  // Último seguro
  const ultimoSeguro = documentos.find(d =>
    d.nombre.toLowerCase().includes("seguro")
  );

  const motivos = [];

  if (!ultimaVtv) motivos.push("Falta VTV");
  if (!ultimoSeguro) motivos.push("Falta Seguro");

  if (motivos.length > 0) {
    return { cumpleRequisitos: false, motivos };
  }


  //normalizo fechaVencimiento para comparar entre Date's
  const vencVtv = normalizarFecha(ultimaVtv.fechaVencimiento);
  const vencSeguro = normalizarFecha(ultimoSeguro.fechaVencimiento);

  if (!vencVtv || vencVtv < hoy) motivos.push("VTV vencida");
  if (!vencSeguro || vencSeguro < hoy) motivos.push("Seguro vencido");

  if (motivos.length > 0) {
    return { cumpleRequisitos: false, motivos };
  }

  return {
    cumpleRequisitos: true,
    motivos: ["Documentación completa y vigente"],
  };
};

const verificarViajeActivo = async (idVehiculo) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [viajes] = await db.query(
    `
    SELECT fechaInicio, fechaFin
    FROM Viaje
    WHERE idVehiculo = ?
    `,
    [idVehiculo]
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
    motivos: viajeActivo ? ["El vehículo está asignado a un viaje"] : [],
  };
};

const verificarMantenimientoActivo = async (idVehiculo) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [mantenimientos] = await db.query(
    `
    SELECT fechaInicio, fechaFin
    FROM Mantenimiento
    WHERE idVehiculo = ?
    `,
    [idVehiculo]
  );

  
  if (mantenimientos.length === 0) {
    return { activo: false };
  }

  const mantenimientoActivo = mantenimientos.some((v) => {
    const inicio = normalizarFecha(v.fechaInicio);
    const fin = normalizarFecha(v.fechaFin);
    return inicio <= hoy && fin > hoy;
  });

  return {
    activo: mantenimientoActivo,
    motivos: mantenimientoActivo ? ["El vehículo está en mantenimiento"] : [],
  };
};

// no funciona por id?
const obtenerVehiculos = async (filtros = {}) => {
  // Si filtros es un número o string (un ID suelto), lo convertimos en objeto
  if (typeof filtros !== 'object') {
    filtros = { idVehiculo: filtros };
  }

  let query = `
              SELECT 
                idVehiculo, 
                activo,
                anio,
                marca,
                modelo,
                patente,
                tipo
              FROM Vehiculo WHERE 1=1`;
  const params = [];

  if (filtros.idVehiculo) {
    query += " AND idVehiculo = ?";
    params.push(filtros.idVehiculo);
  }
  if (filtros.marca) {
    query += " AND marca LIKE ?";
    params.push(`%${filtros.marca}%`);
  }
  if (filtros.modelo) {
    query += " AND modelo LIKE ?";
    params.push(`%${filtros.modelo}%`);
  }
  if (filtros.patente) {
    query += " AND patente LIKE ?";
    params.push(`%${filtros.patente}%`);
  }
  if (filtros.tipo) {
    query += " AND tipo LIKE ?";
    params.push(`%${filtros.tipo}%`);
  }
  /*if (filtros.estado) {
    query += " AND estado LIKE ?";
    params.push(`%${filtros.estado}%`);
  }*/

  const [rows] = await db.query(query, params);
  return rows;
};

const crear = async (vehiculo) => {
  const { anio, marca, modelo, patente, tipo } = vehiculo;

  if (!patente || !marca || !modelo || !tipo) {
    const error = new Error(
      "Faltan campos obligatorios (patente, marca, modelo, tipo)"
    );
    error.statusCode = 400;
    throw error;
  }

  const tipoNormalizado = normalizarTipoVehiculo(tipo);

  if (!TIPOS_VEHICULO.includes(tipoNormalizado)) {
    const error = new Error(
      `Tipo de vehículo inválido. Valores permitidos: ${TIPOS_VEHICULO.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }

  const [existe] = await db.query(
    "SELECT idVehiculo FROM Vehiculo WHERE patente = ?",
    [patente]
  );

  if (existe.length > 0) {
    const error = new Error("Ya existe un vehículo con esa patente");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await db.query(
    `INSERT INTO Vehiculo 
     (anio, estado, marca, modelo, patente, tipo) 
     VALUES (?, 'Inhabilitado', ?, ?, ?, ?)`,
    [anio, marca, modelo, patente, tipoNormalizado]
  );

  return { idVehiculo: result.insertId, ...vehiculo, tipo: tipoNormalizado };
};


const actualizar = async (id, vehiculo) => {
  const [check] = await db.query(
    "SELECT * FROM Vehiculo WHERE idVehiculo = ?",
    [id]
  );

  if (check.length === 0) {
    const error = new Error("Vehículo no encontrado");
    error.statusCode = 404;
    throw error;
  }

  let tipoFinal = check[0].tipo;

  if (vehiculo.tipo !== undefined) {
    const tipoNormalizado = normalizarTipoVehiculo(vehiculo.tipo);

    if (!TIPOS_VEHICULO.includes(tipoNormalizado)) {
      const error = new Error(
        `Tipo de vehículo inválido. Valores permitidos: ${TIPOS_VEHICULO.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    tipoFinal = tipoNormalizado;
  }

  const { anio, estado, marca, modelo, patente } = vehiculo;

  const [result] = await db.query(
    `UPDATE Vehiculo 
     SET anio = ?, estado = ?, marca = ?, modelo = ?, patente = ?, tipo = ?
     WHERE idVehiculo = ?`,
    [
      anio ?? check[0].anio,
      estado ? estado.toLowerCase() : check[0].estado,
      marca || check[0].marca,
      modelo || check[0].modelo,
      patente || check[0].patente,
      tipoFinal,
      id,
    ]
  );*/
  // Actualizar datos del Vehiculo
  
  const datosVehiculoActualizar = {};
  if (anio !== undefined) datosVehiculoActualizar.anio = anio;
  if (marca !== undefined) datosVehiculoActualizar.marca = marca;
  if (modelo !== undefined) datosVehiculoActualizar.modelo = modelo;
  if (patente !== undefined) datosVehiculoActualizar.patente = patente;
  if (tipo !== undefined) datosVehiculoActualizar.tipo = tipo;
  
  if (Object.keys(datosVehiculoActualizar).length > 0) {
    const setClause = Object.keys(datosVehiculoActualizar)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(datosVehiculoActualizar);
    values.push(id);

    await db.query(`UPDATE Vehiculo SET ${setClause} WHERE idVehiculo = ?`, values);
  }

  /*if (result.affectedRows === 0) {
    const error = new Error("No se pudo actualizar el vehículo");
    error.statusCode = 500;
    throw error;
  }*/

  return { idVehiculo: id, ...vehiculo, tipo: tipoFinal };
};



const eliminarVehiculo = async (id) => {
  const [result] = await db.query("DELETE FROM Vehiculo WHERE idVehiculo = ?", [
    id,
  ]);

  if (result.affectedRows === 0) {
    const error = new Error("Vehículo no encontrado");
    error.status = 404;
    throw error;
  }

  return { message: "Vehículo eliminado correctamente" };
};*/

// --- Dar de baja un Vehiculo ---
const bajaVehiculo = async (idVehiculo, accion) => {
  const { enViaje: estaEnViaje } = await verificarViajeActivo(idVehiculo);
  //console.log(estaEnViaje);

  //si el Vehiculo esta en viaje no permite eliminarlo
  if (estaEnViaje) {
    throw new Error("El Vehiculo se encuentra en viaje y no puede eliminarse");
  }

 
  // Inactivar Vehiculo
  if (!["baja", "reactivar"].includes(accion)) {
        throw new Error("Acción invalida, ingrese 'baja' o 'reactivar'");
  }

  if(accion === "baja") {
  await db.query(
    "UPDATE Vehiculo SET activo = 0 WHERE idVehiculo = ?",
    [idVehiculo]
  );
  } else if (accion === "reactivar") {
  await db.query(
    "UPDATE Vehiculo SET activo = 1 WHERE idVehiculo = ?",
    [idVehiculo]
  );
} 
return await obtenerVehiculos(idVehiculo);

};

const calcularEstadoVehiculo = async (idVehiculo) => {
  const docStatus = await verificarDocumentacion(idVehiculo);
  const viajeStatus = await verificarViajeActivo(idVehiculo);
  const mantenimientoStatus = await verificarMantenimientoActivo(idVehiculo);

  let estado;
  const motivos = [];


  if (mantenimientoStatus.activo) {
    estado = "EN_MANTENIMIENTO";
    motivos.push(...mantenimientoStatus.motivos);

  } else if (viajeStatus.enViaje) {
    estado = "OCUPADO";
    motivos.push(...viajeStatus.motivos);

  } else if (!docStatus.cumpleRequisitos) {
    estado = "INHABILITADO";
    motivos.push(...docStatus.motivos);

  } else {
    estado = "HABILITADO";
    motivos.push(...docStatus.motivos);
  }

  return {
    estadoDisponibilidad: estado,
    motivos,
  };
};


// --- Consultar disponibilidad ---
const consultarDisponibilidad = async (estadoFiltro) => {

  const vehiculos = await obtenerVehiculos();
  const resultado = [];

  for (const vehiculo of vehiculos) {
    let estado;
    let motivos;

    if (vehiculo.activo === 0) {
      estado = "DE_BAJA";
      motivos = ["Vehiculo dado de baja"];
    } else {
      const calculado = await calcularEstadoVehiculo(vehiculo.idVehiculo);
      estado = calculado.estadoDisponibilidad;
      motivos = calculado.motivos;
    }

    // Si hay filtro y no coincide → salteo
    if (
      estadoFiltro &&
      estado.toLowerCase() !== estadoFiltro.toLowerCase()
    ) {
      continue;
    }

    resultado.push({
      ...vehiculo,
      estadoDisponibilidad: estado,
      motivos,
    });
  }

  return resultado;
};

module.exports = {
  obtenerVehiculos,
  crear,
  actualizar,
  //eliminarVehiculo,
  bajaVehiculo,
  consultarDisponibilidad,
  calcularEstadoVehiculo, 
};
