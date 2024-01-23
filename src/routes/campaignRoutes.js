const express = require("express");
const { createCampaign, updateCampaign, deleteCampaigns, getAllCampaigns } = require("../controllers/campaignController");
const campaignRoutes = express.Router();

const allowOnlyFromSpecificOrigin = (req, res, next) => {
const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar'];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        return next();
    }
return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
};


campaignRoutes.use(allowOnlyFromSpecificOrigin)

campaignRoutes.get("/campaigns", getAllCampaigns);
campaignRoutes.post("/createCampaign", createCampaign);
campaignRoutes.put("/modifyCampaign/:id", updateCampaign);
campaignRoutes.delete("/deleteCampaign/:id", deleteCampaigns);


module.exports = campaignRoutes;