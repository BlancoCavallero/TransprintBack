const { body } = require("express-validator");

const validarDocumentacion = [
  // detalle: la URL o ruta del archivo
  body("detalle")
    .notEmpty().withMessage("El detalle es obligatorio")
    .isString().withMessage("El detalle debe ser texto")
    .isLength({ max: 100 }).withMessage("El detalle no puede superar los 100 caracteres"),

  // nombre: nombre del tipo de documentación (Carnet, Seguro, etc.)
  body("nombre")
    .notEmpty().withMessage("El nombre es obligatorio")
    .isString().withMessage("El nombre debe estar en formato texto")
    .isLength({ max: 45 }).withMessage("El nombre no puede superar los 45 caracteres"),

  // renovacion: cantidad de meses o años de vigencia
  body("renovacion")
    .notEmpty().withMessage("El campo 'renovación' es obligatorio")
    .isInt({ min: 1 }).withMessage("La renovación debe ser un número entero positivo"),

  // fechaVencimiento: debe tener formato válido de fecha y no estar vacía
  body("fechaVencimiento")
    .notEmpty().withMessage("La fecha de vencimiento es obligatoria")
    .isISO8601().withMessage("Ingrese una fecha válida (YYYY-MM-DD)"),

  // idVehiculo: puede venir vacío, pero si viene debe ser un número entero positivo
  /*body("idVehiculo")
    .optional({ values: "falsy" })
    .isInt({ min: 1 }).withMessage("El idVehiculo debe ser un número entero positivo"),
*/
  // idChofer: igual que idVehiculo, opcional pero válido si viene
  body("idChofer")
    .optional({ values: "falsy" })
    .isInt({ min: 1 }).withMessage("El idChofer debe ser un número entero positivo"),
];

module.exports = validarDocumentacion;
