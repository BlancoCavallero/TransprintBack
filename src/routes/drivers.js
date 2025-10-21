const express = require("express");
const driverController = require("../controllers/driverController");
const validarChofer = require("../validators/driverValidator.js");
const validarResultado = require("../middlewares/validarResultado");
const router = express.Router();

router.get("/", driverController.obtenerChoferes);
router.get("/id/:id", driverController.obtenerChoferId);
/*
router.get("/apellido/:apellido", driverController.obtenerChoferApellido);
router.get("/nombre/:nombre", driverController.obtenerChoferNombre);
router.get("/estado/:estado", driverController.obtenerChoferEstado);
router.get("/dni/:dni", driverController.obtenerChoferDni);
*/
router.get("/buscar/:valor", driverController.obtenerChoferesFiltradosController);

router.post("/", validarChofer, validarResultado, driverController.registrarChofer);
router.put("/:id", validarChofer, validarResultado, driverController.modificarChofer);
router.delete("/:id", driverController.eliminarChofer);

router.get("/:id/historial", driverController.consultarHistorial);
router.get("/:id/disponibilidad", driverController.consultarDisponibilidad); //y esto?
router.post("/:id/asignar-camion", driverController.asignarVehiculo);

module.exports = router;
