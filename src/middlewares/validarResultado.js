const { validationResult } = require("express-validator");

const validarResultado = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mensajes = errors.array({ onlyFirstError: true }).map(err => err.msg); //Devuelve un solo error por campo, si hay varios campos con error devuelve uno por cada campo
    return res.status(400).json({ success: false, message: mensajes[0] }); //succes indica rapidamente si la operación se ejecutó correctamente.
  }
  next();
};

module.exports = validarResultado;
