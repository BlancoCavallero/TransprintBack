const successResponse = (res, data = null, message = "") => {
  return res.status(200).json({ success: true, data, message }); // el proposito de data es contener la información que la API devuelve, por ejemplo cuando se pide la lista de los clientes
};

const errorResponse = (res, message = "Error", status = 500) => {
  return res.status(status).json({ success: false, message });
};

module.exports = { successResponse, errorResponse };
