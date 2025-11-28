const db = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");

// Objeto que exportará todos los métodos del controlador
const mantenimientoController = {};

// ------------------------------------------------------------------
// CREATE (Crear un nuevo mantenimiento)
// POST /api/mantenimientos
// ------------------------------------------------------------------
mantenimientoController.crearMantenimiento = async (req, res) => {
  // Extraemos los datos del cuerpo de la solicitud (Request Body)
  const { fecha, observaciones, tipo, idVehiculo } = req.body;

  // Consulta SQL para insertar el nuevo registro
  const query = `
        INSERT INTO Mantenimiento (fecha, observaciones, tipo, idVehiculo) 
        VALUES (?, ?, ?, ?)
    `;
  const values = [fecha, observaciones, tipo, idVehiculo];

  try {
    const [result] = await db.query(query, values);
    const [rows] = await db.query(
      `
                SELECT m.*, v.idVehiculo AS vehiculoId, v.patente AS vehiculoPatente, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.tipo AS vehiculoTipo
                FROM Mantenimiento m
                LEFT JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
                WHERE m.idMantenimiento = ?
            `,
      [result.insertId]
    );
    const created = rows[0];
    const payload = {
      idMantenimiento: created.idMantenimiento,
      fecha: created.fecha,
      observaciones: created.observaciones,
      tipo: created.tipo,
      vehiculo: created.vehiculoId
        ? {
            idVehiculo: created.vehiculoId,
            patente: created.vehiculoPatente,
            marca: created.vehiculoMarca,
            modelo: created.vehiculoModelo,
            tipo: created.vehiculoTipo,
          }
        : null,
    };
    successResponse(res, payload, "Mantenimiento creado exitosamente");
  } catch (err) {
    console.error("Error al crear el mantenimiento:", err);
    return res
      .status(400)
      .json({
        message: "Error al crear el mantenimiento",
        error: err.sqlMessage || err.message,
      });
  }
};

// ------------------------------------------------------------------
// READ (Obtener todos los mantenimientos)
// GET /api/mantenimientos
// ------------------------------------------------------------------
mantenimientoController.obtenerMantenimientos = async (req, res) => {
  // Consulta SQL para seleccionar todos los registros
  const query = `
        SELECT m.*, v.idVehiculo AS vehiculoId, v.patente AS vehiculoPatente, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.tipo AS vehiculoTipo
        FROM Mantenimiento m
        LEFT JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
        ORDER BY m.fecha DESC
    `;

  try {
    const [results] = await db.query(query);
    const mapped = results.map((r) => ({
      idMantenimiento: r.idMantenimiento,
      fecha: r.fecha,
      observaciones: r.observaciones,
      tipo: r.tipo,
      vehiculo: r.vehiculoId
        ? {
            idVehiculo: r.vehiculoId,
            patente: r.vehiculoPatente,
            marca: r.vehiculoMarca,
            modelo: r.vehiculoModelo,
            tipo: r.vehiculoTipo,
          }
        : null,
    }));
    successResponse(res, mapped);
  } catch (err) {
    console.error("Error al obtener mantenimientos:", err);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: err.message });
  }
};

// ------------------------------------------------------------------
// READ (Obtener un mantenimiento por ID)
// GET /api/mantenimientos/:id
// ------------------------------------------------------------------
mantenimientoController.obtenerMantenimientoPorId = async (req, res) => {
  const { id } = req.params; // Capturamos el ID desde la URL

  const query = `
        SELECT m.*, v.idVehiculo AS vehiculoId, v.patente AS vehiculoPatente, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.tipo AS vehiculoTipo
        FROM Mantenimiento m
        LEFT JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
        WHERE idMantenimiento = ?
    `;

  try {
    const [results] = await db.query(query, [id]);
    if (results.length === 0)
      return errorResponse(res, "Mantenimiento no encontrado", 404);
    const r = results[0];
    const payload = {
      idMantenimiento: r.idMantenimiento,
      fecha: r.fecha,
      observaciones: r.observaciones,
      tipo: r.tipo,
      vehiculo: r.vehiculoId
        ? {
            idVehiculo: r.vehiculoId,
            patente: r.vehiculoPatente,
            marca: r.vehiculoMarca,
            modelo: r.vehiculoModelo,
            tipo: r.vehiculoTipo,
          }
        : null,
    };
    successResponse(res, payload);
  } catch (err) {
    console.error("Error al obtener el mantenimiento:", err);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: err.message });
  }
};

// ------------------------------------------------------------------
// UPDATE (Actualizar un mantenimiento existente)
// PUT /api/mantenimientos/:id
// ------------------------------------------------------------------
mantenimientoController.actualizarMantenimiento = async (req, res) => {
  const { id } = req.params;
  const { fecha, observaciones, tipo, idVehiculo } = req.body;

  const query = `
        UPDATE Mantenimiento 
        SET fecha = ?, observaciones = ?, tipo = ?, idVehiculo = ? 
        WHERE idMantenimiento = ?
    `;
  const values = [fecha, observaciones, tipo, idVehiculo, id];

  try {
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0)
      return errorResponse(
        res,
        "Mantenimiento no encontrado o sin cambios",
        404
      );
    const [rows] = await db.query(
      `
                SELECT m.*, v.idVehiculo AS vehiculoId, v.patente AS vehiculoPatente, v.marca AS vehiculoMarca, v.modelo AS vehiculoModelo, v.tipo AS vehiculoTipo
                FROM Mantenimiento m
                LEFT JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
                WHERE m.idMantenimiento = ?
            `,
      [id]
    );
    const r = rows[0];
    const payload = {
      idMantenimiento: r.idMantenimiento,
      fecha: r.fecha,
      observaciones: r.observaciones,
      tipo: r.tipo,
      vehiculo: r.vehiculoId
        ? {
            idVehiculo: r.vehiculoId,
            patente: r.vehiculoPatente,
            marca: r.vehiculoMarca,
            modelo: r.vehiculoModelo,
            tipo: r.vehiculoTipo,
          }
        : null,
    };
    successResponse(res, payload, "Mantenimiento actualizado exitosamente");
  } catch (err) {
    console.error("Error al actualizar el mantenimiento:", err);
    return res
      .status(400)
      .json({
        message: "Error al actualizar el mantenimiento",
        error: err.sqlMessage || err.message,
      });
  }
};

// ------------------------------------------------------------------
// DELETE (Eliminar un mantenimiento)
// DELETE /api/mantenimientos/:id
// ------------------------------------------------------------------
mantenimientoController.eliminarMantenimiento = async (req, res) => {
  const { id } = req.params;

  const query = `
        DELETE FROM Mantenimiento 
        WHERE idMantenimiento = ?
    `;

  try {
    const [result] = await db.query(query, [id]);
    if (result.affectedRows === 0)
      return errorResponse(res, "Mantenimiento no encontrado", 404);
    successResponse(res, null, "Mantenimiento eliminado exitosamente");
  } catch (err) {
    console.error("Error al eliminar el mantenimiento:", err);
    return res
      .status(500)
      .json({
        message: "Error al eliminar el mantenimiento",
        error: err.message,
      });
  }
};

module.exports = mantenimientoController;
