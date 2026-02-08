const reporteService = require("../services/reporteService");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Obtiene el reporte de ganancias
 * Query params: mes (opcional), anio (opcional)
 */
const obtenerReporteGanancias = async (req, res, next) => {
  console.log('\n🌐 [CONTROLLER] GET /api/reportes/ganancias');
  console.log('📨 [CONTROLLER] Query params:', req.query);
  
  try {
    const { mes, anio } = req.query;

    // Validar mes si se proporciona
    if (mes && (mes < 1 || mes > 12)) {
      return errorResponse(res, "El mes debe estar entre 1 y 12", 400);
    }

    // Validar año si se proporciona
    if (anio && (anio < 2000 || anio > 2100)) {
      return errorResponse(res, "El año no es válido", 400);
    }

    const reporte = await reporteService.obtenerReporteGanancias(
      mes ? parseInt(mes) : null,
      anio ? parseInt(anio) : null
    );

    console.log('📤 [CONTROLLER] Data preview:', {
      viajes: reporte.viajes?.length,
      totalizadores: reporte.totalizadores
    });
    
    successResponse(res, reporte);
  } catch (error) {
    console.error('❌ [CONTROLLER] Error en obtenerReporteGanancias:', error);
    next(error);
  }
};

/**
 * Obtiene el reporte de gastos agrupados por tipo
 * Query params: mes (opcional), anio (opcional)
 */
const obtenerReporteGastos = async (req, res, next) => {
  console.log('\n🌐 [CONTROLLER] GET /api/reportes/gastos');
  console.log('📨 [CONTROLLER] Query params:', req.query);
  
  try {
    const { mes, anio } = req.query;

    // Validar mes si se proporciona
    if (mes && (mes < 1 || mes > 12)) {
      return errorResponse(res, "El mes debe estar entre 1 y 12", 400);
    }

    // Validar año si se proporciona
    if (anio && (anio < 2000 || anio > 2100)) {
      return errorResponse(res, "El año no es válido", 400);
    }

    const reporte = await reporteService.obtenerReporteGastos(
      mes ? parseInt(mes) : null,
      anio ? parseInt(anio) : null
    );

    console.log('📤 [CONTROLLER] Gastos count:', reporte.gastos?.length);
    
    successResponse(res, reporte);
  } catch (error) {
    console.error('❌ [CONTROLLER] Error en obtenerReporteGastos:', error);
    next(error);
  }
};

/**
 * Obtiene el reporte de viáticos por chofer
 * Query params: mes (opcional), anio (opcional)
 */
const obtenerReporteViaticos = async (req, res, next) => {
  console.log('\n🌐 [CONTROLLER] GET /api/reportes/viaticos');
  console.log('📨 [CONTROLLER] Query params:', req.query);
  
  try {
    const { mes, anio } = req.query;

    // Validar mes si se proporciona
    if (mes && (mes < 1 || mes > 12)) {
      return errorResponse(res, "El mes debe estar entre 1 y 12", 400);
    }

    // Validar año si se proporciona
    if (anio && (anio < 2000 || anio > 2100)) {
      return errorResponse(res, "El año no es válido", 400);
    }

    const reporte = await reporteService.obtenerReporteViaticos(
      mes ? parseInt(mes) : null,
      anio ? parseInt(anio) : null
    );
    console.log('📤 [CONTROLLER] Choferes count:', reporte.choferes?.length);
    
    successResponse(res, reporte);
  } catch (error) {
    console.error('❌ [CONTROLLER] Error en obtenerReporteViaticos:', error);
    next(error);
  }
};

module.exports = {
  obtenerReporteGanancias,
  obtenerReporteGastos,
  obtenerReporteViaticos,
};
