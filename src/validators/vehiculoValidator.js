const { body } = require("express-validator");
const db = require("../config/db");

// Normaliza y valida campos según la tabla actual (sin seguro/vtv)
const validarCreacionVehiculo = [
  body("patente")
    .notEmpty().withMessage("La patente es obligatoria")
    .isLength({ min: 3, max: 10 }).withMessage("La patente debe tener entre 3 y 10 caracteres")
    .custom(async (patente) => {
      // Verifica duplicado en DB
      const [rows] = await db.query("SELECT idVehiculo FROM Vehiculo WHERE patente = ?", [patente]);
      if (rows.length > 0) {
        throw new Error("Ya existe un vehículo con esa patente");
      }
      return true;
    }),
  body("marca").notEmpty().withMessage("La marca es obligatoria"),
  body("modelo").notEmpty().withMessage("El modelo es obligatorio"),
  body("estado")
    .notEmpty().withMessage("El estado es obligatorio")
    .bail()
    .isString().withMessage("Estado inválido")
    .trim()
    .toLowerCase()
    .isIn(["activo", "inactivo", "mantenimiento"]).withMessage("El estado no es válido"),
  body("anio")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("El año debe ser un número válido"),
  body("tipo").optional().isString(),
];

const validarActualizacionVehiculo = [
  body("patente")
    .optional()
    .isLength({ min: 3, max: 10 }).withMessage("La patente debe tener entre 3 y 10 caracteres")
    .custom(async (patente, { req }) => {
      // Si se envía patente en update, y es distinta de la actual, comprobar duplicado
      const id = req.params.id;
      const [rows] = await db.query("SELECT idVehiculo FROM Vehiculo WHERE patente = ? AND idVehiculo <> ?", [patente, id]);
      if (rows.length > 0) {
        throw new Error("Otra entrada ya usa esa patente");
      }
      return true;
    }),
  body("marca").optional().isString(),
  body("modelo").optional().isString(),
  body("estado")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["activo", "inactivo", "mantenimiento"]).withMessage("El estado no es válido"),
  body("anio")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("El año debe ser un número válido"),
  body("tipo").optional().isString(),
];

module.exports = {
  validarCreacionVehiculo,
  validarActualizacionVehiculo,
};
