// src/services/dashboardService.js
const db = require('../config/db');

const obtenerDatosDashboard = async () => {
    try {
        console.log('Obteniendo datos del dashboard...');
        
        const datos = {
            totalClientes: 0,
            totalVehiculos: {
                total: 0,
                habilitados: 0,
                inhabilitados: 0,
                ocupados: 0,
                enMantenimiento: 0,
            },
            totalChoferes: {
                total: 0,
                habilitados: 0,
                inhabilitados: 0,
                ocupados: 0,
            },
            viajesEnCurso: 0,
            mantenimientosInfo: {
                enCurso: 0,
                pendientes: 0,
                finalizados: 0,
                total: 0
            },
            alertas: {
                licenciasVencidas: 0,
                documentacionVehiculosPorVencer: 0
            }
        };

        // Obtener datos secuencialmente para mejor control
        try {
            datos.totalClientes = await obtenerTotalClientes();
        } catch (error) {
            console.warn('Error en clientes:', error.message);
        }

        try {
            datos.totalVehiculos = await obtenerVehiculosPorEstado();
        } catch (error) {
            console.warn('Error en vehiculos:', error.message);
        }

        try {
            datos.totalChoferes = await obtenerChoferesPorEstado();
        } catch (error) {
            console.warn('Error en choferes:', error.message);
        }

        try {
            datos.viajesEnCurso = await obtenerViajesEnCurso();
        } catch (error) {
            console.warn('Error en viajes:', error.message);
        }

        try {
            datos.mantenimientosInfo = await obtenerMantenimientosInfo();
        } catch (error) {
            console.warn('Error en mantenimientos:', error.message);
        }

        try {
            datos.alertas = await obtenerAlertas();
        } catch (error) {
            console.warn('Error en alertas:', error.message);
        }

        console.log('Dashboard calculado exitosamente');
        return datos;
        
    } catch (error) {
        console.error('Error critico en dashboard:', error.message);
        // Devolver estructura basica con ceros
        return {
            totalClientes: 0,
            totalVehiculos: { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0, enMantenimiento: 0 },
            totalChoferes: { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 },
            viajesEnCurso: 0,
            mantenimientosInfo: { enCurso: 0, pendientes: 0, finalizados: 0, total: 0 },
            alertas: { licenciasVencidas: 0, documentacionVehiculosPorVencer: 0 }
        };
    }
};

// ========== FUNCIONES AUXILIARES ==========

// 1. Total de clientes
const obtenerTotalClientes = async () => {
    try {
        const [result] = await db.query("SELECT COUNT(*) as total FROM Cliente");
        return result[0]?.total || 0;
    } catch (error) {
        console.warn('Error en obtenerTotalClientes:', error.message);
        return 0;
    }
};

// 2. Vehiculos por estado (HABILITADO, INHABILITADO, OCUPADO)
const obtenerVehiculosPorEstado = async () => {
    try {
        // Consulta para vehiculos por estado
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'HABILITADO' THEN 1 ELSE 0 END) as habilitados,
                SUM(CASE WHEN estado = 'INHABILITADO' THEN 1 ELSE 0 END) as inhabilitados,
                SUM(CASE WHEN estado = 'OCUPADO' THEN 1 ELSE 0 END) as ocupados
            FROM Vehiculo
            WHERE estado IS NOT NULL
        `);
        
        const data = rows[0] || { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 };
        
        // Vehiculos en mantenimiento (de la tabla Mantenimiento)
        let enMantenimiento = 0;
        try {
            const [mantenimientos] = await db.query(`
                SELECT COUNT(DISTINCT m.idVehiculo) as total
                FROM Mantenimiento m
                INNER JOIN Vehiculo v ON m.idVehiculo = v.idVehiculo
                WHERE (m.fechaFin IS NULL OR m.fechaFin >= CURDATE())
                    AND m.fechaInicio <= CURDATE()
                    AND v.estado != 'INHABILITADO'
            `);
            enMantenimiento = mantenimientos[0]?.total || 0;
        } catch (error) {
            console.warn('Error calculando vehiculos en mantenimiento:', error.message);
        }
        
        return {
            total: data.total || 0,
            habilitados: data.habilitados || 0,
            inhabilitados: data.inhabilitados || 0,
            ocupados: data.ocupados || 0,
            enMantenimiento: enMantenimiento
        };
    } catch (error) {
        console.warn('Error en obtenerVehiculosPorEstado:', error.message);
        return {
            total: 0,
            habilitados: 0,
            inhabilitados: 0,
            ocupados: 0,
            enMantenimiento: 0
        };
    }
};

// 3. Choferes por estado (HABILITADO, INHABILITADO, OCUPADO)
const obtenerChoferesPorEstado = async () => {
    try {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'HABILITADO' THEN 1 ELSE 0 END) as habilitados,
                SUM(CASE WHEN estado = 'INHABILITADO' THEN 1 ELSE 0 END) as inhabilitados,
                SUM(CASE WHEN estado = 'OCUPADO' THEN 1 ELSE 0 END) as ocupados
            FROM Chofer
            WHERE estado IS NOT NULL
        `);
        
        const data = rows[0] || { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 };
        
        return {
            total: data.total || 0,
            habilitados: data.habilitados || 0,
            inhabilitados: data.inhabilitados || 0,
            ocupados: data.ocupados || 0
        };
    } catch (error) {
        console.warn('Error en obtenerChoferesPorEstado:', error.message);
        return {
            total: 0,
            habilitados: 0,
            inhabilitados: 0,
            ocupados: 0
        };
    }
};

