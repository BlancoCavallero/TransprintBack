const axios = require('axios');

// Mapeo de roles del frontend al ID de Auth0
// Estos IDs los obtenés en Auth0 Dashboard → User Management → Roles
const ROLE_MAP = {
  Empleado: process.env.ROLE_ID_EMPLEADO,
  Administrador: process.env.ROLE_ID_ADMIN
};

const registerAuthUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  const errors = [];

/*  if (!email || !username || !password || !role) {
    return res.status(400).json({ error: 'Email, usuario, contraseña y rol son requeridos' });
  } */

  // Validaciones personalizadas
  if (!email) errors.push("El email es requerido");
  if (!username) errors.push("El nombre de usuario es requerido");
  if (!password) errors.push("La contraseña es requerida");
  if (!role) errors.push("El rol es requerido");

if (role && !ROLE_MAP[role]) {
    errors.push("El rol ingresado no es válido");
  }

    // Validar contraseña: 8+ caracteres, al menos una mayúscula, minúscula y número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!regex.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ error: 'Formato de email inválido' });
  }

  if (errors.length > 0) {
  return res.status(400).json({ error: errors[0] }); // devuelve solo el primero
}

  try {
    // 1️⃣ Obtener token de Auth0
    const tokenResponse = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    });

    const accessToken = tokenResponse.data.access_token;

    // 2️⃣ Crear usuario en Auth0
    const userResponse = await axios.post(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
      email,
      username,
      password,
      connection: 'Username-Password-Authentication'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userId = userResponse.data.user_id;

    // 3️⃣ Asignar rol al usuario
    await axios.post(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`, {
      roles: [ROLE_MAP[role]]
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // 4️⃣ Responder al frontend
    res.status(201).json({
      message: 'Usuario creado y rol asignado correctamente',
      user: { username: userResponse.data.username, email: userResponse.data.email, role }
    });

  } catch (error) {
    let message = 'Error al crear el usuario';

    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.statusCode === 409) message = 'Error, el usuario ya existe';
      else if (errData.statusCode === 400) message = 'Datos inválidos';
    }

    res.status(400).json({ error: message });
  }
};

module.exports = { registerAuthUser };
