const { body } = require("express-validator");

// Mapeo de documentos a tipoEntidad por defecto
const DOCUMENTO_TIPO_ENTIDAD = {
  CARNET: "CHOFER",
  "APTO FISICO": "CHOFER",
  VTV: "VEHICULO",
  SEGURO: "VEHICULO",
};

const validarDocumentacion = [
  // detalle: la URL o ruta del archivo
  body("detalle")
    .notEmpty()
    .withMessage("El detalle es obligatorio")
    .isString()
    .withMessage("El detalle debe ser texto")
    .isLength({ max: 100 })
    .withMessage("El detalle no puede superar los 100 caracteres"),

  // nombre: nombre del tipo de documentación (Carnet, Seguro, etc.)
  body("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isString()
    .withMessage("El nombre debe estar en formato texto")
    .isLength({ max: 45 })
    .withMessage("El nombre no puede superar los 45 caracteres"),

  // tipoEntidad: ENUM que define si pertenece a CHOFER o VEHICULO
  body("tipoEntidad")
    .notEmpty()
    .withMessage("El tipoEntidad es obligatorio")
    .isIn(["CHOFER", "VEHICULO"])
    .withMessage("El tipoEntidad debe ser CHOFER o VEHICULO"),

  // renovacion: cantidad de meses o años de vigencia
  body("renovacion")
    .notEmpty()
    .withMessage("El campo 'renovación' es obligatorio")
    .isInt({ min: 1 })
    .withMessage("La renovación debe ser un número entero positivo"),

  // fechaVencimiento: debe tener formato válido de fecha y no estar vacía
  body("fechaVencimiento")
    .notEmpty()
    .withMessage("La fecha de vencimiento es obligatoria")
    .isISO8601()
    .withMessage("Ingrese una fecha válida (YYYY-MM-DD)"),

  // idVehiculo: requerido si tipoEntidad es VEHICULO
  body("idVehiculo").custom((value, { req }) => {
    if (req.body.tipoEntidad === "VEHICULO") {
      if (!value) {
        throw new Error(
          "El idVehiculo es obligatorio cuando tipoEntidad es VEHICULO"
        );
      }
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error("El idVehiculo debe ser un número entero positivo");
      }
    }
    return true;
  }),

  // idChofer: requerido si tipoEntidad es CHOFER
  body("idChofer").custom((value, { req }) => {
    if (req.body.tipoEntidad === "CHOFER") {
      if (!value) {
        throw new Error(
          "El idChofer es obligatorio cuando tipoEntidad es CHOFER"
        );
      }
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error("El idChofer debe ser un número entero positivo");
      }
    }
    return true;
  }),
];

module.exports = { validarDocumentacion, DOCUMENTO_TIPO_ENTIDAD };
