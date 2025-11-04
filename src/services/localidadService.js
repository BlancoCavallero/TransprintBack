const axios = require("axios");
const db = require("../config/db");

const GEORREF_BASE = "https://apis.datos.gob.ar/georef/api";

// ✅ Crear localidad solo si existe en la API Georef
const obtenerOCrearLocalidad = async (nombreProvincia, nombreLocalidad, codPostal = null) => {
  if (!nombreProvincia || !nombreLocalidad) {
    const error = new Error("Provincia y localidad son obligatorias");
    error.status = 400;
    throw error;
  }

  const provincia = nombreProvincia.trim();
  const localidad = nombreLocalidad.trim();

  // 1️⃣ Buscar provincia en DB o crearla desde la API
  let [rows] = await db.query("SELECT idProvincia FROM Provincia WHERE nombre = ?", [provincia]);
  let idProvincia;

  if (rows.length > 0) {
    idProvincia = rows[0].idProvincia;
  } else {
    const { data: dataProv } = await axios.get(
      `${GEORREF_BASE}/provincias?nombre=${encodeURIComponent(provincia)}`
    );
    const provinciaApi = dataProv.provincias[0];
    if (!provinciaApi) {
      const error = new Error(`Provincia '${provincia}' no encontrada en la API Georef`);
      error.status = 404;
      throw error;
    }
    const [resProv] = await db.query("INSERT INTO Provincia (nombre) VALUES (?)", [provinciaApi.nombre]);
    idProvincia = resProv.insertId;
  }

  // 2️⃣ Buscar localidad en DB
  [rows] = await db.query(
    "SELECT idLocalidad, codPostal FROM Localidad WHERE nombre = ? AND idProvincia = ?",
    [localidad, idProvincia]
  );

  if (rows.length > 0) {
    return { idLocalidad: rows[0].idLocalidad, idProvincia, fuente: "db" };
  }

  // 3️⃣ Buscar localidad en API Georef
  const { data: dataLoc } = await axios.get(
    `${GEORREF_BASE}/localidades?nombre=${encodeURIComponent(localidad)}&provincia=${encodeURIComponent(provincia)}&max=1`
  );

  const locApi = dataLoc.localidades[0];
  if (!locApi) {
    const error = new Error(
      `La localidad '${localidad}' no existe en la API Georef y no puede cargarse manualmente`
    );
    error.status = 400;
    throw error;
  }

  // 4️⃣ Insertar localidad validada en la DB
  const [resLoc] = await db.query(
    "INSERT INTO Localidad (nombre, codPostal, idProvincia) VALUES (?, ?, ?)",
    [locApi.nombre, codPostal || null, idProvincia]
  );

  return { idLocalidad: resLoc.insertId, idProvincia, fuente: "georef" };
};

// ✅ Actualizar código postal
const actualizarCodigoPostal = async (idLocalidad, nuevoCodigo) => {
  if (!idLocalidad || nuevoCodigo == null) {
    const error = new Error("ID de localidad y nuevo código postal son obligatorios");
    error.status = 400;
    throw error;
  }

  const [rows] = await db.query("SELECT idLocalidad FROM Localidad WHERE idLocalidad = ?", [idLocalidad]);
  if (rows.length === 0) {
    const error = new Error("La localidad especificada no existe");
    error.status = 404;
    throw error;
  }

  await db.query("UPDATE Localidad SET codPostal = ? WHERE idLocalidad = ?", [nuevoCodigo, idLocalidad]);
  return { idLocalidad, codPostal: nuevoCodigo, mensaje: "Código postal actualizado correctamente" };
};

const obtenerLocalidades = async (filtros = {}) => {
  let query = `
    SELECT l.idLocalidad, l.nombre AS localidad, l.codPostal, 
           p.nombre AS provincia
    FROM Localidad l
    JOIN Provincia p ON p.idProvincia = l.idProvincia
    WHERE 1=1
  `;
  const params = [];

  // 🔍 Filtrar por provincia
  if (filtros.provincia) {
    query += " AND p.nombre LIKE ?";
    params.push(`%${filtros.provincia}%`);
  }

  // 🔍 Filtrar por nombre o localidad (ambos funcionan igual)
  if (filtros.nombre || filtros.localidad) {
    const valor = filtros.nombre || filtros.localidad;
    query += " AND l.nombre LIKE ?";
    params.push(`%${valor}%`);
  }

  // 🔍 Filtrar por código postal exacto
  if (filtros.codPostal) {
    query += " AND l.codPostal = ?";
    params.push(filtros.codPostal);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

module.exports = { obtenerOCrearLocalidad, obtenerLocalidades, actualizarCodigoPostal };
