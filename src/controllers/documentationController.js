const documentationService = require('../services/documentationService');
const { successResponse, errorResponse } = require("../utils/response");

const obtenerTodas = async (req, res) => {
  try {
    const docs = await documentationService.obtenerTodas();
    successResponse(res, docs);
  } catch (error) {
    next(error);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const doc = await documentationService.obtenerPorId(req.params.id);
    if (!doc) return errorResponse( res, "Documentación no encontrada");
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const { detalle } = req.body;
        const existe = await documentationService.obtenerPorDetalle(detalle);
        if (existe) return errorResponse(res, "El archivo ya fue cargado anteriormente, error", 400);
    
    // Clonamos el body en data
    const data = { ...req.body };
    
    if (req.file) {
      data.detalle = `/uploads/${req.file.filename}`; // Si hay archivo, guardamos su ruta
    }     
    await documentationService.crear(data);
    
    successResponse(res, null, "Documentación cargada exitosamente");
  } catch (error) {
    console.error("Error al cargar la documentación:", error);
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const id = req.params.id;
    const resultado = await documentationService.obtenerPorId(id);
    if (!resultado) return errorResponse(res, "Documentación no encontrada", 404);
    
    // Clonamos los datos nuevos del body
    const data = { ...req.body };
    // Si vino un archivo, actualizamos el campo 'detalle'
    if (req.file) {
      data.detalle = `/uploads/${req.file.filename}`;
    }

    const existe = await documentationService.obtenerPorDetalle(data.detalle);
    if (existe && existe.idDocumentacion !== parseInt(id)) 
      { 
        return errorResponse(res, "El archivo ya fue cargado anteriormente", 400)
      };

    const result = await documentationService.actualizar(id, data)

    successResponse(res, result, "Documentación actualizada correctamente")
    
  } catch (error) {
    console.error("Error al actualizar documentación:", error);
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const resultado = await documentationService.obtenerPorId(req.params.id);
       if (!resultado) return errorResponse(res, "Documentación no encontrada", 404);
    await documentationService.eliminar(req.params.id)
    successResponse(res, null, "Documentación eliminada correctamente")
  } catch (error) {
    next(error);
  }
};



module.exports = { 
    obtenerTodas, 
    obtenerPorId, 
    crear, 
    actualizar, 
    eliminar 
};
