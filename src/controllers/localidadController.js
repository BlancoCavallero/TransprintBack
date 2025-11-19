const { obtenerOCrearLocalidad, obtenerLocalidades, actualizarCodigoPostal } = require("../services/localidadService");
const { successResponse } = require("../utils/response");

const crearLocalidad = async (req, res, next) => {
  try {
    const { provincia, localidad, codPostal } = req.body;
    const resultado = await obtenerOCrearLocalidad(provincia, localidad, codPostal);
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

const modificarCodigoPostal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codPostal } = req.body;
    const resultado = await actualizarCodigoPostal(id, codPostal);
    successResponse(res, resultado, "Código postal actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = { crearLocalidad, listarLocalidades, modificarCodigoPostal };
