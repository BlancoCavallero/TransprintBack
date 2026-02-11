// src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');
const { successResponse, errorResponse } = require('../utils/response');

const obtenerDashboard = async (req, res, next) => {
    try {
        //console.log('📊 [Dashboard] Solicitando datos...');
        
        // 1. Llamamos al SERVICE para que haga los cálculos
        const datosDashboard = await dashboardService.obtenerDatosDashboard();
        
        // 2. Enviamos la respuesta CON ÉXITO
        successResponse(res, datosDashboard, "Dashboard obtenido exitosamente");
        
        //console.log('✅ [Dashboard] Datos enviados correctamente');
    } catch (error) {
        // 3. Si algo sale MAL, manejamos el error
        console.error('❌ [Dashboard] Error:', error.message);
        
        // Enviamos error al middleware global
        next(error);
    }
};

// Exportamos SOLO esta función
module.exports = {
    obtenerDashboard
};