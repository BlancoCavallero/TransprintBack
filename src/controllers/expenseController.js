const expenseService = require("../services/expenseService");
const { successResponse, errorResponse } = require("../utils/response");


const obtenerGastos = async (req, res, next) => {
    try {
        const gastos = await expenseService.obtenerGastos();
        successResponse(res, gastos)
    } catch (error) {
        next(error);
    }
}

const obtenerGastosPorId = async (req, res, next) =>{
    try {
        const gasto = await expenseService.obtenerPorId(req.params.id);
        if (!gasto) return errorResponse(res, "Gasto no encontrado", 404);
        successResponse(res, gasto);
    } catch (error) {
        next(error);
    }

}

const obtenerGastosPorViaje = async (req, res, next) =>{
    try {
        const gastos = await expenseService.obtenerPorIdViaje(req.params.idViaje);
        if (gastos.length == 0) return errorResponse(res, "No se encontraron gastos para este viaje", 404);
        successResponse(res, gastos);
    } catch (error) {
        next(error);
    }

}

const crear = async (req, res, next) => {
    try {
        const gasto = await expenseService.crear(req.body)
        successResponse(res, gasto, "Gasto registrado correctamente");
    } catch (error) {
        next(error);
    }
}

const modificar = async (req, res, next) => {
    try {
        const gasto = await expenseService.modificarGasto(req.params.id, req.body);
        successResponse(res, gasto, "Gasto modificado correctamente");
    } catch (error) {
        next(error);
    }
}

const eliminar = async (req, res, next) => {
    try {
        await expenseService.eliminar(req.params.id);
        successResponse(res, "Gasto eliminado correctamente");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    obtenerGastos,
    obtenerGastosPorId,
    obtenerGastosPorViaje,
    crear,
    modificar,
    eliminar
}