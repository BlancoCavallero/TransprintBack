const successResponse = (res, data = null, message = "") => {
  return res.status(200).json({ success: true, data, message }); // data contiene la info. que la API devuelve, por ej al pedir la lista de clientes, contiene los clientes.
};

const errorResponse = (res, message = "Error", status = 500) => {
  return res.status(status).json({ success: false, message });
};

module.exports = { successResponse, errorResponse };
