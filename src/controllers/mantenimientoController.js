const mantenimientoService = require("../services/mantenimientoService");
const { successResponse, errorResponse } = require("../utils/response");

const obtenerMantenimientos = async (req, res, next) => {
  try {
    const filtros = {
      idVehiculo: req.query.idVehiculo,
      tipo: req.query.tipo,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
    };

    const mantenimientos = await mantenimientoService.obtenerMantenimientos(
      filtros
    );
    successResponse(res, mantenimientos);
  } catch (error) {
    next(error);
  }
};

const obtenerMantenimientoPorId = async (req, res, next) => {
  try {
    const mantenimiento = await mantenimientoService.obtenerMantenimientoPorId(
      req.params.id
    );
    if (!mantenimiento)
      return errorResponse(res, "Mantenimiento no encontrado", 404);
    successResponse(res, mantenimiento);
  } catch (error) {
    next(error);
  }
};

const crearMantenimiento = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, tipo, idVehiculo } = req.body;
    if (!fechaInicio || !fechaFin || !tipo || !idVehiculo) {
      return errorResponse(
        res,
        "Faltan campos obligatorios: fechaInicio, fechaFin, tipo, idVehiculo",
        400
      );
    }

    const mantenimiento = await mantenimientoService.crear(req.body);
    successResponse(
      res,
      mantenimiento,
      "Mantenimiento creado exitosamente",
      201
    );
  } catch (error) {
    next(error);
  }
};

const actualizarMantenimiento = async (req, res, next) => {
  try {
    // VERIFICAR PRIMERO que req.body tiene datos
    if (!req.body || Object.keys(req.body).length === 0) {
      return errorResponse(
        res,
        "No se proporcionaron datos para actualizar",
        400
      );
    }

    // Verificar que el mantenimiento existe
    const mantenimientoExistente =
      await mantenimientoService.obtenerMantenimientoPorId(req.params.id);
    if (!mantenimientoExistente) {
      return errorResponse(res, "Mantenimiento no encontrado", 404);
    }

    const mantenimiento = await mantenimientoService.actualizar(
      req.params.id,
      req.body
    );
    successResponse(
      res,
      mantenimiento,
      "Mantenimiento actualizado correctamente"
    );
  } catch (error) {
    next(error);
  }
};

const eliminarMantenimiento = async (req, res, next) => {
  try {
    const mantenimiento = await mantenimientoService.obtenerMantenimientoPorId(
      req.params.id
    );
    if (!mantenimiento)
      return errorResponse(res, "Mantenimiento no encontrado", 404);

    await mantenimientoService.eliminarMantenimiento(req.params.id);
    successResponse(res, null, "Mantenimiento eliminado correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerMantenimientos,
  obtenerMantenimientoPorId,
  crearMantenimiento,
  actualizarMantenimiento,
  eliminarMantenimiento,
};
