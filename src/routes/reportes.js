const express = require("express");
const reporteController = require("../controllers/reporteController");

const router = express.Router();

// GET /api/reportes/ganancias?mes=1&anio=2026
router.get("/ganancias", reporteController.obtenerReporteGanancias);

// GET /api/reportes/gastos?mes=1&anio=2026
router.get("/gastos", reporteController.obtenerReporteGastos);

// GET /api/reportes/viaticos?mes=1&anio=2026
router.get("/viaticos", reporteController.obtenerReporteViaticos);

module.exports = router;
