const express = require("express");
const router = express.Router();

const clientController = require("../controllers/clientController");
const validarCliente = require("../validators/clientValidator");
const validarResultado = require("../middlewares/validarResultado");

router.get("/", clientController.obtenerClientes); // Listar todos
router.get("/:id", clientController.obtenerClientePorId); // Buscar por ID
router.post("/", validarCliente, validarResultado, clientController.registrarCliente); // Crear
router.put("/:id", validarCliente, validarResultado, clientController.actualizarCliente); // Actualizar
router.delete("/:id", clientController.eliminarCliente); // Eliminar
           

module.exports = router;
