const express = require("express");
const router = express.Router();
const choferVehiculoController = require("../controllers/choferVehiculoController");

router.get("/", choferVehiculoController.getAll);
router.get("/:id", choferVehiculoController.getById);
router.post("/", choferVehiculoController.create);
router.delete("/:id", choferVehiculoController.remove);

module.exports = router;
