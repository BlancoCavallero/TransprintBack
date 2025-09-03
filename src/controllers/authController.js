const axios = require('axios');

// Mapeo de roles del frontend al ID de Auth0
// Estos IDs los obtenés en Auth0 Dashboard → User Management → Roles
const ROLE_MAP = {
  Empleado: process.env.ROLE_ID_EMPLEADO,      // cuando lo probemos reemplazar con el ID real del rol en Auth0
  Administrador: process.env.ROLE_ID_ADMIN  
  // agregá más roles según necesites
};

const registerAuthUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, contraseña y rol son requeridos' });
  }

  if (!ROLE_MAP[role]) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ error: 'Formato de email inválido' });
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
      user: { email: userResponse.data.email, role }
    });

  } catch (error) {
    let message = 'Error al crear el usuario';

    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.statusCode === 409) message = 'El email ya está registrado';
      else if (errData.statusCode === 400) message = 'Datos inválidos';
    }

    res.status(400).json({ error: message });
  }
};

module.exports = { registerAuthUser };
