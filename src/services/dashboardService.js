// src/services/dashboardService.js - VERSIÓN UNIVERSAL
const db = require('../config/db');

const obtenerDatosDashboard = async () => {
    try {
        console.log('📊 Obteniendo datos del dashboard...');
        
        const datos = {
            totalClientes: 0,
            totalVehiculos: {
                total: 0,
                habilitados: 0,
                inhabilitados: 0,
                ocupados: 0,
                enViajeActual: 0,
                disponibles: 0
            },
            totalChoferes: {
                total: 0,
                habilitados: 0,
                inhabilitados: 0,
                ocupados: 0,
                disponibles: 0
            },
            viajesEnCurso: 0,
            mantenimientosInfo: {
                enCurso: 0,
                programados: 0,
                finalizados: 0,
                total: 0
            },
            alertas: {
                licenciasVencidas: 0,
                documentacionVehiculosPorVencer: 0
            }
        };

        // Obtener datos SECUENCIALMENTE para mejor control
        try {
            datos.totalClientes = await obtenerTotalClientes();
        } catch (error) {
            console.warn('⚠️ Error en clientes:', error.message);
        }

        try {
            datos.totalVehiculos = await obtenerVehiculosPorEstado();
        } catch (error) {
            console.warn('⚠️ Error en vehículos:', error.message);
        }

        try {
            datos.totalChoferes = await obtenerChoferesPorEstado();
        } catch (error) {
            console.warn('⚠️ Error en choferes:', error.message);
        }

        try {
            datos.viajesEnCurso = await obtenerViajesEnCurso();
        } catch (error) {
            console.warn('⚠️ Error en viajes:', error.message);
        }

        try {
            datos.mantenimientosInfo = await obtenerMantenimientosInfo();
        } catch (error) {
            console.warn('⚠️ Error en mantenimientos:', error.message);
        }

        try {
            datos.alertas = await obtenerAlertas();
        } catch (error) {
            console.warn('⚠️ Error en alertas:', error.message);
        }

        console.log('✅ Dashboard calculado exitosamente');
        return datos;
        
    } catch (error) {
        console.error('❌ Error crítico en dashboard:', error.message);
        // Devolver estructura básica con ceros
        return {
            totalClientes: 0,
            totalVehiculos: { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0, enViajeActual: 0, disponibles: 0 },
            totalChoferes: { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0, disponibles: 0 },
            viajesEnCurso: 0,
            mantenimientosInfo: { enCurso: 0, programados: 0, finalizados: 0, total: 0 },
            alertas: { licenciasVencidas: 0, documentacionVehiculosPorVencer: 0 }
        };
    }
};

// ========== FUNCIONES AUXILIARES ==========

