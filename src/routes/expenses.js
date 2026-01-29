const express = require("express");
const expenseController = require("../controllers/expenseController");
const {
  validarGasto,
  validarGastoActualizacion,
} = require("../validators/expenseValidator");
const validarResultado = require("../middlewares/validarResultado");
const router = express.Router();

router.get("/", expenseController.obtenerGastos);
router.get("/:id", expenseController.obtenerGastosPorId);
router.get("/viaje/:idViaje", expenseController.obtenerGastosPorViaje);
router.post("/", validarGasto, validarResultado, expenseController.crear);
router.put(
  "/:id",
  validarGastoActualizacion,
  validarResultado,
  expenseController.modificar
);
router.delete("/:id", expenseController.eliminar);

module.exports = router;
