const express = require("express");
const router = express.Router();
const mantenimientoController = require("../controllers/mantenimientoController");
const validarMantenimiento = require("../validators/mantenimientoValidator");
const validarResultado = require("../middlewares/validarResultado");

// CREATE: Crear un nuevo registro de mantenimiento
router.post(
  "/",
  validarMantenimiento,
  validarResultado,
  mantenimientoController.crearMantenimiento
);

// READ ALL: Obtener todos los registros de mantenimiento (con filtros opcionales)
router.get("/", mantenimientoController.obtenerMantenimientos);

// READ ONE: Obtener un registro de mantenimiento por ID
router.get("/:id", mantenimientoController.obtenerMantenimientoPorId);

// UPDATE: Actualizar un registro de mantenimiento por ID
router.put(
  "/:id",
  validarMantenimiento,
  validarResultado,
  mantenimientoController.actualizarMantenimiento
);

// DELETE: Eliminar un registro de mantenimiento por ID
router.delete("/:id", mantenimientoController.eliminarMantenimiento);

module.exports = router;
