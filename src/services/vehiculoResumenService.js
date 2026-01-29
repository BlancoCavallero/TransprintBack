const vehiculoService = require("./vehiculoService");
const mantenimientoService = require("./mantenimientoService");

/**
 * Obtiene todos los vehículos con sus mantenimientos
 */
const obtenerVehiculosConMantenimientos = async () => {
  const vehiculos = await vehiculoService.obtenerVehiculos();

  const vehiculosConMantenimientos = await Promise.all(
    vehiculos.map(async (v) => {
      const mantenimientos =
        await mantenimientoService.obtenerMantenimientos({
          idVehiculo: v.idVehiculo,
        });

      return {
        id: v.idVehiculo,
        placa: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        // ⚠️ estado no viene del service de vehículos
        // si más adelante querés, acá se puede calcular
        mantenimientos: mantenimientos.map((m) => ({
          id: m.idMantenimiento,
          fechaInicio: m.fechaInicio,
          fechaFin: m.fechaFin,
          tipo: m.tipo,
          descripcion: m.observaciones,
          estado: m.estado,
        })),
      };
    })
  );

  return {
    vehiculos: vehiculosConMantenimientos,
  };
};

/**
 * Obtiene los mantenimientos de un vehículo puntual
 */
const obtenerMantenimientosPorVehiculo = async (idVehiculo) => {
  const mantenimientos = await mantenimientoService.obtenerMantenimientos({
    idVehiculo,
  });

  return {
    idVehiculo,
    mantenimientos: mantenimientos.map((m) => ({
      id: m.idMantenimiento,
      fechaInicio: m.fechaInicio,
      fechaFin: m.fechaFin,
      tipo: m.tipo,
      observaciones: m.observaciones,
      estado: m.estado,
    })),
  };
};

module.exports = {
  obtenerVehiculosConMantenimientos,
  obtenerMantenimientosPorVehiculo,
};
