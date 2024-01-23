const express = require('express');
const apartmentRoutes = express.Router();

const { getAllApartments, deleteDepartment, createApartment, update } = require('../controllers/apartments');

const allowOnlyFromSpecificOrigin = (req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar'];
    const origin = req.headers.origin;
  
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        return next();
    }
  
    return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
  };
  
  
apartmentRoutes.use(allowOnlyFromSpecificOrigin)

apartmentRoutes.get('/apartments', getAllApartments);
apartmentRoutes.post("/apartments/create", createApartment);
apartmentRoutes.put("/updateDepartment/:id", update)
apartmentRoutes.delete("/deleteApartment/:id", deleteDepartment);

module.exports = apartmentRoutes;