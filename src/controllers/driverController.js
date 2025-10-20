const driverService = require("../services/driverService");
const { successResponse, errorResponse } = require("../utils/response");

const registrarChofer = async (req, res, next) => {
  try {
    const chofer = await driverService.registrarChofer(req.body);
    successResponse(res, chofer, "Chofer registrado correctamente");
  } catch (error) {
    next(error);
  }
};

const modificarChofer = async (req, res, next) => {
  try {
    const chofer = await driverService.modificarChofer(req.params.id, req.body);
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
    const choferes = await driverService.obtenerChoferes();
    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};

const obtenerChofer = async (req, res, next) => {
  try {
    const chofer = await driverService.obtenerPorId(req.params.id);
    if (!chofer) return errorResponse(res, "Chofer no encontrado", 404);
    successResponse(res, chofer);
  } catch (error) {
    next(error);
  }
};


// --- Consultar historial de viajes ---
const consultarHistorial = async (req, res, next) => {
  try {
    const { desde, hasta, estado } = req.query;
    const historial = await driverService.consultarHistorial(req.params.id, { desde, hasta, estado });
    successResponse(res, historial, "Historial de viajes obtenido");
  } catch (error) {
    next(error);
  }
};

// --- Consultar disponibilidad ---
const consultarDisponibilidad = async (req, res, next) => {
  try {
    const estado = await driverService.consultarDisponibilidad(req.params.id);
    successResponse(res, { estadoDisponibilidad: estado }, "Disponibilidad consultada");
  } catch (error) {
    next(error);
  }
};

// --- Asignar Vehículo ---
const asignarVehiculo = async (req, res, next) => {
  try {
    const { idVehiculo } = req.body;
    const resultado = await driverService.asignarVehiculo(req.params.id, idVehiculo);
    successResponse(res, resultado, "Vehículo asignado correctamente");
  } catch (error) {
    next(error);
  }
};


module.exports = {
  registrarChofer,
  modificarChofer,
  eliminarChofer,
  obtenerChoferes,
  obtenerChofer,
  consultarHistorial,
  consultarDisponibilidad,
  asignarVehiculo
};
