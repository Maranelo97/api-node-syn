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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/uploads/csv");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
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
const upload = multer({ storage: storage });
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
      imagelURL2: imagelURLs[1] || null,
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

//upload csv
app.post("/import-csv", upload.single("import-csv"), (req, res) => {
  const csvDataColl = [];
  const stream = fs.createReadStream(req.file.path);

  const fileStream = csv
    .parse()
    .on("data", (data) => {
      csvDataColl.push(data);
    })
    .on("end", () => {
      csvDataColl.shift();
      const query =
        "INSERT INTO audiencia (status,name,lastname,email,phone,area,importation,added, emailsSent) VALUES ? ";

      req.getConnection((err, connection) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
          return;
        }

        connection.query(query, [csvDataColl], (err, rows, fields) => {
          if (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
          } else {
            console.log("Rows inserted:", rows.affectedRows);
            res.send("Data Subida a la DB");
          }

          fs.unlinkSync(req.file.path);
        });
      });
    });

  stream.pipe(fileStream);
});

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
