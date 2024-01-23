const express = require("express");
const routeGeo = express.Router();
const { getByZip, addZip, getAll, deleteCode, updateGeo } = require("../controllers/geoRef");

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

routeGeo.get('/allZip', getAll);
routeGeo.get('/getByZipCode/:cp', getByZip);
routeGeo.post('/addZipCode', addZip);
routeGeo.put('/update/:id', updateGeo);
routeGeo.delete('/deleteZip/:id', deleteCode);

module.exports = routeGeo;