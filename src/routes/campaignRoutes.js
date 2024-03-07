const express = require("express");
const { createCampaign, updateCampaign, deleteCampaigns, getAllCampaigns } = require("../controllers/campaignController");
const campaignRoutes = express.Router();


campaignRoutes.get("/campaigns", getAllCampaigns);
campaignRoutes.post("/createCampaign", createCampaign);
campaignRoutes.put("/modifyCampaign/:id", updateCampaign);
campaignRoutes.delete("/deleteCampaign/:id", deleteCampaigns);


module.exports = campaignRoutes;