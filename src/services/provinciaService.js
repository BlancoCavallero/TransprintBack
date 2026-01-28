const axios = require("axios");
const db = require("../config/db");

const GEORREF_BASE = "https://apis.datos.gob.ar/georef/api";

const listarProvincias = async (filtro = null) => {
  let query = `SELECT idProvincia, nombre FROM Provincia WHERE 1=1`;
  const params = [];
  if (filtro) {
    query += " AND nombre LIKE ?";
    params.push(`%${filtro}%`);
  }
  const [rows] = await db.query(query, params);
  return rows;
};

const crearProvinciaPorNombre = async (nombre) => {
  if (!nombre) {
    const err = new Error("El nombre de la provincia es obligatorio");
    err.status = 400;
    throw err;
  }

  const provName = nombre.trim();

  // Verificar si ya existe
  let [rows] = await db.query(
    "SELECT idProvincia, nombre FROM Provincia WHERE nombre = ?",
    [provName]
  );
  if (rows.length > 0) {
    return {
      idProvincia: rows[0].idProvincia,
      nombre: rows[0].nombre,
      fuente: "db",
    };
  }

  // Consultar API Georef
  const { data } = await axios.get(
    `${GEORREF_BASE}/provincias?nombre=${encodeURIComponent(provName)}`
  );
  const provApi = data.provincias && data.provincias[0];
  if (!provApi) {
    const err = new Error(
      `Provincia '${provName}' no encontrada en la API Georef`
    );
    err.status = 404;
    throw err;
  }

  const [result] = await db.query("INSERT INTO Provincia (nombre) VALUES (?)", [
    provApi.nombre,
  ]);
  return {
    idProvincia: result.insertId,
    nombre: provApi.nombre,
    fuente: "georef",
  };
};

module.exports = { listarProvincias, crearProvinciaPorNombre };
