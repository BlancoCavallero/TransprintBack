const express = require("express");
const viajeController = require("../controllers/viajeController");

const router = express.Router();

router.get("/", viajeController.obtenerViajes);
router.post("/", viajeController.crearViaje);
router.put("/:id", viajeController.actualizarViaje);
router.delete("/:id", viajeController.eliminarViaje);

module.exports = router;
