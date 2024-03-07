const express = require('express');
const routeUser = express.Router();

const { loginUser, createUser, updatePass, getAllUsers, deleteUser, update } = require('../controllers/ussersControllers');


routeUser.post('/login', loginUser);
routeUser.get('/getUssers', getAllUsers);
routeUser.post('/user/create', createUser);
routeUser.put('/user/update/:id', update);
routeUser.put('/user/changePassword/:id', updatePass);
routeUser.delete('/deleteUser/:id', deleteUser);

module.exports = routeUser;