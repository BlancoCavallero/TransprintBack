const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const clientRoutes = require('./src/routes/clients');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));