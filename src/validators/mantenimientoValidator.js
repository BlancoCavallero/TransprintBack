const { body } = require("express-validator");
const db = require("../config/db");

const validarMantenimiento = [
  // fechaInicio: obligatoria, debe ser una fecha válida
  body("fechaInicio")
    .notEmpty()
    .withMessage("La fechaInicio es obligatoria")
    .isISO8601()
    .withMessage("Ingrese una fechaInicio válida (YYYY-MM-DD)"),

  // fechaFin: obligatoria, debe ser una fecha válida y >= fechaInicio
  body("fechaFin")
    .notEmpty()
    .withMessage("La fechaFin es obligatoria")
    .isISO8601()
    .withMessage("Ingrese una fechaFin válida (YYYY-MM-DD)")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.fechaInicio)) {
        throw new Error("La fechaFin no puede ser anterior a la fechaInicio");
      }
      return true;
    }),

  // tipo: obligatorio, máximo 45 caracteres
  body("tipo")
    .notEmpty()
    .withMessage("El tipo es obligatorio")
    .isString()
    .withMessage("El tipo debe ser texto")
    .isLength({ max: 45 })
    .withMessage("El tipo no puede superar los 45 caracteres"),

  // idVehiculo: obligatorio, debe ser un entero positivo y existente
  body("idVehiculo")
    .notEmpty()
    .withMessage("El idVehiculo es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El idVehiculo debe ser un número entero positivo")
    .custom(async (value) => {
      const [rows] = await db.query(
        "SELECT * FROM Vehiculo WHERE idVehiculo = ?",
        [value]
      );
      if (rows.length === 0) {
        throw new Error("El idVehiculo ingresado no existe");
      }
      return true;
    }),

  // observaciones: opcional, máximo 255 caracteres
  body("observaciones")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Las observaciones deben ser texto")
    .isLength({ max: 255 })
    .withMessage("Las observaciones no pueden superar los 255 caracteres"),
];

module.exports = validarMantenimiento;
