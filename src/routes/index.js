const express = require("express")
const route = express.Router()
const { addAudiencia, getAudience, getOne, editAudience, deleteAudience } = require('../controllers/index')


route.get('/audience', getAudience)
route.get('/audience/:id', getOne)
route.post("/add", addAudiencia)
route.put('/update/:id', editAudience)
route.delete('/delete/:id', deleteAudience)

module.exports = route;