const express = require('express');
const { registerAuthUser } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerAuthUser);

module.exports = router;
