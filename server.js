const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const clientRoutes = require('./src/routes/clients');
const errorHandler = require("./src/middlewares/errorHandler");


const app = express();
app.use(cors()); // permite que el frontend estando en otro puerto pueda acceder
app.use(express.json());

app.use('/api', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);

// Middleware global de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));