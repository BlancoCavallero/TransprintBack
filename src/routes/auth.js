const express = require("express");
const {
  registerAuthUser,
  loginAuthUser,
} = require("../controllers/authController");
const router = express.Router();

// POST /api/register -> crea usuario en Auth0 y asigna rol
router.post("/register", registerAuthUser);

// POST /api/login -> intercambia credenciales por tokens (Auth0)
router.post("/login", loginAuthUser);

module.exports = router;
