const express = require("express");
const router = express.Router();
const documentationController = require("../controllers/documentationController");
const upload = require("../middlewares/upload");
const {
  validarDocumentacion,
  validarDocumentacionActualizacion,
} = require("../validators/documentationValidator");
const validarResultado = require("../middlewares/validarResultado");

router.get("/", documentationController.obtenerTodas);
router.get("/:id", documentationController.obtenerPorId);
router.post(
  "/",
  validarDocumentacion,
  validarResultado,
  upload.single("detalle"),
  documentationController.crear
);
router.put(
  "/:id",
  validarDocumentacionActualizacion,
  validarResultado,
  upload.single("detalle"),
  documentationController.actualizar
);
router.delete("/:id", documentationController.eliminar);

module.exports = router;
