const express = require('express');
const routeUser = express.Router();

const { loginUser, createUser, updatePassword } = require('../controllers/ussersControllers');

routeUser.post('/login', loginUser);
routeUser.post('/user/create', createUser);
routeUser.put('/user/changePassword', updatePassword);

module.exports = routeUser;