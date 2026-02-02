const { body } = require("express-validator");

const validarChofer = [
  // OPCIÓN 1: Crear chofer con persona existente
  body("idPersona")
    .optional()
    .isInt()
    .withMessage("El idPersona debe ser un número entero"),

  // OPCIÓN 2: Crear chofer y persona al mismo tiempo
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

  // DNI del chofer (obligatorio)
  body("dni")
    .notEmpty()
    .withMessage("El DNI es obligatorio")
    .isInt({ min: 1000000, max: 99999999 })
    .withMessage("El DNI debe ser un número válido de hasta 8 dígitos"),

  body("estadoDisponibilidad")
  .optional()
  .custom(() => {
    throw new Error("El estadoDisponibilidad no puede registrarse manualmente")
  }),

];

const validarChoferActualizacion = [
  // Todos los campos opcionales para actualización
  body("dni")
    .optional()
    .isInt({ min: 1000000, max: 99999999 })
    .withMessage("El DNI debe ser un número válido de hasta 8 dígitos"),

  body("estadoDisponibilidad")
  .optional()
  .custom(() => {
    throw new Error("El estadoDisponibilidad no puede modificarse manualmente")
  }),
  
  body("idPersona")
  .optional()
  .custom(() => {
    throw new Error("No está permitido modificar el idPersona")
  }),
  
  body("activo")
  .optional()
  .custom(() => {
    throw new Error("No está permitido modificar el campo activo manualmente")
  }),


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

module.exports = { validarChofer, validarChoferActualizacion };
