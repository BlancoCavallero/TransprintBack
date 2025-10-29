const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const clientRoutes = require('./src/routes/clients');
const personRoutes = require('./src/routes/persons');
const documentationRoutes = require('./src/routes/documentations');
const driverRoutes = require('./src/routes/drivers');
const vehiculosRoutes = require("./src/routes/vehiculos");

const errorHandler = require("./src/middlewares/errorHandler");


const app = express();
app.use(cors()); // permite que el frontend estando en otro puerto pueda acceder
app.use(express.json());
//expongo la carpeta upload donde se subirán los archivos de las documentaciones 
//Todo lo que esté dentro de la carpeta /uploads puede ser accedido públicamente desde la URL /uploads/...
app.use('/uploads', express.static('uploads'));


app.use('/api', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/documentations', documentationRoutes);
app.use('/api/drivers', driverRoutes);
app.use("/api/vehiculos", vehiculosRoutes);

const localidadRoutes = require("./src/routes/localidades");
app.use("/api/localidades", localidadRoutes);




const vehiculosRoutes = require("./src/routes/vehiculos");
app.use("/api/vehiculos", vehiculosRoutes);

const viajesRoutes = require("./src/routes/viajes");
app.use("/viajes", viajesRoutes);

// Middleware global de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));