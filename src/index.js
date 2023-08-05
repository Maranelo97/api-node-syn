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
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/uploads/csv");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
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
const uploadCSV = multer({ storage: csvStorage }).single("import-csv");
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
const columnsToInsert = ["status", "name", "lastname", "email", "phone", "area", "importation", "added", "emailsSent"];

app.post("/import-csv", (req, res) => {
  uploadCSV(req, res, (err) => {
    if (err) {
      res.status(400).send("Ocurrió un error al cargar el archivo CSV");
      return;
    }

    if (!req.file) {
      res.status(400).send("Se debe proporcionar un archivo CSV");
      return;
    }

    const csvDataColl = [];
    const stream = fs.createReadStream(req.file.path);

    const fileStream = csv
      .parse({ headers: true }) // Indica que la primera fila es el encabezado con los nombres de las columnas
      .on("data", (data) => {
        // Si alguna columna no está presente en el archivo CSV, se le asigna valor null.
        const rowData = {};
        columnsToInsert.forEach((column) => {
          rowData[column] = data[column] || null;
        });
        csvDataColl.push(Object.values(rowData));
      })
      .on("end", () => {
        // Realiza la inserción en la base de datos
        const query = `INSERT INTO audiencia (${columnsToInsert.join(', ')}) VALUES ?`;

        req.getConnection((err, connection) => {
          if (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
            return;
          }

          connection.query(query, [csvDataColl], (err, result) => {
            if (err) {
              console.error(err);
              res.status(500).send("Internal Server Error");
            } else {
              console.log("Rows inserted:", result.affectedRows);
              res.send("Data Subida a la DB");
            }

            fs.unlinkSync(req.file.path);
          });
        });
      });

    stream.pipe(fileStream);
  });
});


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


app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
