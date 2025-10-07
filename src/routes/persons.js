const express = require("express");
const personController = require("../controllers/personController");
const validarPersona = require("../validators/personValidator");
const validarResultado = require("../middlewares/validarResultado");
const router = express.Router();

router.get("/", personController.obtenerPersonas);
router.get("/:id", personController.obtenerPersona);
router.post("/", validarPersona, validarResultado, personController.crearPersona);
router.put("/:id", validarPersona, validarResultado, personController.actualizarPersona);
router.delete("/:id", personController.eliminar);

module.exports = router;
