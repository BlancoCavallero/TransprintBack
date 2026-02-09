    // src/services/dashboardService.js
    const db = require('../config/db');
    const vehiculoService = require('./vehiculoService');
    const driverService = require('./driverService');


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
                    choferes: {
                        licenciasVencidas: 0,
                        licenciasPorVencer: 0
                    },
                    vehiculos: {
                        documentacionVencida: 0,
                        documentacionPorVencer: 0
                    }
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
            return {
                totalClientes: 0,
                totalVehiculos: { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0, enMantenimiento: 0 },
                totalChoferes: { total: 0, habilitados: 0, inhabilitados: 0, ocupados: 0 },
                viajesEnCurso: 0,
                mantenimientosInfo: { enCurso: 0, pendientes: 0, finalizados: 0, total: 0 },
                alertas: {
                    choferes: { licenciasVencidas: 0, licenciasPorVencer: 0 },
                    vehiculos: { documentacionVencida: 0, documentacionPorVencer: 0 }
                }
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
        const vehiculos = await vehiculoService.obtenerVehiculos();

        let total = 0;
        let habilitados = 0;
        let inhabilitados = 0;
        let ocupados = 0;
        let enMantenimiento = 0;

        for (const v of vehiculos) {

        // 🔴 NO contar vehiculos dados de baja
        if (v.activo === 0) continue;
        
        total++;
        const { estadoDisponibilidad } =
            await vehiculoService.calcularEstadoVehiculo(v.idVehiculo);

        switch (estadoDisponibilidad) {
            case 'HABILITADO':
            habilitados++;
            break;
            case 'INHABILITADO':
            inhabilitados++;
            break;
            case 'OCUPADO':
            ocupados++;
            break;
            case 'EN_MANTENIMIENTO':
            enMantenimiento++;
            break;
        }
        }

        return {
        total,
        habilitados,
        inhabilitados,
        ocupados,
        enMantenimiento
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
        const choferes = await driverService.obtenerChoferes();

        let total = 0;
        let habilitados = 0;
        let inhabilitados = 0;
        let ocupados = 0;



        for (const c of choferes) {
        
        // 🔴 NO contar choferes dados de baja
        if (c.activo === 0) continue;
        
        total++;

        const { estadoDisponibilidad } =
            await driverService.calcularEstadoChofer(c.idChofer);

        switch (estadoDisponibilidad) {
            case 'HABILITADO':
            habilitados++;
            break;
            case 'INHABILITADO':
            inhabilitados++;
            break;
            case 'OCUPADO':
            ocupados++;
            break;
        }
        }

        return {
        total,
        habilitados,
        inhabilitados,
        ocupados,
        };

    } catch (error) {
        console.warn('Error en obtenerChoferesPorEstado:', error.message);
        return {
        total: 0,
        habilitados: 0,
        inhabilitados: 0,
        ocupados: 0,
        };
    }
};

    // 4. Viajes en curso
    const obtenerViajesEnCurso = async () => {
        try {
            const [rows] = await db.query(`
                SELECT fechaInicio, fechaFin, estado
                FROM Viaje
                WHERE estado IS NOT NULL
                AND estado != 'CANCELADO'
            `);

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            let enCurso = 0;

            for (const v of rows) {
                const inicio = new Date(v.fechaInicio);
                const fin = new Date(v.fechaFin);

                inicio.setHours(0,0,0,0);
                fin.setHours(0,0,0,0);

                if (inicio <= hoy && fin >= hoy) {
                    enCurso++;
                }
            }

            return enCurso;
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
                    SUM(CASE 
                        WHEN fechaInicio <= CURDATE() 
                        AND (fechaFin IS NULL OR fechaFin >= CURDATE())
                        THEN 1 ELSE 0 
                    END) as enCurso,
                    SUM(CASE 
                        WHEN fechaInicio > CURDATE() 
                        THEN 1 ELSE 0 
                    END) as pendientes,
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
    //
    // El subquery interno agrupa por (idChofer/idVehiculo + nombre) y trae solo
    // la mayor fechaVencimiento. Así si un chofer tiene dos CARNET, solo se
    // considera el más reciente para determinar si está vencido o por vencer.
    //
    const obtenerAlertas = async () => {
    try {
        const DIAS_AVISO = 30;

        // ======================
        // CHOFERES
        // ======================

        // Licencias vencidas: solo considera el último documento por tipo
        const [choferVencidas] = await db.query(`
        SELECT COUNT(DISTINCT ultima.idChofer) AS total
        FROM (
            SELECT d.idChofer, d.nombre, MAX(d.fechaVencimiento) AS fechaVencimiento
            FROM Documentacion d
            JOIN Chofer c ON c.idChofer = d.idChofer
            WHERE d.tipoEntidad = 'CHOFER'
                AND c.activo = 1
            GROUP BY d.idChofer, d.nombre
        ) ultima
        WHERE ultima.fechaVencimiento < CURDATE()
        `);

        // Licencias por vencer: solo considera el último documento por tipo
        const [choferPorVencer] = await db.query(`
        SELECT COUNT(DISTINCT ultima.idChofer) AS total
        FROM (
            SELECT d.idChofer, d.nombre, MAX(d.fechaVencimiento) AS fechaVencimiento
            FROM Documentacion d
            JOIN Chofer c ON c.idChofer = d.idChofer
            WHERE d.tipoEntidad = 'CHOFER'
                AND c.activo = 1
            GROUP BY d.idChofer, d.nombre
        ) ultima
        WHERE ultima.fechaVencimiento 
        BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)

        `, [DIAS_AVISO]);

        // ======================
        // VEHÍCULOS
        // ======================

        // Documentación vencida: solo considera el último documento por tipo
        const [vehiculosVencida] = await db.query(`
        SELECT COUNT(DISTINCT ultima.idVehiculo) AS total
        FROM (
            SELECT idVehiculo, nombre, MAX(fechaVencimiento) AS fechaVencimiento
            FROM Documentacion
            WHERE tipoEntidad = 'VEHICULO'
            GROUP BY idVehiculo, nombre
        ) ultima
        WHERE ultima.fechaVencimiento < CURDATE()
        `);

        // Documentación por vencer: solo considera el último documento por tipo
        const [vehiculosPorVencer] = await db.query(`
        SELECT COUNT(DISTINCT ultima.idVehiculo) AS total
        FROM (
            SELECT idVehiculo, nombre, MAX(fechaVencimiento) AS fechaVencimiento
            FROM Documentacion
            WHERE tipoEntidad = 'VEHICULO'
            GROUP BY idVehiculo, nombre
        ) ultima
        WHERE ultima.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        `, [DIAS_AVISO]);

        return {
        choferes: {
            licenciasVencidas: choferVencidas[0]?.total || 0,
            licenciasPorVencer: choferPorVencer[0]?.total || 0
        },
        vehiculos: {
            documentacionVencida: vehiculosVencida[0]?.total || 0,
            documentacionPorVencer: vehiculosPorVencer[0]?.total || 0
        }
        };

    } catch (error) {
        console.warn('Error en obtenerAlertas:', error.message);
        return {
        choferes: {
            licenciasVencidas: 0,
            licenciasPorVencer: 0
        },
        vehiculos: {
            documentacionVencida: 0,
            documentacionPorVencer: 0
        }
        };
    }
    };

    module.exports = {
        obtenerDatosDashboard
    };
