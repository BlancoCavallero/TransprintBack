const express = require("express");
const router = express.Router();
// Importamos el controlador que acabamos de crear
const mantenimientoController = require("../controllers/mantenimientoControllers");

// Define los endpoints para el CRUD de Mantenimiento

// CREATE: Crear un nuevo registro de mantenimiento
router.post("/", mantenimientoController.crearMantenimiento);

// READ ALL: Obtener todos los registros de mantenimiento
router.get("/", mantenimientoController.obtenerMantenimientos);

// READ ONE: Obtener un registro de mantenimiento por ID
router.get("/:id", mantenimientoController.obtenerMantenimientoPorId);

// UPDATE: Actualizar un registro de mantenimiento por ID
router.put("/:id", mantenimientoController.actualizarMantenimiento);

// DELETE: Eliminar un registro de mantenimiento por ID
router.delete("/:id", mantenimientoController.eliminarMantenimiento);

module.exports = router;
