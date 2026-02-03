const express = require("express");
const router = express.Router();

const vehiculoController = require("../controllers/vehiculoController");
const { validarCreacionVehiculo, validarActualizacionVehiculo } = require("../validators/vehiculoValidator");
const validarResultado = require("../middlewares/validarResultado");

// 1. Rutas fijas (específicas)
router.get("/", vehiculoController.obtenerVehiculos); // Obtener todos o filtrar
router.get("/con-mantenimientos", vehiculoController.obtenerVehiculosConMantenimientos);

// 2. Rutas con parámetros (dinámicas)
router.get("/:id", vehiculoController.obtenerVehiculoPorId); // Obtener un vehículo específico por ID
router.get("/:idVehiculo/mantenimientos",vehiculoController.obtenerMantenimientosDeVehiculo);

// Registrar vehículo nuevo (valida campos)
router.post("/", validarCreacionVehiculo, validarResultado, vehiculoController.crearVehiculo);

// Actualizar vehículo existente (valida campos)
router.put("/:id", validarActualizacionVehiculo, validarResultado, vehiculoController.actualizarVehiculo);

// Eliminar vehículo
//router.delete("/:id", vehiculoController.eliminarVehiculo);
router.put("/:id/:accion", vehiculoController.bajaVehiculo);




module.exports = router;
