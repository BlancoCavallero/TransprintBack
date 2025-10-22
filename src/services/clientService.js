const db = require("../config/db");

const obtenerTodos = async () => {
  const [rows] = await db.query("SELECT * FROM Cliente");
  return rows;
};

const obtenerPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM Cliente WHERE idCliente = ?", [id]);
  return rows[0] || null;
};

// --- Obtener clientes por tipo, nombre, razon social o CUIT ---
const obtenerClientesFiltrados = async (valor) => {
  // Verificamos si el valor es un número para buscar por DNI
  const esNumero = /^\d+$/.test(valor);
  //falta filtrar por localidad o provincia
  const [rows] = await db.query(`
    SELECT c.codPostal, c.correo, c.observaciones, c.razonSocial, c.tipo, c.idPersona, c.idLocalidad,
           p.nombre, p.apellido, p.cuit, p.telefono
    FROM Cliente c
    JOIN Persona p ON c.idPersona = p.idPersona
    WHERE
      LOWER(CONVERT(c.tipo USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(p.nombre USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      OR LOWER(CONVERT(c.razonSocial USING utf8mb4)) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(CONVERT(? USING utf8mb4)), '%')
      ${esNumero ? "OR p.cuit = ?" : ""}
  `, esNumero ? [valor, valor, valor, valor] : [valor, valor, valor]);

  return rows;
};

const obtenerPorCorreo = async (correo) => {
  const [rows] = await db.query("SELECT * FROM Cliente WHERE correo = ?", [correo]);
  return rows[0] || null;
};

const crearCliente = async (cliente) => {
  
  const { codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad } = cliente;

  //verifico que el idPersona no esté usado en otro cliente
  const [existe] = await db.query(
    "SELECT * FROM Cliente WHERE idPersona = ?",
    [idPersona]
  );
  if (existe.length > 0) {
    throw new Error("Ya existe un cliente registrado con ese idPersona");
  } 

  //verifico que la persona ya esté registrada
  const [existePersona] = await db.query(
    "SELECT * FROM Persona WHERE idPersona = ?",
    [idPersona]
  );
  if (existePersona.length == 0) {
    throw new Error("El idPersona ingresado no existe ");
  }
  
  const [result] = await db.query(
    "INSERT INTO Cliente (codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [codPostal, correo, observaciones || null, razonSocial, tipo, idPersona, idLocalidad || null]
  );

  return { idCliente: result.insertId, codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad};
};

const actualizarCliente = async (id, cliente) => {
  const { codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad } = cliente;
  //Verifico que el cliente exista
  const [clienteExistente] = await db.query(
    "SELECT * FROM Cliente WHERE idCliente = ?",
    [idCliente]
  );
  if (clienteExistente.length === 0) {
    throw new Error("El cliente no existe");
  }

  //verifico que no se repita el dni
  const [existeDni] = await db.query(
    "SELECT * FROM Cliente WHERE dni = ?  AND idCliente != ?",
    [dni, idCliente]
  );
  if (existeDni.length > 0) {
    throw new Error("Ya existe un cliente registrado con ese DNI");
  } 

  //verifico que el idPersona no esté usado en otro cliente
  const [existe] = await db.query(
    "SELECT * FROM Cliente WHERE idPersona = ?",
    [idPersona]
  );
  if (existe.length > 0) {
    throw new Error("Ya existe un cliente registrado con ese idPersona");
  } 

   //verifico que la persona ya esté registrada
  const [existePersona] = await db.query(
    "SELECT * FROM Persona WHERE idPersona = ?",
    [idPersona]
  );
  if (existePersona.length === 0) {
    throw new Error("El idPersona ingresado no existe ");
  }

  await db.query(
    "UPDATE Cliente SET codPostal = ?, correo = ?, observaciones = ?, razonSocial = ?, tipo = ?, idPersona = ?, idLocalidad = ? WHERE idCliente = ?",
    [codPostal, correo, observaciones, razonSocial, tipo, idPersona, idLocalidad, id]
  );

  return { idCliente, actualizado: true };
};

const eliminarCliente = async (id) => {
  return db.query("DELETE FROM Cliente WHERE idCliente = ?", [id]);
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerClientesFiltrados,
  obtenerPorCorreo,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
