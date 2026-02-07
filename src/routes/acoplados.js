const express = require("express");
const router = express.Router();

const acopladoController = require("../controllers/acopladoController");
const { validarCreacionAcoplado, validarActualizacionAcoplado } = require("../validators/acopladoValidator");
const validarResultado = require("../middlewares/validarResultado");

// 1. Rutas fijas (específicas)
router.get("/", acopladoController.obtenerAcoplados); // Obtener todos o filtrar
//router.get("/con-mantenimientos", acopladoController.obteneracopladosConMantenimientos);

// 2. Rutas con parámetros (dinámicas)
router.get("/:id", acopladoController.obtenerAcopladoPorId); // Obtener un acoplado específico por ID
//router.get("/:idacoplado/mantenimientos",acopladoController.obtenerMantenimientosDeAcoplado);

// Registrar acoplado nuevo (valida campos)
router.post("/", validarCreacionAcoplado, validarResultado, acopladoController.crearAcoplado);

// Actualizar acoplado existente (valida campos)
router.put("/:id", validarActualizacionAcoplado, validarResultado, acopladoController.actualizarAcoplado);

// Eliminar acoplado
//router.delete("/:id", acopladoController.eliminarAcoplado);
router.put("/:id/:accion", acopladoController.bajaAcoplado);




module.exports = router;
