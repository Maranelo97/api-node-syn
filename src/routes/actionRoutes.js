const express = require('express');
const routeActions = express.Router()
const { realizarAction, getHistorialActions } = require('../controllers/actions')

routeActions.post('/action', realizarAction);
routeActions.get('/historialActions/:registroId', getHistorialActions);

module.exports = routeActions;