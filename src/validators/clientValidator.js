const { body } = require("express-validator");

const validarCliente = [
  body("correo")
    .notEmpty()
    .withMessage("El correo es obligatorio")
    .isEmail()
    .withMessage("Debe ingresar un correo electrónico válido"),

  body("razonSocial")
    .notEmpty()
    .withMessage("El nombre o razón social es obligatorio"),

  body("tipo")
    .notEmpty()
    .withMessage("El tipo de cliente es obligatorio")
    .isIn(["Productor", "Empresa"])
    .withMessage("El tipo de cliente debe ser 'Productor' o 'Empresa'"),

  // OPCIÓN 1: Cliente con persona existente
  body("idPersona")
    .optional()
    .isNumeric()
    .withMessage("El ID de persona debe ser numérico"),

  // OPCIÓN 2: Crear cliente y persona al mismo tiempo
  body("nombre")
    .optional()
    .notEmpty()
    .withMessage("El nombre es obligatorio si se crea persona")
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),

  body("apellido")
    .optional()
    .notEmpty()
    .withMessage("El apellido es obligatorio si se crea persona")
    .isLength({ min: 2 })
    .withMessage("El apellido debe tener al menos 2 caracteres"),

  body("cuit")
    .optional()
    .notEmpty()
    .withMessage("El CUIT es obligatorio si se crea persona")
    .isNumeric()
    .withMessage("El CUIT debe ser un número válido"),

  body("telefono")
    .optional()
    .notEmpty()
    .withMessage("El teléfono es obligatorio si se crea persona")
    .isLength({ min: 10 })
    .withMessage("El teléfono debe tener al menos 10 dígitos"),

  body("idLocalidad")
    .notEmpty()
    .withMessage("El idLocalidad es obligatorio")
    .isNumeric()
    .withMessage("El ID de localidad debe ser numérico"),
];

const validarClienteActualizacion = [
  // Todos los campos opcionales para actualización
  body("correo")
    .optional()
    .isEmail()
    .withMessage("Debe ingresar un correo electrónico válido"),

  body("razonSocial")
    .optional()
    .isLength({ min: 2 })
    .withMessage("La razón social debe tener al menos 2 caracteres"),

  body("tipo")
    .optional()
    .isIn(["Productor", "Empresa"])
    .withMessage("El tipo de cliente debe ser 'Productor' o 'Empresa'"),

  body("idLocalidad")
    .optional()
    .isNumeric()
    .withMessage("El ID de localidad debe ser numérico"),

  body("observaciones").optional(),

  // Campos de Persona opcionales
  body("nombre")
    .optional()
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),

  body("apellido")
    .optional()
    .isLength({ min: 2 })
    .withMessage("El apellido debe tener al menos 2 caracteres"),

  body("cuit")
    .optional()
    .isNumeric()
    .withMessage("El CUIT debe ser un número válido"),

  body("telefono")
    .optional()
    .isLength({ min: 10 })
    .withMessage("El teléfono debe tener al menos 10 dígitos"),
];

module.exports = { validarCliente, validarClienteActualizacion };
