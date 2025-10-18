const vehiculoService = require("../services/vehiculoService");
const { successResponse, errorResponse } = require("../utils/response");

const obtenerVehiculos = async (req, res, next) => {
  try {
    const vehiculos = await vehiculoService.obtenerVehiculos();
    successResponse(res, vehiculos);
  } catch (error) {
    next(error);
  }
};

const obtenerVehiculoPorId = async (req, res, next) => {
  try {
    const vehiculo = await vehiculoService.obtenerVehiculoPorId(req.params.id);
    if (!vehiculo) return errorResponse(res, "Vehículo no encontrado", 404);
    successResponse(res, vehiculo);
  } catch (error) {
    next(error);
  }
};

const crearVehiculo = async (req, res, next) => {
  try {
    await vehiculoService.crear(req.body);
    successResponse(res, null, "Vehículo creado exitosamente");
  } catch (error) {
    next(error);
  }
};

const actualizarVehiculo = async (req, res, next) => {
  try {
    const vehiculo = await vehiculoService.obtenerPorId(req.params.id);
    if (!vehiculo) return errorResponse(res, "Vehículo no encontrado", 404);

    await vehiculoService.actualizar(req.params.id, req.body);
    successResponse(res, null, "Vehículo actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

const eliminarVehiculo = async (req, res, next) => {
  try {
    const vehiculo = await vehiculoService.obtenerVehiculoPorId(req.params.id);
    if (!vehiculo) return errorResponse(res, "Vehículo no encontrado", 404);

    await vehiculoService.eliminarVehiculo(req.params.id);
    successResponse(res, null, "Vehículo eliminado correctamente");
  } catch (error) {
    next(error);
  }
};


module.exports = {
  obtenerVehiculos,
  obtenerVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
};
