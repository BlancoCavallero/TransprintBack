const axios = require("axios");
const db = require("../config/db");

const GEORREF_BASE = "https://apis.datos.gob.ar/georef/api";

// ✅ Obtiene o crea provincia y localidad bajo demanda
const obtenerOCrearLocalidad = async (nombreProvincia, nombreLocalidad) => {
  if (!nombreProvincia || !nombreLocalidad) {
    const error = new Error("Provincia y localidad son obligatorias");
    error.status = 400;
    throw error;
  }

  const provincia = nombreProvincia.trim();
  const localidad = nombreLocalidad.trim();

  // 1️⃣ Buscar provincia en DB
  let [rows] = await db.query("SELECT idProvincia FROM Provincia WHERE nombre = ?", [provincia]);
  let idProvincia;
  if (rows.length > 0) {
    idProvincia = rows[0].idProvincia;
  } else {
    // Buscar en API Georef
    const { data: dataProv } = await axios.get(`${GEORREF_BASE}/provincias?nombre=${encodeURIComponent(provincia)}`);
    const provinciaApi = dataProv.provincias[0];
    if (!provinciaApi) throw new Error(`Provincia '${provincia}' no encontrada en la API`);

    // Insertar en DB
    const [resProv] = await db.query("INSERT INTO Provincia (nombre) VALUES (?)", [provinciaApi.nombre]);
    idProvincia = resProv.insertId;
  }

  // 2️⃣ Buscar localidad en DB
  [rows] = await db.query("SELECT idLocalidad FROM Localidad WHERE nombre = ? AND idProvincia = ?", [localidad, idProvincia]);
  if (rows.length > 0) {
    return { idLocalidad: rows[0].idLocalidad, idProvincia, fuente: "db" };
  }

  // 3️⃣ Buscar localidad en API Georef
  const { data: dataLoc } = await axios.get(
    `${GEORREF_BASE}/localidades?nombre=${encodeURIComponent(localidad)}&provincia=${encodeURIComponent(provincia)}&max=1`
  );

  const locApi = dataLoc.localidades[0];

  // 4️⃣ Si la API no la encuentra, crear registro manual
  if (!locApi) {
    const [resLoc] = await db.query(
      "INSERT INTO Localidad (nombre, idProvincia) VALUES (?, ?)",
      [localidad, idProvincia]
    );
    return { idLocalidad: resLoc.insertId, idProvincia, fuente: "manual" };
  }

  // 5️⃣ Insertar localidad obtenida desde API
  const [resLoc] = await db.query(
    "INSERT INTO Localidad (nombre, codPostal, idProvincia) VALUES (?, ?, ?)",
    [locApi.nombre, locApi.codigo_postal || null, idProvincia]
  );

  return { idLocalidad: resLoc.insertId, idProvincia, fuente: "georef" };
};

// ✅ Buscar localidades ya guardadas (filtro opcional)
const obtenerLocalidades = async (filtros = {}) => {
  let query = `
    SELECT l.idLocalidad, l.nombre AS localidad, l.codPostal, 
           p.nombre AS provincia
    FROM Localidad l
    JOIN Provincia p ON p.idProvincia = l.idProvincia
    WHERE 1=1
  `;
  const params = [];

  if (filtros.provincia) {
    query += " AND p.nombre LIKE ?";
    params.push(`%${filtros.provincia}%`);
  }

  if (filtros.nombre) {
    query += " AND l.nombre LIKE ?";
    params.push(`%${filtros.nombre}%`);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

module.exports = { obtenerOCrearLocalidad, obtenerLocalidades };
