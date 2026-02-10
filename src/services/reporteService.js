const db = require("../config/db");

/**
 * Obtiene el reporte de ganancias con ingresos, gastos, ganancia y margen
 * @param {number} mes - Mes (1-12) opcional
 * @param {number} anio - Año opcional (por defecto año actual)
 * @returns {Object} Reporte de ganancias con totalizadores y viajes
 */
const obtenerReporteGanancias = async (mes = null, anio = null) => {
  console.log('🔵 [BACKEND] obtenerReporteGanancias - INICIO');
  console.log('📥 [BACKEND] Parámetros recibidos:', { mes, anio });
  
  // Por defecto usar el año actual
  const anioActual = anio || new Date().getFullYear();

  // Construir la condición de fecha
  let condicionFecha = "YEAR(v.fechaFin) = ?";
  const params = [anioActual];

  if (mes) {
    condicionFecha += " AND MONTH(v.fechaFin) = ?";
    params.push(mes);
  }

  // Obtener viajes finalizados con sus gastos
  // IMPORTANTE: No usar v.estado = 'FINALIZADO' porque el estado se calcula dinámicamente
  // Un viaje está finalizado cuando fechaFin < fecha actual
  const query = `
    SELECT 
      v.idViaje,
      v.fechaInicio,
      v.fechaFin,
      v.precio,
      v.kilometros,
      v.estado,
      lo.nombre as localidadOrigen,
      ld.nombre as localidadDestino,
      COALESCE(SUM(g.monto), 0) as totalGastos
    FROM Viaje v
    LEFT JOIN Localidad lo ON v.idLocalidadOrigen = lo.idLocalidad
    LEFT JOIN Localidad ld ON v.idLocalidadDestino = ld.idLocalidad
    LEFT JOIN Gasto g ON v.idViaje = g.idViaje
    WHERE v.estado != 'CANCELADO'
      AND v.fechaFin < CURDATE()
      AND ${condicionFecha}
    GROUP BY v.idViaje
    ORDER BY v.fechaFin DESC
  `;

  
  // Debug: Verificar todos los viajes finalizados primero
  const [todosViajes] = await db.query(`
    SELECT idViaje, estado, fechaInicio, fechaFin, 
           YEAR(fechaFin) as anioFin, MONTH(fechaFin) as mesFin,
           DATE_FORMAT(fechaFin, '%Y-%m-%d %H:%i:%s') as fechaFinFormateada,
           precio,
           CASE 
             WHEN fechaFin < CURDATE() THEN 'FINALIZADO' 
             ELSE 'NO_FINALIZADO' 
           END as estadoCalculado
    FROM Viaje 
    WHERE estado != 'CANCELADO' AND fechaFin < CURDATE()
    ORDER BY fechaFin DESC
    LIMIT 5
  `);
  console.log('🔍 [BACKEND-DEBUG] Viajes con fechaFin < HOY (calculados como FINALIZADO):');
  todosViajes.forEach(v => {
    console.log(`  ID: ${v.idViaje}, EstadoBD: "${v.estado}", EstadoCalculado: "${v.estadoCalculado}", FechaFin: ${v.fechaFinFormateada}, Año: ${v.anioFin}, Mes: ${v.mesFin}, Precio: ${v.precio}`);
  });
  
  // Debug: Verificar cuántos viajes hay EN TOTAL sin filtro de fecha
  const [totalViajes] = await db.query(`
    SELECT COUNT(*) as total FROM Viaje WHERE estado != 'CANCELADO' AND fechaFin < CURDATE()
  `);
  console.log('📊 [BACKEND-DEBUG] Total viajes FINALIZADOS (por fecha):', totalViajes[0].total);
  
  const [viajes] = await db.query(query, params);
  
  console.log('✅ [BACKEND] Viajes encontrados:', viajes.length);
  console.log('📦 [BACKEND] Primer viaje (sample):', viajes[0]);

  // Calcular totalizadores
  let ingresosTotal = 0;
  let gastosTotal = 0;

  const viajesConGanancia = viajes.map((viaje) => {
    const precio = parseFloat(viaje.precio) || 0;
    const gastos = parseFloat(viaje.totalGastos) || 0;
    const ganancia = precio - gastos;

    ingresosTotal += precio;
    gastosTotal += gastos;

    return {
      idViaje: viaje.idViaje,
      fechaInicio: viaje.fechaInicio,
      fechaFin: viaje.fechaFin,
      localidadOrigen: viaje.localidadOrigen,
      localidadDestino: viaje.localidadDestino,
      kilometros: viaje.kilometros,
      precio: precio,
      gastos: gastos,
      ganancia: ganancia,
    };
  });

  const gananciaTotal = ingresosTotal - gastosTotal;
  const margenGanancia =
    ingresosTotal > 0 ? (gananciaTotal / ingresosTotal) * 100 : 0;

  const resultado = {
    totalizadores: {
      ingresos: parseFloat(ingresosTotal.toFixed(2)),
      gastos: parseFloat(gastosTotal.toFixed(2)),
      ganancia: parseFloat(gananciaTotal.toFixed(2)),
      margenGanancia: parseFloat(margenGanancia.toFixed(2)),
    },
    viajes: viajesConGanancia,
    filtros: {
      mes: mes || null,
      anio: anioActual,
    },
  };
  
  console.log('📤 [BACKEND] Retornando resultado:', {
    cantidadViajes: resultado.viajes.length,
    totalizadores: resultado.totalizadores
  });
  console.log('🔵 [BACKEND] obtenerReporteGanancias - FIN\n');
  
  return resultado;
};

