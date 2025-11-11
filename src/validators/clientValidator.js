const { body } = require("express-validator");

const validarCliente = [
  body("codPostal")
    .notEmpty().withMessage("El código postal es obligatorio")
    .isNumeric().withMessage("El código postal debe ser numérico"),

  body("correo")
    .notEmpty().withMessage("El correo es obligatorio")
    .isEmail().withMessage("Debe ingresar un correo electrónico válido"),

  body("razonSocial")
    .notEmpty().withMessage("El nombre o razón social es obligatorio"),

  body("tipo")
    .notEmpty().withMessage("El tipo de cliente es obligatorio")
    .isIn(["Productor", "Empresa"])
    .withMessage("El tipo de cliente debe ser 'Productor' o 'Empresa'"),

  body("idPersona")
    .notEmpty().withMessage("El idPersona es obligatorio")
    .isNumeric().withMessage("El ID de persona debe ser numérico"),

  body("idLocalidad")
    .notEmpty().withMessage("El idLocalidad es obligatorio")
    .isNumeric().withMessage("El ID de localidad debe ser numérico"),
];

module.exports = validarCliente;
