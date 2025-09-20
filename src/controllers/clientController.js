const { validationResult, body } = require("express-validator");
const db = require("../config/db"); // conexión BD

//  Validaciones comunes
const validarCliente = [
  body("codPostal")
    .notEmpty().withMessage("El código postal es obligatorio")
    .isNumeric().withMessage("El código postal debe ser numérico"),

  body("correo")
    .notEmpty().withMessage("El correo es obligatorio")
    .isEmail().withMessage("Debe ingresar un correo electrónico válido"),

  body("razonSocial")
    .notEmpty().withMessage("El nombre o razón social es obligatorio"),

  body("tipo")
    .notEmpty().withMessage("El tipo de cliente es obligatorio")
    .isIn(["Productor", "Empresa"])
    .withMessage("El tipo de cliente debe ser 'Productor' o 'Empresa'"),

  body("idPersona")
    .optional()
    .isNumeric().withMessage("El ID de persona debe ser numérico"),

  body("idLocalidad")
    .optional()
    .isNumeric().withMessage("El ID de localidad debe ser numérico")
];

//  Registrar cliente
const registrarCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const {
        codPostal,
        correo,
        observaciones,
        razonSocial,
        tipo,
        idPersona,
        idLocalidad
    } = req.body;

    // Verificar duplicado
    const [existe] = await db.query("SELECT * FROM Cliente WHERE correo = ?", [
      correo,
    ]);
    if (existe.length > 0) {
      return res
        .status(400)
        .json({ error: "El cliente con este correo ya está registrado" });
    }

    await db.query(
      `INSERT INTO Cliente 
      (codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        codPostal,
        correo,
        observaciones || null,
        razonSocial,
        tipo,
        idPersona || null,
        idLocalidad || null, 
      ]
    );

    res.status(201).json({ mensaje: "Cliente registrado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor al registrar el cliente" });
  }
};

//  Obtener todos los clientes
const obtenerClientes = async (req, res) => {
  try {
    const [clientes] = await db.query("SELECT * FROM Cliente");
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los clientes" });
  }
};

//  Obtener un cliente por ID
const obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [cliente] = await db.query("SELECT * FROM Cliente WHERE idCliente = ?", [
      id,
    ]);

    if (cliente.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(cliente[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cliente" });
  }
};

//  Actualizar cliente
const actualizarCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    const { id } = req.params;
    const {
        codPostal,
        correo,
        observaciones,
        razonSocial,
        tipo,
        idPersona,
        idLocalidad
    } = req.body;

    const [existe] = await db.query("SELECT * FROM Cliente WHERE idCliente = ?", [
      id,
    ]);
    if (existe.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    await db.query(
      `UPDATE Cliente 
       SET codPostal=?, correo=?, observaciones=?, razonSocial=?, tipo=?, idPersona=?, idLocalidad=? 
       WHERE idCliente=?`,
      [ 
        codPostal,
        correo,
        observaciones,
        razonSocial,
        tipo,
        idPersona,
        idLocalidad,
        id
      ]
    );

    res.json({ mensaje: "Cliente actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
};

//  Eliminar cliente
const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const [existe] = await db.query("SELECT * FROM Cliente WHERE idCliente = ?", [
      id,
    ]);
    if (existe.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    await db.query("DELETE FROM Cliente WHERE idCliente = ?", [id]);
    res.json({ mensaje: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el cliente" });
  }
};

module.exports = {
  validarCliente,
  registrarCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
};