const express = require("express");
const expenseController = require("../controllers/expenseController");
const validarPersona = require("../validators/personValidator");
const validarResultado = require("../middlewares/validarResultado");
const router = express.Router();

router.get("/", expenseController.obtenerGastos);
router.get("/:id", expenseController.obtenerGastosPorId);
router.post("/", validarPersona, validarResultado, expenseController.crear);
router.put("/:id", validarPersona, validarResultado, expenseController.modificar);
router.delete("/:id", expenseController.eliminar);

module.exports = router;
