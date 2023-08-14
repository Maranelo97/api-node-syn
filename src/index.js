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
      return (
        req.protocol + "://" + req.get("host") + "/uploads/img/" + file.filename
      );
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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads", "csv"));  // Cambiado el destino para guardar en la carpeta /csv
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});


const upload = multer({ storage: storage });


function uploadCsv(uriFile) {
  if (!fs.existsSync(uriFile)) {
    console.log("File does not exist:", uriFile);
    return;
  }

  let stream = fs.createReadStream(uriFile);
  let csvDataColl = [];
  let fileStream = csv
    .parse()
    .on("data", function (data) {
      csvDataColl.push(data);
    })
    .on("end", function () {
      csvDataColl.shift();

      pool.getConnection((error, connection) => {
        if (error) {
          console.error("Error en la conexión a la base de datos:", error);
          return;
        }

        let query =
          "INSERT INTO audiencia (status,name,lastname,email,phone,area,importation,added,emailsSent) VALUES ?";
        connection.query(query, [csvDataColl], (error, res) => {
          if (error) {
            console.error("Error en la consulta SQL:", error);
          } else {
            console.log("Filas insertadas:", res.affectedRows);
          }
          connection.release();
        });
      });

      fs.unlinkSync(uriFile);
    });

  stream.pipe(fileStream);
}


//Petición Post
app.post('/import-csv', upload.single("import-csv"), (req, res) => {
  if (!req.file) {
    res.status(400).send("Se debe proporcionar un archivo CSV");
    return;
  }

  const uriFile = path.join(__dirname, "uploads", "csv", req.file.filename);
  uploadCsv(uriFile);

  // Imprime información sobre la respuesta
  console.log("Response Status:", res.statusCode);
  console.log("Response Headers:", res.getHeaders());

  // Escucha el evento "finish" para imprimir el cuerpo de la respuesta
  res.on('finish', () => {
    console.log("Response Body:", res.get("Data Subida a la DB"));
  });

  res.send("Data Subida a la DB");
});





const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: "syngentaDP@outlook.com",
    pass: "testeando123",
  },
});

function generarCodigoAlfanumerico(longitud) {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";
  for (let i = 0; i < longitud; i++) {
    const randomIndex = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres.charAt(randomIndex);
  }
  return codigo;
}

//Mailer
app.post("/verify-code/:email/code", async function (req, res) {
  const { email } = req.params;
  const codigoGenerado = generarCodigoAlfanumerico(5);

  transporter.sendMail({
    from: "syngentaDP@outlook.com",
    to: email,
    subject: "Codigo de seguridad",
    text: `Este es el código de seguridad para tu Onboarding de Digital Pension: ${codigoGenerado}`,
  });

  try {
    const connection = await mysql.createConnection(dbConfig);

    const query = "INSERT INTO codigos (email, codigo) VALUES (?, ?)";
    await connection.execute(query, [email, codigoGenerado]);

    res.status(200).json({
      ok: true,
      message: `Código enviado con éxito, tu código es: ${codigoGenerado}`,
    });
  } catch (error) {
    console.error("Error al insertar código en la base de datos:", error);
    res.status(500).json({ ok: false, message: "Error al enviar el código" });
  }
});


const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads", "pdfs"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadPDFs = multer({ storage: pdfStorage }).single("pdf");



app.post("/upload-pdf", (req, res) => {
  uploadPDFs(req, res, (err) => {
    if (err) {
      console.error("Error al cargar el archivo PDF:", err);
      res.status(400).send("Ocurrió un error al cargar el archivo PDF");
      return;
    }

    if (!req.file) {
      res.status(400).send("Se debe proporcionar un archivo PDF");
      return;
    }

    const pdfURL = "https://" + req.get("host") + "/uploads/pdfs/" + req.file.filename;


    res.status(200).json({
      pdfURL: pdfURL,
    });
  });
});





app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
