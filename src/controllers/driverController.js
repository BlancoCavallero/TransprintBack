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

const bajaChofer = async (req, res, next) => {

  try {
    const { id, accion } = req.params;
    await driverService.bajaChofer(id, accion);

    const mensaje =
      accion === "baja"
        ? "Chofer dado de baja correctamente"
        : "Chofer reactivado correctamente";

      successResponse(res, null, mensaje);
  } catch (error) {
    next(error);
  }
};

const obtenerChoferes = async (req, res, next) => {
  try {
    const { estado } = req.query;
    
    const choferes = estado
      ? await driverService.consultarDisponibilidad(estado)
      : await driverService.consultarDisponibilidad();

    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};

const obtenerChoferId = async (req, res, next) => {
  try {
    const chofer = await driverService.obtenerPorId(req.params.id);
    if (!chofer) return errorResponse(res, "Chofer no encontrado", 404);
    successResponse(res, chofer);
  } catch (error) {
    next(error);
  }
};
/*
const obtenerChoferNombre = async (req, res, next) => {
  try {
    const choferes = await driverService.obtenerPorNombre(req.params.nombre);
    if (!choferes) return errorResponse(res, "Chofer no encontrado", 404);
    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};

const obtenerChoferApellido = async (req, res, next) => {
  try {
    const choferes = await driverService.obtenerPorApellido(req.params.apellido);
    if (!choferes) return errorResponse(res, "Chofer no encontrado", 404);
    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};

const obtenerChoferEstado = async (req, res, next) => {
  try {
    const choferes = await driverService.obtenerPorEstado(req.params.estado);
    if (!choferes) return errorResponse(res, "Chofer no encontrado", 404);
    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};

const obtenerChoferDni = async (req, res, next) => {
  try {
    const choferes = await driverService.obtenerPorDni(req.params.dni);
    if (!choferes) return errorResponse(res, "Chofer no encontrado", 404);
    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};
*/

const obtenerChoferesFiltradosController = async (req, res, next) => {
  try {
    const { valor } = req.params;
    const choferes = await driverService.obtenerChoferesFiltrados(valor);
    if (!choferes.length)
      return errorResponse(res, "No se encontraron choferes", 404);
    successResponse(res, choferes);
  } catch (error) {
    next(error);
  }
};

// --- Consultar historial de viajes ---
const consultarHistorial = async (req, res, next) => {
  try {
    const { desde, hasta, estado } = req.query;
    const historial = await driverService.consultarHistorial(req.params.id, {
      desde,
      hasta,
      estado,
    });
    successResponse(res, historial, "Historial de viajes obtenido");
  } catch (error) {
    next(error);
  }
};

// --- Asignar Vehículo (DEPRECADO - Ya no se usa, la asignación se maneja en Viajes) ---

module.exports = {
  registrarChofer,
  modificarChofer,
  bajaChofer,
  obtenerChoferes,
  obtenerChoferId,
  obtenerChoferesFiltradosController,
  consultarHistorial,
};