// 1. Total de clientes
const obtenerTotalClientes = async () => {
    try {
        // Verificar si tabla Cliente existe
        const [tablaExiste] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Cliente'
        `);
        
        if (tablaExiste[0]?.existe === 0) {
            console.log('ℹ️ Tabla Cliente no existe');
            return 0;
        }
        
        const [result] = await db.query("SELECT COUNT(*) as total FROM Cliente");
        return result[0]?.total || 0;
    } catch (error) {
        console.warn('⚠️ Error en obtenerTotalClientes:', error.message);
        return 0;
    }
};

// 2. Vehículos por estado - VERSIÓN SEGURA
const obtenerVehiculosPorEstado = async () => {
    try {
        // Verificar si tabla Vehiculo existe
        const [tablaExiste] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Vehiculo'
        `);
        
        if (tablaExiste[0]?.existe === 0) {
            console.log('ℹ️ Tabla Vehiculo no existe');
            return {
                total: 0,
                habilitados: 0,
                inhabilitados: 0,
                ocupados: 0,
                enViajeActual: 0,
                disponibles: 0
            };
        }
        
        // Verificar si columna 'estado' existe
        const [columnaEstado] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Vehiculo'
            AND column_name = 'estado'
        `);
        
        let query = "SELECT COUNT(*) as total FROM Vehiculo";
        
        // Si existe columna estado, hacer consulta completa
        if (columnaEstado[0]?.existe > 0) {
            query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'HABILITADO' THEN 1 ELSE 0 END) as habilitados,
                    SUM(CASE WHEN estado = 'INHABILITADO' THEN 1 ELSE 0 END) as inhabilitados,
                    SUM(CASE WHEN estado = 'OCUPADO' THEN 1 ELSE 0 END) as ocupados
                FROM Vehiculo
            `;
        }
        
        const [rows] = await db.query(query);
        const data = rows[0] || { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 };
        
        // Calcular vehículos en viaje (si existe tabla Viaje)
        let enViajeActual = 0;
        try {
            const [viajeExiste] = await db.query(`
                SELECT COUNT(*) as existe 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'Viaje'
            `);
            
            if (viajeExiste[0]?.existe > 0) {
                // Verificar si Viaje tiene columna idVehiculo
                const [columnaIdVehiculo] = await db.query(`
                    SELECT COUNT(*) as existe 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'Viaje'
                    AND column_name = 'idVehiculo'
                `);
                
                if (columnaIdVehiculo[0]?.existe > 0) {
                    const [viajes] = await db.query(`
                        SELECT COUNT(DISTINCT v.idVehiculo) as total 
                        FROM Vehiculo v
                        INNER JOIN Viaje vi ON v.idVehiculo = vi.idVehiculo
                        WHERE v.estado = 'HABILITADO' 
                          AND vi.estado IN ('INICIADO', 'EN_CURSO', 'EN_PROCESO')
                    `);
                    enViajeActual = viajes[0]?.total || 0;
                }
            }
        } catch (error) {
            console.warn('⚠️ Error calculando enViajeActual:', error.message);
        }
        
        return {
            total: data.total || 0,
            habilitados: data.habilitados || 0,
            inhabilitados: data.inhabilitados || 0,
            ocupados: data.ocupados || 0,
            enViajeActual: enViajeActual,
            disponibles: (data.habilitados || 0) - enViajeActual
        };
    } catch (error) {
        console.warn('⚠️ Error en obtenerVehiculosPorEstado:', error.message);
        return {
            total: 0,
            habilitados: 0,
            inhabilitados: 0,
            ocupados: 0,
            enViajeActual: 0,
            disponibles: 0
        };
    }
};

