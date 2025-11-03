const { obtenerOCrearLocalidad, obtenerLocalidades } = require("../services/localidadService");
const { successResponse } = require("../utils/response");

const crearLocalidad = async (req, res, next) => {
  try {
    const { provincia, localidad } = req.body;
    const resultado = await obtenerOCrearLocalidad(provincia, localidad);
    successResponse(res, resultado, "Localidad registrada correctamente");
  } catch (error) {
    next(error);
  }
};

const listarLocalidades = async (req, res, next) => {
  try {
    const localidades = await obtenerLocalidades(req.query);
    successResponse(res, localidades);
  } catch (error) {
    next(error);
  }
};

module.exports = { crearLocalidad, listarLocalidades };
