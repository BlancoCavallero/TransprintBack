const vehiculoService = require("../services/vehiculoService");
const { successResponse, errorResponse } = require("../utils/response");


const obtenerVehiculos = async (req, res, next) => {
  try {
    const { estado } = req.query;
        
        const vehiculos = estado
          ? await vehiculoService.consultarDisponibilidad(estado)
          : await vehiculoService.consultarDisponibilidad();
    
        successResponse(res, vehiculos);
    /*const filtros = req.query;
    const vehiculos = await vehiculoService.obtenerVehiculos(filtros);
    successResponse(res, vehiculos);*/
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
    await vehiculoService.actualizar(req.params.id, req.body);
    successResponse(res, null, "Vehículo actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

const eliminarVehiculo = async (req, res, next) => {
  try {
    await vehiculoService.eliminarVehiculo(req.params.id);
    successResponse(res, null, "Vehículo eliminado correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerVehiculos,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
};
