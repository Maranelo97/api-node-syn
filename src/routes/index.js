const express = require("express")
const route = express.Router()
const { addAudiencia, getAudience, editAudience, deleteAudience, getByDni } = require('../controllers/index')
const { sendEmail } = require('../controllers/sendMail');


route.get('/audience', getAudience)
route.get('/audience/:dni', getByDni)
route.post("/add", addAudiencia)
router.post('/procesar', async (req, res) => {
    try {
      // Obtenemos el enlace codificado y el correo desde el cuerpo de la solicitud
      const { enlaceCodificado, email } = req.body;
  
      // Procesar el enlaceCodificado, por ejemplo, decodificar los datos
      // ...
  
      // Enviar el correo al usuario
      await enviarCorreoUsuario(email, enlaceCodificado);
  
      // Otras operaciones relacionadas con guardar datos en la base de datos
      // ...
  
      res.json({ message: 'Correo enviado y datos procesados correctamente' });
    } catch (error) {
      console.error('Error al procesar datos y enviar el correo:', error);
      res.status(500).json({ error: 'Error al procesar datos y enviar el correo' });
    }
  });
  
route.put('/update/:id', editAudience)
route.delete('/delete/:id', deleteAudience)

module.exports = route;