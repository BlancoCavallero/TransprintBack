const express = require("express");
const router = express.Router();
const localidadController = require("../controllers/localidadController");

// ✅ Buscar o crear localidad según provincia + nombre
router.post("/", localidadController.crearLocalidad);

// ✅ Listar localidades guardadas (filtros opcionales)
router.get("/", localidadController.listarLocalidades);

module.exports = router;
