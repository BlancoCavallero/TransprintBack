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
  body("fecha")
    .notEmpty()
    .withMessage("La fecha es obligatoria")
    .isISO8601()
    .withMessage("La fecha debe tener formato válido (YYYY-MM-DD)"),

  body("estado")
    .notEmpty()
    .withMessage("El estado es obligatorio")
    .isIn(["Pendiente", "Activo", "Finalizado", "Cancelado"])
    .withMessage("Estado inválido")
    .custom((estado, { req }) => {
      const fecha = req.body.fecha;
      if (!fecha) return true;

      // Estado pendiente SOLO si la fecha es futura
      if (estado === "Pendiente" && esFechaPasadaOHoy(fecha)) {
        throw new Error(
          "Un viaje con fecha pasada o de hoy no puede estar 'Pendiente'."
        );
      }

      // Estado activo SOLO si la fecha es hoy o pasada
      if (estado === "Activo" && esFechaFutura(fecha)) {
        throw new Error(
          "Un viaje con fecha futura no puede estar 'Activo'. Debe estar 'Pendiente'."
        );
      }

      return true;
    }),

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
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe tener un formato válido"),

  body("estado")
    .optional()
    .isIn(["Pendiente", "Activo", "Finalizado", "Cancelado"])
    .withMessage("Estado inválido")
    .custom((estado, { req }) => {
      const fecha = req.body.fecha || req.existingViajeFecha;
      if (!fecha || !estado) return true;

      if (estado === "Pendiente" && esFechaPasadaOHoy(fecha)) {
        throw new Error(
          "Un viaje con fecha pasada o de hoy no puede estar 'pendiente'."
        );
      }

      if (estado === "Activo" && esFechaFutura(fecha)) {
        throw new Error("Un viaje con fecha futura no puede estar 'activo'.");
      }

      return true;
    }),

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
