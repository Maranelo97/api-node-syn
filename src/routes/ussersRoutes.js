const express = require('express');
const routeUser = express.Router();

const { loginUser, createUser, updatePass, getAllUsers, deleteUser, update } = require('../controllers/ussersControllers');

const allowOnlyFromSpecificOrigin = (req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar'];
    const origin = req.headers.origin;
  
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        return next();
    }
  
    return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
  };
  
  
routeUser.use(allowOnlyFromSpecificOrigin)
routeUser.post('/login', loginUser);
routeUser.get('/getUssers', getAllUsers);
routeUser.post('/user/create', createUser);
routeUser.put('/user/update/:id', update);
routeUser.put('/user/changePassword/:id', updatePass);
routeUser.delete('/deleteUser/:id', deleteUser);

module.exports = routeUser;