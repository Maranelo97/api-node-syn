const express = require('express');
const apartmentRoutes = express.Router();

const { getAllApartments, deleteDepartment, createApartment, update } = require('../controllers/apartments');



apartmentRoutes.get('/apartments', getAllApartments);
apartmentRoutes.post("/apartments/create", createApartment);
apartmentRoutes.put("/updateDepartment/:id", update)
apartmentRoutes.delete("/deleteApartment/:id", deleteDepartment);

module.exports = apartmentRoutes;