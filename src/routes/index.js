const express = require("express")
const route = express.Router()
const { addAudiencia, getAudience, editAudience, deleteAudience, getByDni } = require('../controllers/index')


route.get('/audience', getAudience)
route.get('/audience/:dni', getByDni)
route.post("/add", addAudiencia)
route.put('/update/:id', editAudience)
route.delete('/delete/:id', deleteAudience)

module.exports = route;