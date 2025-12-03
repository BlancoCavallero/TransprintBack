const {
  listarProvincias,
  crearProvinciaPorNombre,
} = require("../services/provinciaService");
const { successResponse } = require("../utils/response");

const getProvincias = async (req, res, next) => {
  try {
    const { search } = req.query;
    const rows = await listarProvincias(search);
    successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const postProvincia = async (req, res, next) => {
  try {
    const { nombre } = req.body || {};
    const created = await crearProvinciaPorNombre(nombre);
    successResponse(res, created, "Provincia creada");
  } catch (error) {
    next(error);
  }
};

module.exports = { getProvincias, postProvincia };
