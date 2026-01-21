const express = require("express");
const {
  registerAuthUser,
  loginAuthUser,
  obtenerUsuariosAuth0,
  actualizarUsuarioAuth0,
  eliminarUsuarioAuth0,
} = require("../controllers/authController");
const router = express.Router();

// POST /api/register -> crea usuario en Auth0 y asigna rol
router.post("/register", registerAuthUser);

// POST /api/login -> intercambia credenciales por tokens (Auth0)
router.post("/login", loginAuthUser);

// GET /api/usuarios -> obtiene lista de usuarios de Auth0 con roles
router.get("/usuarios", obtenerUsuariosAuth0);

// PUT /api/usuarios/:userId -> actualiza usuario en Auth0
router.put("/usuarios/:userId", actualizarUsuarioAuth0);

// DELETE /api/usuarios/:userId -> elimina usuario de Auth0
router.delete("/usuarios/:userId", eliminarUsuarioAuth0);

module.exports = router;
