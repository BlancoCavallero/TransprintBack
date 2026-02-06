const vehiculoService = require("../services/vehiculoService");
const { successResponse, errorResponse } = require("../utils/response");
const vehiculoResumenService = require("../services/vehiculoResumenService");

const obtenerVehiculos = async (req, res, next) => {
  try {
    const { estado } = req.query;
        
        const vehiculos = estado
          ? await vehiculoService.consultarDisponibilidad(estado)
          : await vehiculoService.consultarDisponibilidad();
    
        successResponse(res, vehiculos);
    /*const filtros = req.query;
    const vehiculos = await vehiculoService.obtenerVehiculos(filtros);
    successResponse(res, vehiculos);*/
  } catch (error) {
    next(error);
  }
};

const obtenerVehiculoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Llamamos al servicio (que devuelve un array)
    const vehiculos = await vehiculoService.obtenerVehiculos(id);
    
    // Si el array está vacío, el vehículo no existe
    if (vehiculos.length === 0) {
      return errorResponse(res, "Vehículo no encontrado", 404);
    }

    const vehiculo = vehiculos[0]; // Tomamos el único vehículo del array

    // ⬇️ Cálculo dinámico del estado (igual que en Chofer)
    if (vehiculo.activo === 0) {
      vehiculo.estadoDisponibilidad = "DE_BAJA";
      vehiculo.motivos = ["Vehículo dado de baja"];
    } else {
      // Usamos la función que ya tenés en tu modelo/servicio
      const estado = await vehiculoService.calcularEstadoVehiculo(vehiculo.idVehiculo);
      vehiculo.estadoDisponibilidad = estado.estadoDisponibilidad;
      vehiculo.motivos = estado.motivos;
    }
    
    successResponse(res, vehiculo);
  } catch (error) {
    next(error);
  }
};

const crearVehiculo = async (req, res, next) => {
  try {
    await vehiculoService.crear(req.body);
    successResponse(res, null, "Vehículo creado exitosamente");
  } catch (error) {
    next(error);
  }
};

const actualizarVehiculo = async (req, res, next) => {
  try {
    await vehiculoService.actualizar(req.params.id, req.body);
    successResponse(res, null, "Vehículo actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

/*const eliminarVehiculo = async (req, res, next) => {
  try {
    await vehiculoService.eliminarVehiculo(req.params.id);
    successResponse(res, null, "Vehículo eliminado correctamente");
  } catch (error) {
    next(error);
  }
};*/

const bajaVehiculo = async (req, res, next) => {

  try {
    const { id, accion } = req.params;
    await vehiculoService.bajaVehiculo(id, accion);

    const mensaje =
      accion === "baja"
        ? "Vehiculo dado de baja correctamente"
        : "Vehiculo reactivado correctamente";

      successResponse(res, null, mensaje);
  } catch (error) {
    next(error);
  }
};


const obtenerVehiculosConMantenimientos = async (req, res, next) => {
  try {
    const vehiculos =
      await vehiculoResumenService.obtenerVehiculosConMantenimientos();

    res.json({ vehiculos });
  } catch (error) {
    next(error);
  }
};

const obtenerMantenimientosDeVehiculo = async (req, res, next) => {
  try {
    const { idVehiculo } = req.params;

    const resultado =
      await vehiculoResumenService.obtenerMantenimientosPorVehiculo(idVehiculo);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerVehiculos,
  obtenerVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
  bajaVehiculo,
  //eliminarVehiculo,
  obtenerVehiculosConMantenimientos,
  obtenerMantenimientosDeVehiculo,
};
