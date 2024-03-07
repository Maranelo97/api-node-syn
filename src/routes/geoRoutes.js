const express = require("express");
const routeGeo = express.Router();
const { getByZip, addZip, getAll, deleteCode, updateGeo } = require("../controllers/geoRef");


routeGeo.get('/allZip', getAll);
routeGeo.get('/getByZipCode/:cp', getByZip);
routeGeo.post('/addZipCode', addZip);
routeGeo.put('/update/:id', updateGeo);
routeGeo.delete('/deleteZip/:id', deleteCode);

module.exports = routeGeo;