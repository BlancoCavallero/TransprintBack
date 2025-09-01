// Simulamos una "base de datos" en memoria
const users = [];

const registerUser = (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validar duplicado
  const exists = users.find(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'El nombre de usuario ya existe' });

  // Validar contraseña: 8+ caracteres, al menos una mayúscula, minúscula y número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!regex.test(password)) {
    return res.status(400).json({ error: 'Contraseña insegura' });
  }

  const newUser = { id: users.length + 1, username, password, role };
  users.push(newUser);

  res.status(201).json({ message: 'Usuario registrado correctamente', user: newUser });
};

module.exports = { registerUser, users };
