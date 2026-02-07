const { body } = require("express-validator");
const db = require("../config/db");

// Normaliza y valida campos según la tabla actual (sin seguro/vtv)
const validarCreacionAcoplado = [
  body("patente")
    .notEmpty().withMessage("La patente es obligatoria")
    .isLength({ min: 3, max: 10 }).withMessage("La patente debe tener entre 3 y 10 caracteres")
    .custom(async (patente) => {
      // Verifica duplicado en DB
      const [rows] = await db.query("SELECT idAcoplado FROM Acoplado WHERE patente = ?", [patente]);
      if (rows.length > 0) {
        throw new Error("Ya existe un acoplado con esa patente");
      }
      return true;
    }),
  body("marca").notEmpty().withMessage("La marca es obligatoria"),
  body("modelo").notEmpty().withMessage("El modelo es obligatorio"),
  body("estado")
    .optional()
    .custom(() => {
      throw new Error("El estado no puede registrarse manualmente")
    }),
  body("tipo").optional().isString(),
];

const validarActualizacionAcoplado = [
  body("patente")
    .optional()
    .isLength({ min: 3, max: 10 }).withMessage("La patente debe tener entre 3 y 10 caracteres")
    .custom(async (patente, { req }) => {
      // Si se envía patente en update, y es distinta de la actual, comprobar duplicado
      const id = req.params.id;
      const [rows] = await db.query("SELECT idAcoplado FROM Acoplado WHERE patente = ? AND idAcoplado <> ?", [patente, id]);
      if (rows.length > 0) {
        throw new Error("Otra entrada ya usa esa patente");
      }
      return true;
    }),
  body("marca").optional().isString(),
  body("modelo").optional().isString(),
  body("estado")
    .optional()
    .custom(() => {
      throw new Error("El estado no puede modificarse manualmente")
    }),
  body("tipo").optional().isString(),
];

module.exports = {
  validarCreacionAcoplado,
  validarActualizacionAcoplado,
};
