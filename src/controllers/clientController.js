const clientService = require("../services/clientService");
const { successResponse, errorResponse } = require("../utils/response");

const registrarCliente = async (req, res, next) => {
  try {
    const { correo } = req.body;
    const existe = await clientService.obtenerPorCorreo(correo);
    if (existe) return errorResponse(res, "El cliente con este correo ya está registrado", 400);

    await clientService.crearCliente(req.body);
    successResponse(res, null, "Cliente registrado exitosamente");
  } catch (error) {
    next(error);
  }
};

const obtenerClientes = async (req, res, next) => {
  try {
    const clientes = await clientService.obtenerTodos();
    successResponse(res, clientes);
  } catch (error) {
    next(error);
  }
};

const obtenerClientePorId = async (req, res, next) => {
  try {
    const cliente = await clientService.obtenerPorId(req.params.id);
    if (!cliente) return errorResponse(res, "Cliente no encontrado", 404);
    successResponse(res, cliente);
  } catch (error) {
    next(error);
  }
};

const actualizarCliente = async (req, res, next) => {
  try {
    const cliente = await clientService.obtenerPorId(req.params.id);
    if (!cliente) return errorResponse(res, "Cliente no encontrado", 404);

    await clientService.actualizarCliente(req.params.id, req.body);
    successResponse(res, null, "Cliente actualizado correctamente");
  } catch (error) {
    next(error);
  }
};

const eliminarCliente = async (req, res, next) => {
  try {
    const cliente = await clientService.obtenerPorId(req.params.id);
    if (!cliente) return errorResponse(res, "Cliente no encontrado", 404);

    await clientService.eliminarCliente(req.params.id);
    successResponse(res, null, "Cliente eliminado correctamente");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registrarCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente,
};
