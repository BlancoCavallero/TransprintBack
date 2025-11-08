const express = require("express");
const expenseController = require("../controllers/expenseController");
const validarGasto = require("../validators/expenseValidator");
const validarResultado = require("../middlewares/validarResultado");
const router = express.Router();

router.get("/", expenseController.obtenerGastos);
router.get("/:id", expenseController.obtenerGastosPorId);
router.post("/", validarGasto, validarResultado, expenseController.crear);
router.put("/:id", validarGasto, validarResultado, expenseController.modificar);
router.delete("/:id", expenseController.eliminar);

module.exports = router;
