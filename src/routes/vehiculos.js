const express = require("express");
const router = express.Router();

const vehiculoController = require("../controllers/vehiculoController");
const { validarCreacionVehiculo, validarActualizacionVehiculo } = require("../validators/vehiculoValidator");
const validarResultado = require("../middlewares/validarResultado");

// Obtener todos o filtrar
router.get("/", vehiculoController.obtenerVehiculos);

// Registrar vehículo nuevo (valida campos)
router.post("/", validarCreacionVehiculo, validarResultado, vehiculoController.crearVehiculo);

// Actualizar vehículo existente (valida campos)
router.put("/:id", validarActualizacionVehiculo, validarResultado, vehiculoController.actualizarVehiculo);

// Eliminar vehículo
router.delete("/:id", vehiculoController.eliminarVehiculo);

router.get("/con-mantenimientos", vehiculoController.obtenerVehiculosConMantenimientos);
router.get("/:idVehiculo/mantenimientos",vehiculoController.obtenerMantenimientosDeVehiculo);

module.exports = router;
