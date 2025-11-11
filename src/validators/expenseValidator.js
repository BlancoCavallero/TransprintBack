const { body } = require("express-validator");

const validarGasto = [
  body("detalle")
    .notEmpty().withMessage("El detalle es obligatorio")
    .isString().withMessage("El detalle debe ser texto")
    .isLength({ max: 255 }).withMessage("El detalle no puede superar los 255 caracteres"),

  body("monto")
    .notEmpty().withMessage("El monto es obligatorio")
    .isFloat({ gt: 0 }).withMessage("El monto debe ser un número mayor que 0"),

  body("tipo")
    .notEmpty().withMessage("El tipo es obligatorio")
    .isString().withMessage("El tipo debe ser texto")
    .isLength({ max: 45 }).withMessage("El tipo no puede superar los 45 caracteres"),

  body("idViaje")
    .notEmpty().withMessage("El idViaje es obligatorio")
    .isInt({ gt: 0 }).withMessage("El idViaje debe ser un número entero válido"),
];

module.exports = validarGasto;
