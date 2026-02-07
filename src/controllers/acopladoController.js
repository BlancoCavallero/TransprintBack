const acopladoService = require("../services/acopladoService");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * GET /acoplados?estado=HABILITADO
 */
const obtenerAcoplados = async (req, res, next) => {
  try {
    const { estado } = req.query;

    const acoplados = estado
      ? await acopladoService.consultarDisponibilidadAcoplados(estado)
      : await acopladoService.consultarDisponibilidadAcoplados();

    successResponse(res, acoplados);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /acoplados/:id
 */
const obtenerAcopladoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const acoplados = await acopladoService.obtenerAcoplados(id);

    if (acoplados.length === 0) {
      return errorResponse(res, "Acoplado no encontrado", 404);
    }

    const acoplado = acoplados[0];

    // ⬇️ Cálculo dinámico del estado (igual que Vehículo)
    if (acoplado.activo === 0) {
      acoplado.estadoDisponibilidad = "DE_BAJA";
      acoplado.motivos = ["Acoplado dado de baja"];
    } else {
      const estado = await acopladoService.calcularEstadoAcoplado(
        acoplado.idAcoplado
      );
      acoplado.estadoDisponibilidad = estado.estadoDisponibilidad;
      acoplado.motivos = estado.motivos;
    }

    successResponse(res, acoplado);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /acoplados
 */
const crearAcoplado = async (req, res, next) => {
  try {
    await acopladoService.crear(req.body);
    successResponse(res, null, "Acoplado creado exitosamente");
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /acoplados/:id
 */
const actualizarAcoplado = async (req, res, next) => {
  try {
    await acopladoService.actualizar(req.params.id, req.body);
    successResponse(res, null, "Acoplado actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /acoplados/:id/:accion
 * accion = baja | reactivar
 */
const bajaAcoplado = async (req, res, next) => {
  try {
    const { id, accion } = req.params;

    await acopladoService.bajaAcoplado(id, accion);

    const mensaje =
      accion === "baja"
        ? "Acoplado dado de baja correctamente"
        : "Acoplado reactivado correctamente";

    successResponse(res, null, mensaje);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerAcoplados,
  obtenerAcopladoPorId,
  crearAcoplado,
  actualizarAcoplado,
  bajaAcoplado,
};
