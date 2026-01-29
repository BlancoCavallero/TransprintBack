const db = require("../config/db");

const obtenerResumenViaticosChoferes = async () => {
  const [rows] = await db.query(`
    SELECT
      c.idChofer,
      p.nombre,
      p.apellido,
      DATE_FORMAT(v.fechaInicio, '%Y-%m') AS mes,
      SUM(g.monto) AS totalViaticos,
      COUNT(DISTINCT v.idViaje) AS totalViajes
    FROM Viaje v
    JOIN Chofer c ON c.idChofer = v.idChofer
    JOIN Persona p ON p.idPersona = c.idPersona
    JOIN Gasto g ON g.idViaje = v.idViaje
    GROUP BY c.idChofer, mes
    ORDER BY c.idChofer, mes
  `);

  // 🔁 Armado del JSON final
  const resumen = {};

  rows.forEach(r => {
    if (!resumen[r.idChofer]) {
      resumen[r.idChofer] = {
        choferId: r.idChofer,
        nombre: `${r.nombre} ${r.apellido}`,
        totalViaticos: 0,
        totalViajes: 0,
        detalleMeses: []
      };
    }

    resumen[r.idChofer].totalViaticos += r.totalViaticos;
    resumen[r.idChofer].totalViajes += r.totalViajes;

    resumen[r.idChofer].detalleMeses.push({
      mes: r.mes,
      totalViaticos: r.totalViaticos,
      viajes: r.totalViajes
    });
  });

  return Object.values(resumen);
};

module.exports = {
  obtenerResumenViaticosChoferes
};
