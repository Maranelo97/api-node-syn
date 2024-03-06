const express = require('express');
const templateRouter = express.Router();

const { getAllTemplates, createTemplate } = require('../controllers/templatesControllers')

const allowOnlyFromSpecificOrigin = (req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar', 'http://localhost:5173', 'https://api.pensionplan.com.ar', 'https://checklyapp.com']; // Agrega la dirección de origen de Checkly
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    return next();
  }
  return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
};
  
  
  templateRouter.use(allowOnlyFromSpecificOrigin)

templateRouter.get('/getAllTemplates', getAllTemplates);
templateRouter.post('/createTemplate', createTemplate);

module.exports = templateRouter;