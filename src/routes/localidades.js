const express = require("express");
const router = express.Router();
const localidadController = require("../controllers/localidadController");

// ✅ Crear localidad solo si existe en API Georef
router.post("/", localidadController.crearLocalidad);

// ✅ Listar localidades
router.get("/", localidadController.listarLocalidades);

// ✅ Actualizar código postal manualmente
router.put("/:id", localidadController.modificarCodigoPostal);

module.exports = router;
