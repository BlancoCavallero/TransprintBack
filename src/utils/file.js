const fs = require("fs");
const path = require("path");

const eliminarArchivo = (rutaRelativa) => {
  if (!rutaRelativa) return;

  const rutaAbsoluta = path.join(
    __dirname,
    "..",
    rutaRelativa
  );

  if (fs.existsSync(rutaAbsoluta)) {
    fs.unlinkSync(rutaAbsoluta);
  }
};

module.exports = { eliminarArchivo };
