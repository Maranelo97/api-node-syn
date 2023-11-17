const express = require('express');
const apartmentRoutes = express.Router();

const { getAllApartments } = require('../controllers/apartments');

apartmentRoutes.get('/apartments', getAllApartments);

module.exports = apartmentRoutes;