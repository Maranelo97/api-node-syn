const express = require("express");
const segmentRoutes = express.Router();


const { createSegment, updateSegment, deleteSegment } = require("../controllers/segmentsController"); 


segmentRoutes.post("/addSegment", createSegment);
segmentRoutes.put("/updateSegment/:id", updateSegment);
segmentRoutes.delete('/deleteSegment/:id', deleteSegment)


module.exports = segmentRoutes;