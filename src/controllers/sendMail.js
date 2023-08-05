const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "SyngtTest@gmail.com",
    pass: "negromg555",
  },
});

const enviarCorreo = async (email, link) => {
  try {

      // Configurar el mensaje del correo
      const mensajeCorreo = {
        from: 'Tu Nombre <tu_email@gmail.com>',
        to: email,
        subject: 'Confirmación de datos',
        html: `
          <p>Hola,</p>
          <p>Gracias por completar el formulario. Haz clic en el siguiente enlace para confirmar los datos:</p>
          <a href="${link}">Confirmar datos</a>
          <p>Si no completaste ningún formulario, ignora este mensaje.</p>
        `,
      };
  

      const info = await transporter.sendMail(mensajeCorreo);
  
      console.log('Correo enviado:', info.response);
  } catch (err) {
    console.log(err);
  }
};


module.exports = enviarCorreo;