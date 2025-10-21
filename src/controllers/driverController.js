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

const obtenerChoferesFiltradosController = async (req, res) => {
  try {
    const { valor } = req.params;
    const choferes = await driverService.obtenerChoferesFiltrados(valor);

    if (!choferes.length) {
      return res.status(404).json({ mensaje: "No se encontraron choferes" });
    }

    res.json(choferes);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  obtenerChoferId,

  obtenerChoferesFiltradosController,
  consultarHistorial,
  consultarDisponibilidad,
  asignarVehiculo
};

/*  obtenerChoferApellido,
  obtenerChoferNombre,
  obtenerChoferEstado,
  obtenerChoferDni,*/