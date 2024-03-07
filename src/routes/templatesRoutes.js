const express = require('express');
const templateRouter = express.Router();

const { getAllTemplates, createTemplate } = require('../controllers/templatesControllers')


templateRouter.get('/getAllTemplates', getAllTemplates);
templateRouter.post('/createTemplate', createTemplate);

module.exports = templateRouter;