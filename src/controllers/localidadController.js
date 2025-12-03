const {
  obtenerOCrearLocalidad,
  crearLocalidadPorId,
  obtenerLocalidades,
  actualizarCodigoPostal,
} = require("../services/localidadService");
const { successResponse } = require("../utils/response");

const crearLocalidad = async (req, res, next) => {
  try {
    const { provincia, localidad, codPostal, idProvincia } = req.body;

    // Opción A: Si envían idProvincia, usar directamente
    if (idProvincia) {
      const resultado = await crearLocalidadPorId(
        idProvincia,
        localidad,
        codPostal
      );
      return successResponse(
        res,
        resultado,
        "Localidad registrada correctamente"
      );
    }

    // Opción B: Si envían provincia (nombre), buscar/crear via Georef
    if (provincia) {
      const resultado = await obtenerOCrearLocalidad(
        provincia,
        localidad,
        codPostal
      );
      return successResponse(
        res,
        resultado,
        "Localidad registrada correctamente"
      );
    }

    // Error si no envía ninguno
    throw {
      status: 400,
      message: "Debe enviar 'provincia' o 'idProvincia' en el body",
    };
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
