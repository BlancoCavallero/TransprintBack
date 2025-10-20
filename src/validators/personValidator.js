const { body } = require("express-validator");

const validarPersona = [
  
  body("nombre")
    .notEmpty().withMessage("El nombre es obligatorio")
    .isString().withMessage("El nombre debe estar en formato texto"),

  body("apellido")
    .notEmpty().withMessage("El apellido es obligatorio")
    .isString().withMessage("El apellido debe estar en formato texto"),

  body("cuit")
    .notEmpty().withMessage("El CUIT es obligatorio")
    .isLength({ min: 11, max: 12 }).withMessage("Debe ingresar un CUIT valido")
    .isNumeric().withMessage("El cuit debe ser numérico"),

  body("telefono")
    .optional()
    .isLength({ min: 6, max: 20 }).withMessage("El teléfono debe tener entre 6 y 20 dígitos")
    .isNumeric().withMessage("El teléfono debe ser numérico"),
];

module.exports = validarPersona;
