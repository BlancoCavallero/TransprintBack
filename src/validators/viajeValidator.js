const { body } = require("express-validator");

const esFechaFutura = (fechaStr) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fecha = new Date(fechaStr);
  fecha.setHours(0, 0, 0, 0);

  return fecha > hoy;
};

const esFechaPasadaOHoy = (fechaStr) => !esFechaFutura(fechaStr);

const crearViajeValidator = [
  body("fechaInicio")
    .notEmpty()
    .withMessage("La fechaInicio es obligatoria")
    .isISO8601()
    .withMessage("La fechaInicio debe tener formato válido (YYYY-MM-DD)"),

  body("fechaFin")
    .notEmpty()
    .withMessage("La fechaFin es obligatoria")
    .isISO8601()
    .withMessage("La fechaFin debe tener formato válido (YYYY-MM-DD)")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.fechaInicio)) {
        throw new Error("La fechaFin no puede ser anterior a la fechaInicio");
      }
      return true;
    }),

  body("estado")
    .optional()
    .isIn(["INICIADO", "EN CURSO", "FINALIZADO", "CANCELADO"])
    .withMessage(
      "Estado inválido. Valores permitidos: INICIADO, EN CURSO, FINALIZADO, CANCELADO"
    ),

  body("precio")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser mayor a 0"),

  body("kilometros")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Los kilómetros deben ser un número válido"),

  body("idCliente")
    .notEmpty()
    .withMessage("El cliente es obligatorio")
    .isInt()
    .withMessage("El idCliente debe ser numérico"),

  body("idChoferVehiculo")
    .notEmpty()
    .withMessage("La relación Chofer-Vehículo es obligatoria")
    .isInt()
    .withMessage("El idChoferVehiculo debe ser numérico"),

  body("idLocalidadOrigen")
    .notEmpty()
    .withMessage("La localidad de origen es obligatoria")
    .isInt()
    .withMessage("idLocalidadOrigen debe ser numérico"),

  body("idLocalidadDestino")
    .notEmpty()
    .withMessage("La localidad de destino es obligatoria")
    .isInt()
    .withMessage("idLocalidadDestino debe ser numérico"),
];

const actualizarViajeValidator = [
  body("fechaInicio")
    .optional()
    .isISO8601()
    .withMessage("La fechaInicio debe tener un formato válido (YYYY-MM-DD)"),

  body("fechaFin")
    .optional()
    .isISO8601()
    .withMessage("La fechaFin debe tener un formato válido (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const fechaInicio = req.body.fechaInicio || req.existingViajeInicio;
      if (value && fechaInicio && new Date(value) < new Date(fechaInicio)) {
        throw new Error("La fechaFin no puede ser anterior a la fechaInicio");
      }
      return true;
    }),

  body("estado")
    .optional()
    .isIn(["INICIADO", "EN CURSO", "FINALIZADO", "CANCELADO"])
    .withMessage("Estado inválido"),

  body("precio")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser mayor a 0"),

  body("kilometros")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Los kilómetros deben ser válidos"),
];

module.exports = {
  crearViajeValidator,
  actualizarViajeValidator,
};
