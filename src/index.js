require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const connect = require("express-myconnection");
const route = require("./routes/index");
const routeActions = require("./routes/actionRoutes");
const cors = require("cors");
const multer = require("multer");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();




const PORT = process.env.PORT || 4002;
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mockdata",
};

// Multer configuration CSV

//Multer configuration IMG-DNI
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads", "img"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadImages = multer({ storage: imageStorage }).array("images", 2);

app.use(cors());
app.use(connect(mysql, dbConfig, "single"));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", route);
app.use("/", routeActions);

//upload IMG

app.post("/upload-images", (req, res) => {
  uploadImages(req, res, (err) => {
    if (err) {
      res.status(400).send("Ocurrió un error al cargar las imágenes");
      return;
    }

    if (!req.files || req.files.length !== 2) {
      res.status(400).send("Se deben proporcionar exactamente 2 imágenes");
      return;
    }

    const imageURLs = req.files.map((file, index) => {
      return req.protocol + "://" + req.get("host") + "/uploads/img/" + file.filename;
    });

    res.status(200).json({
      imageURL1: imageURLs[0] || null,
      imagelURL2: imageURLs[1] || null,
    });
  });
}); 

app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", "img", filename);
  
  res.download(filePath, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error al descargar el archivo");
    }
  });
});
//upload CSV



const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/uploads/csv/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const uploadCSV = multer({ storage: csvStorage }).single("import-csv");

//Función de parseo de datos
function uploadCsv(uriFile){
    let stream = fs.createReadStream(uriFile);
    let csvDataColl = [];
    let fileStream = csv
        .parse()
        .on("data", function (data) {
            csvDataColl.push(data);
        })
        .on("end", function () {
            csvDataColl.shift();
            
            pool.getConnection((error,connection) => {
                if (error) {
                    console.error(error);
                } else {
                    let query = 'INSERT INTO audiencia (status,name,lastname,email,phone,area,importation,added,emailsSent) VALUES ?';
                    connection.query(query, [csvDataColl], (error, res) => {
                        console.log(error || res);
                    });
                }
            });

            fs.unlinkSync(uriFile)
            
        });
  
    stream.pipe(fileStream);
}

//Petición Post
app.post('/import-csv', uploadCSV("import-csv"), (req, res) => {
  const uriFile = path.join(__dirname, 'uploads', req.file.filename);
  uploadCsv(uriFile);
  res.send("Data Subida a la DB");
});



const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: "syngentaDP@outlook.com",
    pass: "testeando123"
  }
})

function generarCodigoAlfanumerico(longitud) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    const randomIndex = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres.charAt(randomIndex);
  }
  return codigo;
}



//Mailer
app.post("/verify-code/:email/code", function(req, res) {

  const { email } = req.params;
  const codigoGenerado = generarCodigoAlfanumerico(5)


  transporter.sendMail({
    from: "syngentaDP@outlook.com",
    to: email,
    subject: "Codigo de seguridad: ",
    text: `Este es el codigo de seguridad para tu Onboarding de Digital Pension: ${ codigoGenerado }`
  })
  res.status(200).json({ ok: true, message: `Codigo enviado con éxito, tu codigo es: ${codigoGenerado}` })
})

app.post('/verify-code/:email/verify', (req, res) => {
  const { email } = req.params;
  const { code } = req.body; // El código ingresado por el usuario

  // Aquí es donde debes implementar la lógica para comparar el código ingresado
  // con el código almacenado en tu base de datos para el correo electrónico especificado.

  // Por ejemplo, si estás utilizando una base de datos, puedes realizar una consulta
  // para obtener el código almacenado asociado al correo electrónico.

  // Supongamos que obtienes el código almacenado en una variable llamada codigoAlmacenado.

  const codigoAlmacenado = 'código_de_ejemplo'; // Esto es solo un ejemplo, reemplázalo con la lógica real de tu base de datos.

  // Ahora compara el código ingresado con el código almacenado
  if (code === codigoAlmacenado) {
    // Si los códigos coinciden, respondemos con un estado de éxito (200) y un mensaje.
    res.status(200).json({ ok: true, message: 'Código verificado correctamente' });
  } else {
    // Si los códigos no coinciden, respondemos con un estado de error (400) y un mensaje.
    res.status(400).json({ ok: false, message: 'Código incorrecto' });
  }
});


app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
