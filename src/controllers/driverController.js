const driverService = require("../services/driverService");
const { successResponse } = require("../utils/response");
/*
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
    const choferes = await driverService.obtenerChoferes(req.query);
    successResponse(res, choferes, "Búsqueda realizada");
  } catch (error) {
    next(error);
  }
};

*/
const obtenerPersonas = async (req, res, next) => {
  try {
    const personas = await personService.obtenerTodas();
    successResponse(res, personas);
  } catch (error) {
    next(error);
  }
};

const obtenerPersona = async (req, res, next) => {
  try {
    const persona = await personService.obtenerPorId(req.params.id);
    if (!persona) return errorResponse(res, "Persona no encontrada", 404);
    res.json(persona);
  } catch (error) {
    next(error);
  }
};

const registrarChofer = async (req, res, next) => {
  try {
    const chofer = await driverService.registrarChofer(req.body);
    successResponse(res, chofer, "Chofer registrado correctamente");
  } catch (error) {
    next(error);
  }
};

const crearPersona = async (req, res, next) => {
  try {
    const { cuit } = req.body;
    const existe = await personService.obtenerPorCuit(cuit);
    if (existe) return errorResponse(res, "La persona con este cuit ya está registrada", 400);
        
    await personService.crear(req.body);
    successResponse(res, null, "Persona creada exitosamente");
  } catch (error) {
    console.error("Error al crear persona:", error);

    // Manejo de errores que pueden provenir de la base de datos
    if (error.sqlMessage) {
      if (error.sqlMessage.includes("Out of range value")) {
        if (error.sqlMessage.includes("cuit")) {
          return errorResponse(res, "El número de CUIT es inválido o demasiado largo.", 400);
        } else if (error.sqlMessage.includes("telefono")) {
          return errorResponse(res, "El número de teléfono es es inválido o demasiado largo.", 400);
        }
      }
    }
    next(error);
  }
};

const actualizarPersona = async (req, res, next) => {
  try {
    const persona = await personService.obtenerPorId(req.params.id);
    if (!persona) return errorResponse(res, "Persona no encontrada", 404);
  
    await personService.actualizar(req.params.id, req.body);
    successResponse(res, null, "Persona actualizada correctamente");
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
    try {
    const persona = await personService.obtenerPorId(req.params.id);
    if (!persona) return errorResponse(res, "Persona no encontrada", 404);

    await personService.eliminar(req.params.id);
    successResponse(res, null, "Persona eliminada correctamente");
  } catch (error) {
    next(error);
  }
};
/*
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

*/
module.exports = {
  registrarChofer,
  modificarChofer,
  eliminarChofer,
  obtenerChoferes, 
  consultarHistorial,
  consultarDisponibilidad,
  asignarCamion,
};