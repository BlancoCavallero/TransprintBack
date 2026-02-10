const documentationService = require("../services/documentationService");
const { successResponse, errorResponse } = require("../utils/response");

const obtenerTodas = async (req, res, next) => {
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
    if (!doc) return errorResponse(res, "Documentación no encontrada");
    successResponse(res, doc);
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    console.log('=== CREAR DOCUMENTACIÓN ==>');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    // Clonamos el body en data
    const data = { ...req.body };
    
    // Validar que venga el archivo
    if (!req.file) {
      return errorResponse(res, "El archivo PDF es obligatorio", 400);
    }
    
    // Construir la ruta del archivo
    data.detalle = `/uploads/${req.file.filename}`;

    const created = await documentationService.crear(data);
    successResponse(res, created, "Documentación cargada exitosamente");
  } catch (error) {
    console.error("Error al cargar la documentación:", error);
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    console.log('=== ACTUALIZAR DOCUMENTACIÓN ==>');
    console.log('ID:', req.params.id);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const id = req.params.id;
    const resultado = await documentationService.obtenerPorId(id);
    if (!resultado)
      return errorResponse(res, "Documentación no encontrada", 404);

    // Clonamos los datos nuevos del body
    const data = { ...req.body };
    
    // Limpiar detalle si viene como objeto vacío
    if (data.detalle && typeof data.detalle === 'object' && Object.keys(data.detalle).length === 0) {
      delete data.detalle;
    }
    
    // Si vino un archivo, actualizamos el campo 'detalle'
    if (req.file) {
      data.detalle = `/uploads/${req.file.filename}`;
    }
    // IMPORTANTE: No incluir 'detalle' si no hay archivo nuevo
    // Esto evita que se actualice con undefined o string vacío

    const result = await documentationService.actualizar(id, data);
    
    successResponse(res, result, "Documentación actualizada correctamente");
  } catch (error) {
    console.error("Error al actualizar documentación:", error);
    if (req.file) {
      eliminarArchivo(`/uploads/${req.file.filename}`);
    }
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const resultado = await documentationService.obtenerPorId(req.params.id);
    if (!resultado)
      return errorResponse(res, "Documentación no encontrada", 404);
    await documentationService.eliminar(req.params.id);
    successResponse(res, null, "Documentación eliminada correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
