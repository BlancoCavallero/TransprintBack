const mantenimientoRoutes = require('./routes/mantenimientos');

const app = express();

app.use('/api/mantenimientos', mantenimientoRoutes);