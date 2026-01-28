// src/services/dashboardService.js
const db = require('../../config/db');  // Conexión a MySQL

const obtenerDatosDashboard = async () => {
    try {
        // Hacemos TODAS las consultas a la vez (más rápido)
        const [
        totalClientes,
        vehiculosPorEstado,
        choferesPorEstado,
        viajesEnCurso,
        alertas
        ] = await Promise.all([
        obtenerTotalClientes(),
        obtenerVehiculosPorEstado(),
        obtenerChoferesPorEstado(),
        obtenerViajesEnCurso(),
        obtenerAlertas()
        ]);

        // Devolvemos TODO organizado
        return {
        totalClientes,
        totalVehiculos: vehiculosPorEstado,
        totalChoferes: choferesPorEstado,
        viajesEnCurso,
        alertas
        };
    } catch (error) {
        // Si algo falla, lanzamos error
        throw new Error(`Error calculando dashboard: ${error.message}`);
    }
};

// ========== FUNCIONES AUXILIARES ==========

// 1. Cuántos clientes hay en total
const obtenerTotalClientes = async () => {
    const [result] = await db.query("SELECT COUNT(*) as total FROM Cliente");
  return result[0].total;  // Ejemplo: 150
};

// 2. Vehículos por cada estado
const obtenerVehiculosPorEstado = async () => {
    const [rows] = await db.query(`
        SELECT 
        -- Contamos todos los vehículos (excepto BAJA)
        COUNT(*) as total,
        
        -- Contamos CUÁNTOS hay de CADA estado
        SUM(CASE WHEN estado = 'INHABILITADO' THEN 1 ELSE 0 END) as inhabilitados,
        SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estado = 'EN_MANTENIMIENTO' THEN 1 ELSE 0 END) as enMantenimiento,
        SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
        SUM(CASE WHEN estado = 'BAJA' THEN 1 ELSE 0 END) as bajas,
        
        -- Calculamos "activos" = todos menos INACTIVO y BAJA
        SUM(CASE WHEN estado NOT IN ('INACTIVO', 'BAJA') THEN 1 ELSE 0 END) as activos,
        
        -- Vehículos DISPONIBLES que están EN VIAJE ahora
        (SELECT COUNT(DISTINCT v.idVehiculo) 
        FROM Vehiculo v
        INNER JOIN Viaje vi ON v.idVehiculo = vi.idVehiculo
        WHERE v.estado = 'DISPONIBLE' 
            AND vi.estado IN ('EN_CURSO', 'EN_PROCESO')
        ) as enUso
        
        FROM Vehiculo
        WHERE estado != 'BAJA'  -- No contar los dados de baja
    `);
    
    return rows[0];
};

// 3. Choferes por cada estado  
const obtenerChoferesPorEstado = async () => {
    const [rows] = await db.query(`
        SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estado = 'OCUPADO' THEN 1 ELSE 0 END) as ocupados,
        SUM(CASE WHEN estado = 'VACACIONES' THEN 1 ELSE 0 END) as vacaciones,
        SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
        -- Calculamos "activos" = todos menos INACTIVO
        SUM(CASE WHEN estado != 'INACTIVO' THEN 1 ELSE 0 END) as activos
        FROM Chofer
    `);
    return rows[0];
};

// 4. Viajes que están PASANDO AHORA
const obtenerViajesEnCurso = async () => {
    const [result] = await db.query(`
        SELECT COUNT(*) as total FROM Viaje 
        WHERE estado = 'EN_CURSO' OR estado = 'EN_PROCESO' OR estado = 'INICIADO'
    `);
    return result[0].total;
};

// 5. ALERTAS importantes (cosas que necesitan atención)
const obtenerAlertas = async () => {
  // a) Choferes con licencia VENCIDA
    const [licencias] = await db.query(`
        SELECT COUNT(*) as total FROM Documentacion 
        WHERE tipo = 'CHOFER' 
            AND tipoDocumento = 'LICENCIA'
            AND fechaVencimiento < CURDATE()  -- Ya pasó la fecha
        AND activa = true                 -- Solo la licencia actual
    `);

  // b) Mantenimientos PROGRAMADOS para los próximos 7 días
    const [mantenimientos] = await db.query(`
        SELECT COUNT(*) as total FROM Mantenimiento 
        WHERE fechaInicio BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND tipo = 'Preventivo'
    `);

  // c) Vehículos que pronto quedarán INHABILITADOS
    const [documentosProximos] = await db.query(`
        SELECT COUNT(DISTINCT d.idVehiculo) as total 
        FROM Documentacion d
        INNER JOIN Vehiculo v ON d.idVehiculo = v.idVehiculo
        WHERE d.tipo = 'VEHICULO'
            AND d.activa = true
            AND d.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND v.estado != 'INHABILITADO'
            AND v.estado != 'BAJA'
    `);

    return {
        licenciasVencidas: licencias[0].total,
        mantenimientosProgramados: mantenimientos[0].total,
        vehiculosProximosInhabilitar: documentosProximos[0].total
    };
};

// Exportamos SOLO la función principal
module.exports = {
    obtenerDatosDashboard
};