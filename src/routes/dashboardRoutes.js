// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// ========== RUTAS DISPONIBLES ==========

// GET /api/dashboard
// Obtiene TODOS los datos del dashboard
router.get('/', dashboardController.obtenerDashboard);

// Exportamos el router para usarlo en server.js
module.exports = router;