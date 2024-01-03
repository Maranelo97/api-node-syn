const express = require('express');
const templateRouter = express.Router();

const { getAllTemplates } = require('../controllers/templatesControllers')

templateRouter.get('/getAllTemplates', getAllTemplates);

module.exports = templateRouter;