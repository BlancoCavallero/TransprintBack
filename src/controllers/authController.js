const axios = require("axios");

// Mapeo de roles del frontend al ID de Auth0
// Estos IDs los obtenés en Auth0 Dashboard → User Management → Roles
const ROLE_MAP = {
  Empleado: process.env.ROLE_ID_EMPLEADO,
  Administrador: process.env.ROLE_ID_ADMIN,
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
    return res.status(400).json({
      error:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0] }); // devuelve solo el primero
  }

  try {
    // 1️⃣ Obtener token de Auth0
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // 2️⃣ Crear usuario en Auth0
    const userResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
      {
        email,
        username,
        password,
        connection: "Username-Password-Authentication",
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const userId = userResponse.data.user_id;

    // 3️⃣ Asignar rol al usuario
    await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`,
      {
        roles: [ROLE_MAP[role]],
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    // 4️⃣ Responder al frontend
    res.status(201).json({
      message: "Usuario creado y rol asignado correctamente",
      user: {
        username: userResponse.data.username,
        email: userResponse.data.email,
        role,
      },
    });
  } catch (error) {
    let message = "Error al crear el usuario";

    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.statusCode === 409) message = "Error, el usuario ya existe";
      else if (errData.statusCode === 400) message = "Datos inválidos";
    }

    res.status(400).json({ error: message });
  }
};

// Controlador para login: intercambia credenciales del usuario por tokens en Auth0.
// Nota: Esto usa Resource Owner Password Grant (ROPG) para simplificar la llamada desde backend.
// Asegúrate de habilitar ROPG en tu tenant de Auth0 o adapta a Authorization Code + PKCE si prefieres.
const loginAuthUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        grant_type: "http://auth0.com/oauth/grant-type/password-realm",
        username,
        password,
        audience:
          process.env.AUTH0_AUDIENCE ||
          `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        scope: "openid profile email",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        realm:
          process.env.AUTH0_DB_CONNECTION || "Username-Password-Authentication",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    // Devuelve el token tal cual lo proporciona Auth0 al frontend
    res.status(200).json(tokenResponse.data);
  } catch (error) {
    let message = "Error en autenticación";
    if (error.response && error.response.data) {
      message =
        error.response.data.error_description ||
        error.response.data.message ||
        message;
    }
    res.status(401).json({ error: message });
  }
};

// Controlador para obtener todos los usuarios de Auth0 con roles
const obtenerUsuariosAuth0 = async (req, res) => {
  try {
    // 1️⃣ Obtener token de Auth0 (client credentials)
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // 2️⃣ Obtener usuarios de Auth0
    const usersResponse = await axios.get(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          per_page: 100,
          page: req.query.page || 0,
          include_totals: true,
        },
      },
    );

    // 3️⃣ Para cada usuario, obtener sus roles
    const usuariosMapeados = await Promise.all(
      usersResponse.data.users.map(async (user) => {
        try {
          const rolesResponse = await axios.get(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user.user_id}/roles`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );

          // Mapear los IDs de roles a nombres
          const roleNames = rolesResponse.data
            .map((r) => {
              if (r.id === process.env.ROLE_ID_EMPLEADO) return "Empleado";
              if (r.id === process.env.ROLE_ID_ADMIN) return "Administrador";
              return r.name;
            })
            .filter(Boolean);

          return {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            nombre_completo: user.name || user.email,
            roles: roleNames.length > 0 ? roleNames : ["Sin rol"],
            creado_en: user.created_at,
            ultimo_login: user.last_login,
            bloqueado: user.blocked || false,
          };
        } catch (error) {
          console.error(
            `Error obteniendo roles para ${user.user_id}:`,
            error.message,
          );
          return {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            nombre_completo: user.name || user.email,
            roles: ["Error al cargar"],
            creado_en: user.created_at,
            ultimo_login: user.last_login,
            bloqueado: user.blocked || false,
          };
        }
      }),
    );

    res.status(200).json({
      success: true,
      data: usuariosMapeados,
      total: usersResponse.data.total,
      limit: usersResponse.data.limit,
      start: usersResponse.data.start,
      message: `Se obtuvieron ${usuariosMapeados.length} usuarios`,
    });
  } catch (error) {
    console.error("Error al obtener usuarios de Auth0:", error.message);
    let message = "Error al obtener usuarios";

    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.statusCode === 401) message = "Token inválido o expirado";
      else if (errData.statusCode === 403)
        message = "No tienes permisos para acceder";
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: message,
    });
  }
};

// Controlador para actualizar usuario en Auth0
const actualizarUsuarioAuth0 = async (req, res) => {
  const { userId } = req.params;
  const { username, email, password, role } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId es requerido" });
  }

  // Validaciones si se proporcionan
  if (password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regex.test(password)) {
      return res.status(400).json({
        error:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
      });
    }
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido" });
  }

  if (role && !ROLE_MAP[role]) {
    return res.status(400).json({ error: "El rol ingresado no es válido" });
  }

  try {
    // 1️⃣ Obtener token de Auth0
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // 2️⃣ Actualizar datos del usuario
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length > 0) {
      await axios.patch(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    }

    // 3️⃣ Actualizar rol si se proporcionó
    if (role) {
      // Obtener roles actuales
      const rolesResponse = await axios.get(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      // Remover todos los roles actuales
      if (rolesResponse.data.length > 0) {
        await axios.delete(
          `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            data: {
              roles: rolesResponse.data.map((r) => r.id),
            },
          },
        );
      }

      // Asignar nuevo rol
      await axios.post(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`,
        {
          roles: [ROLE_MAP[role]],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    }

    res.status(200).json({
      success: true,
      message: "Usuario actualizado correctamente",
      data: {
        user_id: userId,
        username,
        email,
        role: role || undefined,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error.message);
    let message = "Error al actualizar usuario";

    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.statusCode === 404) message = "Usuario no encontrado";
      else if (errData.statusCode === 409) message = "El usuario ya existe";
      else if (errData.statusCode === 401) message = "No autorizado";
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: message,
    });
  }
};

// Controlador para eliminar usuario de Auth0
const eliminarUsuarioAuth0 = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId es requerido" });
  }

  try {
    // 1️⃣ Obtener token de Auth0
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // 2️⃣ Eliminar usuario
    await axios.delete(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    res.status(200).json({
      success: true,
      message: "Usuario eliminado correctamente",
      data: {
        user_id: userId,
      },
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error.message);
    let message = "Error al eliminar usuario";

    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.statusCode === 404) message = "Usuario no encontrado";
      else if (errData.statusCode === 401) message = "No autorizado";
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: message,
    });
  }
};

module.exports = {
  registerAuthUser,
  loginAuthUser,
  obtenerUsuariosAuth0,
  actualizarUsuarioAuth0,
  eliminarUsuarioAuth0,
};
