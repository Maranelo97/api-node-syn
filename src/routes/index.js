const express = require("express")
const route = express.Router()
const { addAudiencia, getAudience, editAudience, deleteAudience, getByDni, aceptarSub, rechazarSub } = require('../controllers/index')


route.get('/audience', getAudience)
route.get('/audience/:dni', getByDni)
route.post("/add", addAudiencia)
route.put('/update/:id', editAudience)
route.put('/acceptSub/:id', aceptarSub)
route.put('/reject-sub/:id', rechazarSub)
route.delete('/delete/:id', deleteAudience)

module.exports = route;