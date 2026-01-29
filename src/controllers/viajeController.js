const viajeService = require("../services/viajeService");
const { successResponse, errorResponse } = require("../utils/response");

// ✅ GET
const obtenerViajes = async (req, res, next) => {
  try {
    const filtros = req.query;
    const viajes = await viajeService.obtenerViajes(filtros);
    successResponse(res, viajes);
  } catch (error) {
    next(error);
  }
};

// ✅ POST
const crearViaje = async (req, res, next) => {
  try {
    const created = await viajeService.crear(req.body);
    successResponse(res, created, "Viaje creado exitosamente");
  } catch (error) {
    next(error);
  }
};

// ✅ PUT
const actualizarViaje = async (req, res, next) => {
  try {
    const updated = await viajeService.actualizar(req.params.id, req.body);
    successResponse(res, updated, "Viaje actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

// ✅ DELETE
const eliminarViaje = async (req, res, next) => {
  try {
    await viajeService.eliminar(req.params.id);
    successResponse(res, null, "Viaje eliminado correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerViajes,
  crearViaje,
  actualizarViaje,
  eliminarViaje,
};