/**
 * Obtiene el reporte de gastos agrupados por tipo
 * @param {number} mes - Mes (1-12) opcional
 * @param {number} anio - Año opcional (por defecto año actual)
 * @returns {Object} Reporte de gastos por tipo con detalle
 */
const obtenerReporteGastos = async (mes = null, anio = null) => {
  console.log('🟢 [BACKEND] obtenerReporteGastos - INICIO');
  console.log('📥 [BACKEND] Parámetros recibidos:', { mes, anio });
  
  // Por defecto usar el año actual
  const anioActual = anio || new Date().getFullYear();

  // Construir la condición de fecha
  let condicionFecha = "YEAR(v.fechaFin) = ?";
  const params = [anioActual];

  if (mes) {
    condicionFecha += " AND MONTH(v.fechaFin) = ?";
    params.push(mes);
  }

  // Obtener todos los gastos con información del viaje
  // IMPORTANTE: Viajes finalizados = fechaFin < fecha actual (no usar estado)
  const queryDetalle = `
    SELECT 
      g.idGasto,
      g.tipo,
      g.detalle,
      g.monto,
      v.fechaFin as fecha,
      v.idViaje,
      lo.nombre as localidadOrigen,
      ld.nombre as localidadDestino
    FROM Gasto g
    INNER JOIN Viaje v ON g.idViaje = v.idViaje
    LEFT JOIN Localidad lo ON v.idLocalidadOrigen = lo.idLocalidad
    LEFT JOIN Localidad ld ON v.idLocalidadDestino = ld.idLocalidad
    WHERE v.estado != 'CANCELADO'
      AND v.fechaFin < CURDATE()
      AND ${condicionFecha}
    ORDER BY v.fechaFin DESC, g.tipo
  `;

  const [gastos] = await db.query(queryDetalle, params);
  
  console.log('✅ [BACKEND] Gastos encontrados:', gastos.length);
  console.log('📦 [BACKEND] Primer gasto (sample):', gastos[0]);

  // Calcular totalizadores por tipo
  const totalizadoresPorTipo = {
    Combustible: 0,
    Viatico: 0,
    Peaje: 0,
  };

  gastos.forEach((gasto) => {
    const monto = parseFloat(gasto.monto) || 0;
    if (totalizadoresPorTipo.hasOwnProperty(gasto.tipo)) {
      totalizadoresPorTipo[gasto.tipo] += monto;
    }
  });

  // Formatear los gastos para el detalle
  const detalleGastos = gastos.map((gasto) => ({
    idGasto: gasto.idGasto,
    fecha: gasto.fecha,
    tipo: gasto.tipo,
    descripcion: gasto.detalle,
    precio: parseFloat(gasto.monto) || 0,
    viaje: {
      idViaje: gasto.idViaje,
      localidadOrigen: gasto.localidadOrigen,
      localidadDestino: gasto.localidadDestino,
    },
  }));

  const resultadoGastos = {
    totalizadores: {
      combustible: parseFloat(totalizadoresPorTipo.Combustible.toFixed(2)),
      viatico: parseFloat(totalizadoresPorTipo.Viatico.toFixed(2)),
      peaje: parseFloat(totalizadoresPorTipo.Peaje.toFixed(2)),
      total: parseFloat(
        (
          totalizadoresPorTipo.Combustible +
          totalizadoresPorTipo.Viatico +
          totalizadoresPorTipo.Peaje
        ).toFixed(2)
      ),
    },
    gastos: detalleGastos,
    filtros: {
      mes: mes || null,
      anio: anioActual,
    },
  };
  
  console.log('📤 [BACKEND] Retornando resultado gastos:', {
    cantidadGastos: resultadoGastos.gastos.length,
    totalizadores: resultadoGastos.totalizadores
  });
  
  return resultadoGastos;
};

