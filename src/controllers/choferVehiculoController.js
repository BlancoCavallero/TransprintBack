const {
  listarChoferVehiculos,
  obtenerPorId,
  crearChoferVehiculo,
  eliminarChoferVehiculo,
} = require("../services/choferVehiculoService");
const { successResponse, errorResponse } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const filtros = req.query || {};
    const rows = await listarChoferVehiculos(filtros);
    successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const row = await obtenerPorId(req.params.id);
    if (!row) return errorResponse(res, "Relación no encontrada", 404);
    successResponse(res, row);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { idChofer, idVehiculo, fechaAsignacion } = req.body;
    const created = await crearChoferVehiculo({ idChofer, idVehiculo, fechaAsignacion });
    successResponse(res, created, "Relación creada correctamente");
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await obtenerPorId(req.params.id);
    if (!existing) return errorResponse(res, "Relación no encontrada", 404);
    await eliminarChoferVehiculo(req.params.id);
    successResponse(res, null, "Relación eliminada correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, remove };
