require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const connect = require("express-myconnection");
const route = require("./routes/index");
const routeActions = require("./routes/actionRoutes");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("client conected");

  socket.on("client:modificado", (data) => {
    console.log(data);

    io.emit("server:modificado", data)
  });
});

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

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: "syngentaDP@outlook.com",
    pass: "testeando123",
  },
});
app.post("/verify-code/:email/code", async function (req, res) {
  const { email } = req.params;
  const codigoGenerado = generarCodigoAlfanumerico(5);

  const mailOptions = {
    from: '"Syngenta Digital Pension" <syngentaDP@outlook.com>',
    to: email,
    subject: "Codigo de seguridad",
    text: `Este es el código de seguridad para tu Onboarding de Digital Pension: ${codigoGenerado}`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Hubo un error al enviar el correo.");
    } else {
      try {
        const connection = await mysql.createConnection(dbConfig);

        const query = "INSERT INTO codigos (email, codigo) VALUES (?, ?)";
        await connection.execute(query, [email, codigoGenerado]);

        console.log("Correo enviado: " + info.response);
        res.status(200).json({
          ok: true,
          message: `Código enviado con éxito, tu código es: ${codigoGenerado}`,
        });
      } catch (error) {
        console.error("Error al insertar código en la base de datos:", error);
        res
          .status(500)
          .json({ ok: false, message: "Error al enviar el código" });
      }
    }
  });
});

app.get("/verify-code/:codigo", (req, res) => {
  const { codigo } = req.params;

  req.getConnection((err, connect) => {
    if (err) {
      console.error("Error en la conexión a la base de datos:", err);
      return res.status(500).json({
        ok: false,
        message: "Error en la conexión a la base de datos",
      });
    }

    const query = "SELECT * FROM codigos WHERE codigo = ?";
    connect.query(query, [codigo], (err, result) => {
      if (err) {
        console.error("Error en la consulta a la base de datos:", err);
        return res.status(500).json({
          ok: false,
          message: "Error en la consulta a la base de datos",
        });
      }

      if (result.length === 0) {
        return res.status(400).json({ ok: false, message: "Código no válido" });
      }

      res.status(200).json({
        ok: true,
        message: "Código válido",
      });
    });
  });
});

app.post("/insert-audience", (req, res) => {
  const audienceData = req.body; // Supongo que estás enviando los datos como un array de objetos desde el cliente

  req.getConnection((err, connect) => {
    if (err) {
      console.error("Error en la conexión a la base de datos:", err);
      return res.status(500).json({
        ok: false,
        message: "Error en la conexión a la base de datos",
      });
    }

    const insertQuery = "INSERT INTO audiencia (name, lastname, province, email, phone) VALUES (?, ?, ?, ?, ?)";

    // Usamos Promise.all para asegurarnos de que todas las inserciones se completen antes de responder
    Promise.all(
      audienceData.map(data => {
        const { name, lastname, province, email, phone } = data;
        return new Promise((resolve, reject) => {
          connect.query(insertQuery, [name, lastname, province, email, phone], (err, result) => {
            if (err) {
              console.error("Error al insertar datos en la base de datos:", err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
    )
      .then(() => {
        res.status(200).json({
          ok: true,
          message: "Datos insertados correctamente en la tabla de audiencia",
        });
      })
      .catch(error => {
        res.status(500).json({
          ok: false,
          message: "Error al insertar datos en la base de datos",
          error: error.message
        });
      });
  });
});

//Envio y Enlace de Validación Post Formulario

function generarTokenUnico(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

app.post("/token-account/:email/link", async function (req, res) {
  try {
    const { email } = req.params;
    const { pdfURL } = req.body; // Recupera la URL del PDF adjunto desde el cuerpo de la solicitud
    
    const linkToken = generarTokenUnico(); // Genera un token único para el enlace
    
   const link = `https://api-node-syn-production.up.railway.app/token-account/${linkToken}/toPendent`;
; // URL de confirmación
    // Adjuntar el PDF al correo
    const mailOptions = {
      from: '"Syngenta Digital Pension" <syngentaDP@outlook.com>',
      to: email,
      subject: "Confirmación de cuenta",
      html: `
        <p>¡Hola!</p>
        <p>Clickea en este enlace para terminar el proceso: <a href="test">Link de confirmacion</a> Al clickear aqui podrás recibir los beneficios de Syngenta Digital Pension</p>
        <p>Adjunto encontrarás el PDF de tu declaración jurada.</p>
      `,
      attachments: [
        {
          filename: "Declaración Jurada Digital Pension.pdf", 
          href: pdfURL 
        }
      ]
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send("Hubo un error al enviar el correo.");
      } else {
        try {
          const connection = await mysql.createConnection(dbConfig);

          const query = "INSERT INTO codigos (email, codigo, token) VALUES (?, DEFAULT, ?)";
          await connection.execute(query, [email, link]);

          console.log("Correo enviado: " + info.response);
          res.status(200).json({
            ok: true,
            message: `Código enviado con éxito, tu código es: ${link}`,
          });
        } catch (error) {
          console.error("Error al insertar código en la base de datos:", error);
          res
            .status(500)
            .json({ ok: false, message: "Error al enviar el código" });
        }
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error en el servidor.");
  }
});



app.get("/verify-link/:token", (req, res) => {
  const { token } = req.params;

  req.getConnection((err, connection) => {
    if (err) {
      console.error("Error en la conexión a la base de datos:", err);
      return res.status(500).json({
        ok: false,
        message: "Error en la conexión a la base de datos",
      });
    }

    const query = "SELECT * FROM codigos WHERE token = ?";
    connection.query(query, [token], (err, results) => {
      if (err) {
        console.error("Error en la consulta a la base de datos:", err);
        return res.status(500).json({
          ok: false,
          message: "Error en la consulta a la base de datos",
        });
      }

      if (results.length === 0) {
        return res.status(400).json({
          ok: false,
          message: "Token no válido o expirado",
        });
      }

      res.status(200).json({
        ok: true,
        token: token,
        message: "Token verificado con éxito",
      });
    });
  });
});

app.get("/token-account/:linkToken/toPendent", (req, res) => {
  const { linkToken } = req.params;

  req.getConnection((err, connection) => {
    if (err) {
      console.error("Error de conexión:", err);
      res.status(500).send("Error de conexión a la base de datos.");
      return;
    }

    const selectQuery = "SELECT email FROM codigos WHERE token = ?";
    connection.query(selectQuery, [linkToken], (selectErr, selectResults) => {
      if (selectErr) {
        console.error("Error al seleccionar token:", selectErr);
        res.status(500).send("Error al seleccionar el token.");
        return;
      }

      if (selectResults.length === 0) {
        res.status(404).send("Token no válido.");
        return;
      }

      const email = selectResults[0].email;
      const updateQuery = "UPDATE audiencia SET status = 'pendiente' WHERE email = ?";
      connection.query(updateQuery, [email], (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Error al actualizar estado:", updateErr);
          res.status(500).send("Error al actualizar el estado.");
          return;
        }

        res.status(200).send("Cuenta confirmada correctamente.");
      });
    });
  });
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

    const pdfURL =
      "https://" + req.get("host") + "/uploads/pdfs/" + req.file.filename;

    res.status(200).json({
      pdfURL: pdfURL,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
