const express = require("express");
const vehiculoController = require("../controllers/vehiculoController");

const router = express.Router();

router.get("/", vehiculoController.obtenerVehiculos);
router.get("/:id", vehiculoController.obtenerVehiculoPorId);
router.post("/", vehiculoController.crearVehiculo);
router.put("/:id", vehiculoController.actualizarVehiculo);
router.delete("/:id", vehiculoController.eliminarVehiculo);

module.exports = router;