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
// READ (Obtener todos los mantenimientos CON FILTRO)
// GET /api/mantenimientos
// ------------------------------------------------------------------
mantenimientoController.obtenerMantenimientos = (req, res) => {
    // 1. Extraigo los parámetros de la URL (query parameters)
    const { idVehiculo, tipo, fechaDesde, fechaHasta } = req.query;

    // 2. Definir la base de la consulta
    let query = `
        SELECT m.*, v.patente 
        FROM Mantenimiento m
        JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
    `;
    let conditions = []; // Array para almacenar las cláusulas WHERE
    let values = [];      // Array para almacenar los valores a sanitizar
    
    // 3. Construir la cláusula WHERE dinámicamente

    // Filtro 1: Por Vehículo (idVehiculo)
    if (idVehiculo) {
        // Le dice a MySQL: donde la columna idVehiculo coincida con el valor que pasaremos
        conditions.push('m.idVehiculo = ?');
        values.push(idVehiculo);
    }
    
    // Filtro 2: Por Tipo de Mantenimiento ('Preventivo' o 'Correctivo')
    if (tipo) {
        conditions.push('m.tipo = ?');
        values.push(tipo);
    }
    
    // Filtro 3: Por Rango de Fecha (Fecha de inicio)
    if (fechaDesde) {
        // m.fecha >= ? : Trae mantenimientos que ocurrieron en o después de esta fecha
        conditions.push('m.fecha >= ?');
        values.push(fechaDesde);
    }
    
    // Filtro 4: Por Rango de Fecha (Fecha de fin)
    if (fechaHasta) {
        // m.fecha <= ? : Trae mantenimientos que ocurrieron en o antes de esta fecha
        conditions.push('m.fecha <= ?');
        values.push(fechaHasta);
    }

    // 4. Agregar la cláusula WHERE a la consulta si hay condiciones
    if (conditions.length > 0) {
        // Si conditions es ['cond1', 'cond2'], se convierte en 'cond1 AND cond2'
        query += ' WHERE ' + conditions.join(' AND ');
    }

    // 5. Agregar la ordenación final (siempre ordenado)
    query += ' ORDER BY m.fecha DESC';

    // 6. Ejecutar la consulta con la sentencia SQL y los valores
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al obtener mantenimientos con filtro:', err);
            return res.status(500).json({ message: 'Error interno del servidor al filtrar' });
        }
        
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