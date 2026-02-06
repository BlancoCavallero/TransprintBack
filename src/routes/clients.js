const express = require("express");
const router = express.Router();

const clientController = require("../controllers/clientController");
const {
  validarCliente,
  validarClienteActualizacion,
} = require("../validators/clientValidator");
const validarResultado = require("../middlewares/validarResultado");

router.get("/", clientController.obtenerClientes); // Listar todos
router.get("/:id", clientController.obtenerClientePorId); // Buscar por ID
router.get(
  "/buscar/:valor",
  clientController.obtenerClientesFiltradosController
); //buscar por otros filtros
router.post(
  "/",
  validarCliente,
  validarResultado,
  clientController.registrarCliente
); // Crear
router.put(
  "/:id",
  validarClienteActualizacion,
  validarResultado,
  clientController.actualizarCliente
); // Actualizar

//router.delete("/:id", clientController.eliminarCliente); // Eliminar
router.put("/:id/:accion", clientController.bajaCliente);

module.exports = router;
