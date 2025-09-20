const express = require("express");
const router = express.Router();
const {
  validarCliente,
  registrarCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente
  //eliminarCliente,*/
} = require("../controllers/clientController");

// Rutas CRUD clientes
router.post("/clients", validarCliente, registrarCliente); // Crear
router.get("/clients", obtenerClientes);                  // Listar todos
router.get("/clients/:id", obtenerClientePorId);          // Buscar por ID
router.put("/clients/:id", validarCliente, actualizarCliente); // Actualizar
//router.delete("/clients/:id", eliminarCliente);*/           // Eliminar

module.exports = router;
