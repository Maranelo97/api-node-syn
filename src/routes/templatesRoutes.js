const express = require('express');
const templateRouter = express.Router();

const { getAllTemplates } = require('../controllers/templatesControllers')

const allowOnlyFromSpecificOrigin = (req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar'];
    const origin = req.headers.origin;
  
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        return next();
    }
  
    return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
  };
  
  
  route.use(allowOnlyFromSpecificOrigin)

templateRouter.get('/getAllTemplates', getAllTemplates);

module.exports = templateRouter;