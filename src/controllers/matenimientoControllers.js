const db = require('../config/db');

// Objeto que exportará todos los métodos del controlador
const mantenimientoController = {};

// ------------------------------------------------------------------
// CREATE (Crear un nuevo mantenimiento)
// POST /api/mantenimientos
// ------------------------------------------------------------------
mantenimientoController.crearMantenimiento = (req, res) => {
    // Extraemos los datos del cuerpo de la solicitud (Request Body)
    const { fecha, observaciones, tipo, idVehiculo } = req.body;
    
    // Consulta SQL para insertar el nuevo registro
    const query = `
        INSERT INTO Mantenimiento (fecha, observaciones, tipo, idVehiculo) 
        VALUES (?, ?, ?, ?)
    `;
    const values = [fecha, observaciones, tipo, idVehiculo];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al crear el mantenimiento:', err);
            // El error 400 es bueno para datos inválidos (ej: idVehiculo inexistente)
            return res.status(400).json({ 
                message: 'Error al crear el mantenimiento', 
                error: err.sqlMessage 
            });
        }
        // Éxito: El ID insertado está en result.insertId
        res.status(201).json({ 
            message: 'Mantenimiento creado exitosamente', 
            idMantenimiento: result.insertId 
        });
    });
};

// ------------------------------------------------------------------
// READ (Obtener todos los mantenimientos)
// GET /api/mantenimientos
// ------------------------------------------------------------------
mantenimientoController.obtenerMantenimientos = (req, res) => {
    // Consulta SQL para seleccionar todos los registros
    const query = `
        SELECT m.*, v.patente 
        FROM Mantenimiento m
        JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
        ORDER BY m.fecha DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener mantenimientos:', err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
        // Éxito: Devuelve la lista de mantenimientos
        res.status(200).json(results);
    });
};

// ------------------------------------------------------------------
// READ (Obtener un mantenimiento por ID)
// GET /api/mantenimientos/:id
// ------------------------------------------------------------------
mantenimientoController.obtenerMantenimientoPorId = (req, res) => {
    const { id } = req.params; // Capturamos el ID desde la URL
    
    const query = `
        SELECT * FROM Mantenimiento 
        WHERE idMantenimiento = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener el mantenimiento:', err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
        
        if (results.length === 0) {
            // El mantenimiento no fue encontrado
            return res.status(404).json({ message: 'Mantenimiento no encontrado' });
        }
        
        // Éxito: Devuelve el primer resultado
        res.status(200).json(results[0]);
    });
};

// ------------------------------------------------------------------
// UPDATE (Actualizar un mantenimiento existente)
// PUT /api/mantenimientos/:id
// ------------------------------------------------------------------
mantenimientoController.actualizarMantenimiento = (req, res) => {
    const { id } = req.params;
    const { fecha, observaciones, tipo, idVehiculo } = req.body;
    
    const query = `
        UPDATE Mantenimiento 
        SET fecha = ?, observaciones = ?, tipo = ?, idVehiculo = ? 
        WHERE idMantenimiento = ?
    `;
    const values = [fecha, observaciones, tipo, idVehiculo, id];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar el mantenimiento:', err);
            return res.status(400).json({ 
                message: 'Error al actualizar el mantenimiento', 
                error: err.sqlMessage 
            });
        }
        
        if (result.affectedRows === 0) {
            // No se actualizó ninguna fila, probablemente el ID no existe
            return res.status(404).json({ message: 'Mantenimiento no encontrado o sin cambios' });
        }

        res.status(200).json({ message: 'Mantenimiento actualizado exitosamente' });
    });
};

// ------------------------------------------------------------------
// DELETE (Eliminar un mantenimiento)
// DELETE /api/mantenimientos/:id
// ------------------------------------------------------------------
mantenimientoController.eliminarMantenimiento = (req, res) => {
    const { id } = req.params;
    
    const query = `
        DELETE FROM Mantenimiento 
        WHERE idMantenimiento = ?
    `;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar el mantenimiento:', err);
            return res.status(500).json({ message: 'Error al eliminar el mantenimiento' });
        }
        
        if (result.affectedRows === 0) {
            // No se eliminó ninguna fila, el ID no existe
            return res.status(404).json({ message: 'Mantenimiento no encontrado' });
        }

        res.status(200).json({ message: 'Mantenimiento eliminado exitosamente' });
    });
};

module.exports = mantenimientoController;