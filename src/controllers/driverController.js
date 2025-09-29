const driverService = require("../services/driverService");
const { successResponse } = require("../utils/response");

const registrarChofer = async (req, res, next) => {
  try {
    const chofer = await driverService.registrarChofer(req.body);
    successResponse(res, chofer, "Chofer registrado correctamente");
  } catch (error) {
    next(error);
  }
};

const actualizarChofer = async (req, res, next) => {
  try {
    const chofer = await driverService.actualizarChofer(req.params.id, req.body);
    successResponse(res, chofer, "Chofer modificado correctamente");
  } catch (error) {
    next(error);
  }
};

const eliminarChofer = async (req, res, next) => {
  try {
    await driverService.eliminarChofer(req.params.id);
    successResponse(res, null, "Chofer eliminado correctamente");
  } catch (error) {
    next(error);
  }
};

const obtenerChoferes = async (req, res, next) => {
  try {
    const choferes = await driverService.obtenerChoferes(req.query);
    successResponse(res, choferes, "Búsqueda realizada");
  } catch (error) {
    next(error);
  }
};

const consultarHistorial = async (req, res, next) => {
  try {
    const historial = await driverService.consultarHistorial(req.params.id, req.query);
    successResponse(res, historial, "Historial de viajes obtenido");
  } catch (error) {
    next(error);
  }
};

const consultarDisponibilidad = async (req, res, next) => {
  try {
    const disponibilidad = await driverService.consultarDisponibilidad(req.params.id);
    successResponse(res, disponibilidad, "Disponibilidad consultada");
  } catch (error) {
    next(error);
  }
};

const asignarCamion = async (req, res, next) => {
  try {
    const asignacion = await driverService.asignarCamion(req.params.id, req.body.idCamion);
    successResponse(res, asignacion, "Camión asignado correctamente");
  } catch (error) {
    next(error);
  }
};


module.exports = {
  registrarChofer,
  actualizarChofer,
  eliminarChofer,
  obtenerChoferes, 
  consultarHistorial,
  consultarDisponibilidad,
  asignarCamion,
};