/**
 * Obtiene el reporte de viáticos por chofer
 * @param {number} mes - Mes (1-12) opcional
 * @param {number} anio - Año opcional (por defecto año actual)
 * @returns {Object} Reporte de viáticos agrupados por chofer
 */
const obtenerReporteViaticos = async (mes = null, anio = null) => {
  console.log('🟡 [BACKEND] obtenerReporteViaticos - INICIO');
  console.log('📥 [BACKEND] Parámetros recibidos:', { mes, anio });
  
  // Por defecto usar el año actual
  const anioActual = anio || new Date().getFullYear();

  // Construir la condición de fecha
  let condicionFecha = "YEAR(v.fechaFin) = ?";
  const params = [anioActual];

  if (mes) {
    condicionFecha += " AND MONTH(v.fechaFin) = ?";
    params.push(mes);
  }

  // Obtener viáticos agrupados por chofer
  // IMPORTANTE: Viajes finalizados = fechaFin < fecha actual (no usar estado)
  const query = `
    SELECT 
      c.idChofer,
      p.nombre,
      p.apellido,
      COALESCE(SUM(g.monto), 0) as totalViaticos,
      COUNT(DISTINCT v.idViaje) as cantidadViajes
    FROM Chofer c
    INNER JOIN Persona p ON c.idPersona = p.idPersona
    INNER JOIN Viaje v ON c.idChofer = v.idChofer
    INNER JOIN Gasto g ON v.idViaje = g.idViaje
    WHERE v.estado != 'CANCELADO'
      AND v.fechaFin < CURDATE()
      AND g.tipo = 'Viatico'
      AND ${condicionFecha}
    GROUP BY c.idChofer, p.nombre, p.apellido
    HAVING totalViaticos > 0
    ORDER BY totalViaticos DESC
  `;

  const [choferes] = await db.query(query, params);
  
  console.log('✅ [BACKEND] Choferes con viáticos encontrados:', choferes.length);
  console.log('📦 [BACKEND] Primer chofer (sample):', choferes[0]);

  // Formatear los datos
  const choferesConViaticos = choferes.map((chofer) => ({
    idChofer: chofer.idChofer,
    nombre: chofer.nombre,
    apellido: chofer.apellido,
    nombreCompleto: `${chofer.nombre} ${chofer.apellido}`,
    totalViaticos: parseFloat(chofer.totalViaticos) || 0,
    cantidadViajes: chofer.cantidadViajes,
  }));

  // Calcular el total general
  const totalGeneral = choferesConViaticos.reduce(
    (sum, chofer) => sum + chofer.totalViaticos,
    0
  );

  const resultadoViaticos = {
    totalizadores: {
      totalViaticos: parseFloat(totalGeneral.toFixed(2)),
      cantidadChoferes: choferesConViaticos.length,
    },
    choferes: choferesConViaticos,
    filtros: {
      mes: mes || null,
      anio: anioActual,
    },
  };
  
  console.log('📤 [BACKEND] Retornando resultado viáticos:', resultadoViaticos.totalizadores);
  
  return resultadoViaticos;
};

module.exports = {
  obtenerReporteGanancias,
  obtenerReporteGastos,
  obtenerReporteViaticos,
};
