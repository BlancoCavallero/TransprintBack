const { body } = require("express-validator");

const validarChofer = [
  body("dni")
    .notEmpty().withMessage("El DNI es obligatorio")
    .isInt({ min: 1000000, max: 99999999 }).withMessage("El DNI debe ser un número válido de hasta 8 dígitos"),

  body("idPersona")
    .notEmpty().withMessage("El idPersona es obligatorio")
    .isInt().withMessage("El idPersona debe ser un número entero"),

];

module.exports = validarChofer;
