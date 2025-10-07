const personService = require("../services/personService");
const { successResponse, errorResponse } = require("../utils/response");

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

module.exports = {
  obtenerPersonas,
  obtenerPersona,
  crearPersona,
  actualizarPersona,
  eliminar,
};