// 3. Choferes por estado - VERSIÓN SEGURA
const obtenerChoferesPorEstado = async () => {
    try {
        // Verificar si tabla Chofer existe
        const [tablaExiste] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Chofer'
        `);
        
        if (tablaExiste[0]?.existe === 0) {
            console.log('ℹ️ Tabla Chofer no existe');
            return {
                total: 0,
                habilitados: 0,
                inhabilitados: 0,
                ocupados: 0,
                disponibles: 0
            };
        }
        
        // Verificar si columna 'estado' existe en Chofer
        const [columnaEstado] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Chofer'
            AND column_name = 'estado'
        `);
        
        let query = "SELECT COUNT(*) as total FROM Chofer";
        let data = { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 };
        
        if (columnaEstado[0]?.existe > 0) {
            query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'HABILITADO' THEN 1 ELSE 0 END) as habilitados,
                    SUM(CASE WHEN estado = 'INHABILITADO' THEN 1 ELSE 0 END) as inhabilitados,
                    SUM(CASE WHEN estado = 'OCUPADO' THEN 1 ELSE 0 END) as ocupados
                FROM Chofer
            `;
            
            const [rows] = await db.query(query);
            data = rows[0] || { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 };
        } else {
            // Si no tiene estado, solo contar total
            const [rows] = await db.query(query);
            data.total = rows[0]?.total || 0;
        }
        
        return {
            total: data.total || 0,
            habilitados: data.habilitados || 0,
            inhabilitados: data.inhabilitados || 0,
            ocupados: data.ocupados || 0,
            disponibles: (data.habilitados || 0) - (data.ocupados || 0)
        };
    } catch (error) {
        console.warn('⚠️ Error en obtenerChoferesPorEstado:', error.message);
        return {
            total: 0,
            habilitados: 0,
            inhabilitados: 0,
            ocupados: 0,
            disponibles: 0
        };
    }
};

// 4. Viajes en curso - VERSIÓN SEGURA
const obtenerViajesEnCurso = async () => {
    try {
        // Verificar si tabla Viaje existe
        const [tablaExiste] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Viaje'
        `);
        
        if (tablaExiste[0]?.existe === 0) {
            console.log('ℹ️ Tabla Viaje no existe');
            return 0;
        }
        
        // Verificar si columna 'estado' existe en Viaje
        const [columnaEstado] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Viaje'
            AND column_name = 'estado'
        `);
        
        if (columnaEstado[0]?.existe === 0) {
            console.log('ℹ️ Viaje no tiene columna estado');
            return 0;
        }
        
        const [result] = await db.query(`
            SELECT COUNT(*) as total FROM Viaje 
            WHERE estado = 'INICIADO' OR estado LIKE '%CURSO%' OR estado LIKE '%PROCESO%'
        `);
        return result[0]?.total || 0;
    } catch (error) {
        console.warn('⚠️ Error en obtenerViajesEnCurso:', error.message);
        return 0;
    }
};

// 5. Mantenimientos - VERSIÓN SEGURA
const obtenerMantenimientosInfo = async () => {
    try {
        // Verificar si tabla Mantenimiento existe
        const [tablaExiste] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Mantenimiento'
        `);
        
        if (tablaExiste[0]?.existe === 0) {
            console.log('ℹ️ Tabla Mantenimiento no existe');
            return {
                enCurso: 0,
                programados: 0,
                finalizados: 0,
                total: 0
            };
        }
        
        // Verificar columnas de fecha
        const [columnaFechaInicio] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Mantenimiento'
            AND column_name IN ('fechaInicio', 'fecha')
        `);
        
        if (columnaFechaInicio[0]?.existe === 0) {
            // Si no tiene fechas, solo contar total
            const [rows] = await db.query("SELECT COUNT(*) as total FROM Mantenimiento");
            return {
                enCurso: 0,
                programados: 0,
                finalizados: 0,
                total: rows[0]?.total || 0
            };
        }
        
        // Determinar nombre de columna fecha
        const [columnasFecha] = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Mantenimiento'
            AND column_name IN ('fechaInicio', 'fecha')
            LIMIT 1
        `);
        
        const columnaFecha = columnasFecha[0]?.column_name || 'fecha';
        const tieneFechaFin = columnaFecha === 'fechaInicio'; // Si tiene fechaInicio, probablemente tenga fechaFin
        
        let query = `SELECT COUNT(*) as total FROM Mantenimiento`;
        
        if (tieneFechaFin) {
            query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE 
                        WHEN ${columnaFecha} <= CURDATE() 
                        AND (fechaFin IS NULL OR fechaFin >= CURDATE())
                        THEN 1 ELSE 0 
                    END) as enCurso,
                    SUM(CASE 
                        WHEN ${columnaFecha} > CURDATE() 
                        THEN 1 ELSE 0 
                    END) as programados,
                    SUM(CASE 
                        WHEN fechaFin < CURDATE() 
                        THEN 1 ELSE 0 
                    END) as finalizados
                FROM Mantenimiento
            `;
        } else {
            // Solo tiene una columna fecha
            query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE 
                        WHEN ${columnaFecha} = CURDATE() 
                        THEN 1 ELSE 0 
                    END) as enCurso,
                    SUM(CASE 
                        WHEN ${columnaFecha} > CURDATE() 
                        THEN 1 ELSE 0 
                    END) as programados,
                    SUM(CASE 
                        WHEN ${columnaFecha} < CURDATE() 
                        THEN 1 ELSE 0 
                    END) as finalizados
                FROM Mantenimiento
            `;
        }
        
        const [rows] = await db.query(query);
        const data = rows[0] || { total: 0, enCurso: 0, programados: 0, finalizados: 0 };
        
        return {
            enCurso: data.enCurso || 0,
            programados: data.programados || 0,
            finalizados: data.finalizados || 0,
            total: data.total || 0
        };
    } catch (error) {
        console.warn('⚠️ Error en obtenerMantenimientosInfo:', error.message);
        return {
            enCurso: 0,
            programados: 0,
            finalizados: 0,
            total: 0
        };
    }
};

