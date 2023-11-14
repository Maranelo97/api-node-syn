const express = require('express');
const routeUser = express.Router();

const { loginUser, createUser, update, getAllUsers, deleteUser } = require('../controllers/ussersControllers');

routeUser.post('/login', loginUser);
routeUser.get('/getUssers', getAllUsers);
routeUser.post('/user/create', createUser);
routeUser.put('/user/changePassword', update);
routeUser.delete('/deleteUser/:id', deleteUser);

module.exports = routeUser;