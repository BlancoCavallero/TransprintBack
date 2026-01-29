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
  
console.log("DOCUMENTOS:", documentos);
console.log("ULTIMa Vtv:", ultimaVtv);
console.log("ULTIMO Seguro:", ultimoSeguro);


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
    return { activo: false };
  }

  const viajeActivo = viajes.some((v) => {
    const inicio = normalizarFecha(v.fechaInicio);
    const fin = normalizarFecha(v.fechaFin);
    return inicio <= hoy && fin >= hoy;
  });

  return {
    activo: viajeActivo,
    motivos: viajeActivo ? ["El vehículo está asignado a un viaje"] : [],
  };
};



const obtenerVehiculos = async (filtros = {}) => {
  let query = `
              SELECT 
                idVehiculo, 
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

  if (!patente || !marca || !modelo) {
    const error = new Error(
      "Faltan campos obligatorios (patente, marca, modelo)"
    );
    error.statusCode = 400;
    throw error;
  }

  // Verificar duplicado por patente (si no lo hiciste en el validator)
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
    "INSERT INTO Vehiculo (anio, estado, marca, modelo, patente, tipo) VALUES (?, 'Inhabilitado', ?, ?, ?, ?)",
    [anio, marca, modelo, patente, tipo]
  );
  return { idVehiculo: result.insertId, ...vehiculo };
};

const actualizar = async (id, vehiculo) => {
  // Verificar existencia
  const [check] = await db.query(
    "SELECT * FROM Vehiculo WHERE idVehiculo = ?",
    [id]
  );
  if (check.length === 0) {
    const error = new Error("Vehículo no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const { anio, estado, marca, modelo, patente, tipo } = vehiculo;
  const [result] = await db.query(
    "UPDATE Vehiculo SET anio = ?, estado = ?, marca = ?, modelo = ?, patente = ?, tipo = ? WHERE idVehiculo = ?",
    [
      anio !== undefined ? anio : check[0].anio,
      estado ? estado.toLowerCase() : check[0].estado,
      marca || check[0].marca,
      modelo || check[0].modelo,
      patente || check[0].patente,
      tipo || check[0].tipo,
      id,
    ]
  );

  if (result.affectedRows === 0) {
    const error = new Error("No se pudo actualizar el vehículo");
    error.statusCode = 500;
    throw error;
  }

  return { idVehiculo: id, ...vehiculo };
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
};

const calcularEstadoVehiculo = async (idVehiculo) => {
  const docStatus = await verificarDocumentacion(idVehiculo);
  const viajeStatus = await verificarViajeActivo(idVehiculo);

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

  const vehiculos = await obtenerVehiculos();
  const resultado = [];

  for (const vehiculo of vehiculos) {
    const { estadoDisponibilidad, motivos } =
      await calcularEstadoVehiculo(vehiculo.idVehiculo);

    // Si hay filtro y no coincide → salteo
    if (
      estadoFiltro &&
      estadoDisponibilidad.toLowerCase() !== estadoFiltro.toLowerCase()
    ) {
      continue;
    }

    resultado.push({
      ...vehiculo,
      estadoDisponibilidad,
      motivos,
    });
  }

  return resultado;
};

module.exports = {
  obtenerVehiculos,
  crear,
  actualizar,
  eliminarVehiculo,
  consultarDisponibilidad,
};
