const vehiculoService = require("./vehiculoService");
const mantenimientoService = require("./mantenimientoService");

const obtenerVehiculosConMantenimientos = async () => {
  const vehiculos = await vehiculoService.obtenerVehiculos();


  return Promise.all(
    vehiculos.map(async (v) => {
      const mantenimientos =
        await mantenimientoService.obtenerMantenimientos({ idVehiculo: v.idVehiculo });

      return {
        id: v.idVehiculo,
        placa: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        estado: v.estado,
        mantenimientos: mantenimientos.map((m) => ({
          id: m.idMantenimiento,
          fecha: m.fecha,
          tipo: m.tipo,
          descripcion: m.descripcion,
          costo: m.costo,
        })),
      };
    })
  );
};

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
    })),
  };
};

module.exports = {
  obtenerVehiculosConMantenimientos,
  obtenerMantenimientosPorVehiculo
};
