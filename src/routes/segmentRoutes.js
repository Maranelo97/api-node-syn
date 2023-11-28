const express = require("express");
const segmentRoutes = express.Router();


const { createSegment, updateSegment, deleteSegment, getAllSegments } = require("../controllers/segmentsController"); 

segmentRoutes.get("/getSegments", getAllSegments);
segmentRoutes.post("/addSegment", createSegment);
segmentRoutes.put("/updateSegment/:id", updateSegment);
segmentRoutes.delete('/deleteSegment/:id', deleteSegment)


module.exports = segmentRoutes;