// 6. Alertas - VERSIÓN SEGURA
const obtenerAlertas = async () => {
    const alertas = {
        licenciasVencidas: 0,
        documentacionVehiculosPorVencer: 0
    };
    
    try {
        // Verificar si tabla Documentacion existe
        const [tablaExiste] = await db.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Documentacion'
        `);
        
        if (tablaExiste[0]?.existe === 0) {
            console.log('ℹ️ Tabla Documentacion no existe');
            return alertas;
        }
        
        // Verificar columnas disponibles en Documentacion
        const [columnas] = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'Documentacion'
        `);
        
        const columnasDisponibles = columnas.map(col => col.column_name);
        console.log('📋 Columnas en Documentacion:', columnasDisponibles);
        
        // Construir consulta según columnas disponibles
        let tieneTipo = columnasDisponibles.includes('tipo');
        let tieneTipoDocumento = columnasDisponibles.includes('tipoDocumento');
        let tieneFechaVencimiento = columnasDisponibles.includes('fechaVencimiento');
        let tieneActiva = columnasDisponibles.includes('activa');
        let tieneIdVehiculo = columnasDisponibles.includes('idVehiculo');
        let tieneIdChofer = columnasDisponibles.includes('idChofer');
        
        // A. Licencias vencidas de choferes
        if (tieneFechaVencimiento && tieneActiva) {
            let whereConditions = ["fechaVencimiento < CURDATE()", "activa = true"];
            
            if (tieneTipo && tieneTipoDocumento) {
                whereConditions.push("tipo = 'CHOFER'", "tipoDocumento = 'LICENCIA'");
            } else if (tieneIdChofer) {
                // Si no tiene tipo pero sí tiene idChofer, asumimos que son documentos de chofer
                whereConditions.push("idChofer IS NOT NULL");
            }
            
            const query = `
                SELECT COUNT(*) as total 
                FROM Documentacion 
                WHERE ${whereConditions.join(' AND ')}
            `;
            
            try {
                const [licencias] = await db.query(query);
                alertas.licenciasVencidas = licencias[0]?.total || 0;
            } catch (error) {
                console.warn('⚠️ Error en licencias vencidas:', error.message);
            }
        }
        
        // B. Documentación de vehículos por vencer
        if (tieneFechaVencimiento && tieneActiva && tieneIdVehiculo) {
            let whereConditions = [
                "fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)",
                "activa = true"
            ];
            
            if (tieneTipo) {
                whereConditions.push("tipo = 'VEHICULO'");
            } else {
                // Si no tiene tipo, filtrar por idVehiculo no nulo
                whereConditions.push("idVehiculo IS NOT NULL");
            }
            
            const query = `
                SELECT COUNT(DISTINCT idVehiculo) as total 
                FROM Documentacion 
                WHERE ${whereConditions.join(' AND ')}
            `;
            
            try {
                const [documentos] = await db.query(query);
                alertas.documentacionVehiculosPorVencer = documentos[0]?.total || 0;
            } catch (error) {
                console.warn('⚠️ Error en documentación por vencer:', error.message);
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error general en obtenerAlertas:', error.message);
    }
    
    return alertas;
};

module.exports = {
    obtenerDatosDashboard
};