// 4. Viajes en curso
const obtenerViajesEnCurso = async () => {
    try {
        const [result] = await db.query(`
            SELECT COUNT(*) as total FROM Viaje 
            WHERE estado = 'INICIADO' OR estado LIKE '%CURSO%' OR estado LIKE '%PROCESO%'
        `);
        return result[0]?.total || 0;
    } catch (error) {
        console.warn('Error en obtenerViajesEnCurso:', error.message);
        return 0;
    }
};

// 5. Mantenimientos (EN_CURSO, PENDIENTES, FINALIZADOS)
const obtenerMantenimientosInfo = async () => {
    try {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                
                -- Mantenimientos EN CURSO (entre fechaInicio y fechaFin, o solo fechaInicio si no hay fechaFin)
                SUM(CASE 
                    WHEN fechaInicio <= CURDATE() 
                    AND (fechaFin IS NULL OR fechaFin >= CURDATE())
                    THEN 1 ELSE 0 
                END) as enCurso,
                
                -- Mantenimientos PENDIENTES (fechaInicio > hoy)
                SUM(CASE 
                    WHEN fechaInicio > CURDATE() 
                    THEN 1 ELSE 0 
                END) as pendientes,
                
                -- Mantenimientos FINALIZADOS (fechaFin < hoy)
                SUM(CASE 
                    WHEN fechaFin < CURDATE() 
                    THEN 1 ELSE 0 
                END) as finalizados
                
            FROM Mantenimiento
        `);
        
        const data = rows[0] || { total: 0, enCurso: 0, pendientes: 0, finalizados: 0 };
        
        return {
            enCurso: data.enCurso || 0,
            pendientes: data.pendientes || 0,
            finalizados: data.finalizados || 0,
            total: data.total || 0
        };
    } catch (error) {
        console.warn('Error en obtenerMantenimientosInfo:', error.message);
        return {
            enCurso: 0,
            pendientes: 0,
            finalizados: 0,
            total: 0
        };
    }
};

// 6. Alertas del sistema
const obtenerAlertas = async () => {
    try {
        let licenciasVencidas = 0;
        let documentacionVehiculosPorVencer = 0;
        
        // A. Choferes con licencia VENCIDA
        try {
            const [licencias] = await db.query(`
                SELECT COUNT(*) as total FROM Documentacion 
                WHERE tipoDocumento = 'LICENCIA'
                    AND fechaVencimiento < CURDATE()
                    AND activa = true
            `);
            licenciasVencidas = licencias[0]?.total || 0;
        } catch (error) {
            console.warn('Error verificando licencias vencidas:', error.message);
        }
        
        // B. Documentacion de vehiculos por vencer (proximos 30 dias)
        try {
            const [documentos] = await db.query(`
                SELECT COUNT(DISTINCT d.idVehiculo) as total 
                FROM Documentacion d
                INNER JOIN Vehiculo v ON d.idVehiculo = v.idVehiculo
                WHERE d.tipoDocumento IN ('VTV', 'SEGURO', 'CERTIFICADO')
                    AND d.activa = true
                    AND d.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                    AND v.estado = 'HABILITADO'
            `);
            documentacionVehiculosPorVencer = documentos[0]?.total || 0;
        } catch (error) {
            console.warn('Error verificando documentacion por vencer:', error.message);
        }
        
        return {
            licenciasVencidas,
            documentacionVehiculosPorVencer
        };
    } catch (error) {
        console.warn('Error en obtenerAlertas:', error.message);
        return {
            licenciasVencidas: 0,
            documentacionVehiculosPorVencer: 0
        };
    }
};

module.exports = {
    obtenerDatosDashboard
};