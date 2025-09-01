const axios = require('axios');

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const tokenResponse = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.post(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
      email,
      password,
      connection: 'Username-Password-Authentication'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    res.status(201).json(userResponse.data);
  } catch (error) {
    res.status(400).json({ error: error.response?.data || error.message });
  }
};

module.exports = { registerUser };
