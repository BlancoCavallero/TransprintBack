const viajeAcopladoService = require("../services/viajeAcopladoService");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * POST /viajes/:idViaje/acoplados
 * body: { idAcoplado, orden }
 */
const asignarAcopladoAViaje = async (req, res, next) => {
  try {
    const { idViaje } = req.params;
    const { idAcoplado, orden } = req.body;

    const resultado = await viajeAcopladoService.asignarAcopladoViaje(
      idViaje,
      idAcoplado,
      orden
    );

    successResponse(res, resultado, "Acoplado asignado al viaje");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /viajes/:idViaje/acoplados
 */
const obtenerAcopladosDeViaje = async (req, res, next) => {
  try {
    const { idViaje } = req.params;

    const acoplados =
      await viajeAcopladoService.obtenerAcopladosPorViaje(idViaje);

    successResponse(res, acoplados);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /viajes/:idViaje/acoplados/:idAcoplado
 */
const quitarAcopladoDeViaje = async (req, res, next) => {
  try {
    const { idViaje, idAcoplado } = req.params;

    await viajeAcopladoService.quitarAcopladoViaje(idViaje, idAcoplado);

    successResponse(res, null, "Acoplado quitado del viaje");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  asignarAcopladoAViaje,
  obtenerAcopladosDeViaje,
  quitarAcopladoDeViaje,
};
