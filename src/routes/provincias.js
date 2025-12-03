const express = require("express");
const router = express.Router();
const provinciaController = require("../controllers/provinciaController");

// Listar provincias (opcional ?search=)
router.get("/", provinciaController.getProvincias);

// Crear provincia por nombre (usa Georef si no existe)
router.post("/", provinciaController.postProvincia);

module.exports = router;
