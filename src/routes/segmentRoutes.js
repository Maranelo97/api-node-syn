const express = require("express");
const segmentRoutes = express.Router();


const { createSegment, updateSegment, deleteSegment, getAllSegments } = require("../controllers/segmentsController"); 

const allowOnlyFromSpecificOrigin = (req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar', 'http://localhost:5173', 'https://api.pensionplan.com.ar', 'https://checklyapp.com']; // Agrega la dirección de origen de Checkly
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    return next();
  }
  return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
};
  
  
  segmentRoutes.use(allowOnlyFromSpecificOrigin)

segmentRoutes.get("/getSegments", getAllSegments);
segmentRoutes.post("/addSegment", createSegment);
segmentRoutes.put("/updateSegment/:id", updateSegment);
segmentRoutes.delete('/deleteSegment/:id', deleteSegment)


module.exports = segmentRoutes;