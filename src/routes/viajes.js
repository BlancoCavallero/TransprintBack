const express = require("express");
const viajeController = require("../controllers/viajeController");
const { crearViajeValidator, actualizarViajeValidator } = require("../validators/viajeValidator");
const validate = require("../middlewares/validarResultado");

const router = express.Router();

router.get("/", viajeController.obtenerViajes);
router.post("/", crearViajeValidator, validate, viajeController.crearViaje);
router.put("/:id", actualizarViajeValidator, validate, viajeController.actualizarViaje);
router.delete("/:id", viajeController.eliminarViaje);

module.exports = router;