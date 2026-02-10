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
  (req, res, next) => {
    console.log('=== ANTES DE MULTER (POST) ==>')
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body antes de multer:', req.body);
    next();
  },
  upload.single("detalle"),
  validarDocumentacion,
  validarResultado,
  documentationController.crear
);
router.put(
  "/:id",
  upload.single("detalle"),
  validarDocumentacionActualizacion,
  validarResultado,
  documentationController.actualizar
);
router.delete("/:id", documentationController.eliminar);

module.exports = router;
