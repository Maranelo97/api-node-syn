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
  app.put("/update/:id", (req, res) => {
    {
      req.getConnection((err, connect) => {
        if (err) return res.send(err);

        const dataToBeChangedd = {
          dni: req.body.dni,
          cuil: req.body.cuil,
          name: req.body.name,
          area: req.body.area,
          status: req.body.status,
          lastname: req.body.lastname,
          email: req.body.email,
          emailSyngenta: req.body.emailSyngenta,
          phone: req.body.phone,
          phone2: req.body.phone2,
          importation: req.body.importation,
          added: new Date(req.body.added),
          address: req.body.address,
          address2: req.body.address2,
          location: req.body.location,
          province: req.body.province,
          zipCode: req.body.zipCode,
          ingress: new Date(req.body.ingress),
          dob: new Date(req.body.dob),
          imageURL1: req.body.imageURL1,
          imagelURL2: req.body.imagelURL2,
          aports: req.body.aports,
          profile: req.body.profile,
          onBoarding: req.body.onBoarding,
          pdfURL: req.body.pdfURL,
        };

        // Iniciar transacción
        connect.beginTransaction((err) => {
          if (err) return res.send(err);

          // Obtener el registro actual
          connect.query(
            "SELECT * FROM audiencia WHERE id = ?",
            [req.params.id],
            (err, currentRecord) => {
              if (err) {
                connect.rollback(() => {
                  res.send(err);
                });
              } else {
                const registroId = req.params.id;
                const accionId = 2; // Valor de la acción para la edición (ejemplo: 2 para "Editó")

                // Insertar en la tabla de registros_acciones
                const nuevaAccion = {
                  accionId,
                  registroId,
                  fecha: new Date(),
                };

                connect.query(
                  "INSERT INTO registros_acciones SET ?",
                  nuevaAccion,
                  (err, result) => {
                    if (err) {
                      connect.rollback(() => {
                        res.send(err);
                      });
                    } else {
                      // Actualizar el registro en la tabla de audiencia
                      connect.query(
                        "UPDATE audiencia SET ? WHERE id = ?",
                        [dataToBeChangedd, req.params.id],
                        (err, updateResult) => {
                          if (err) {
                            connect.rollback(() => {
                              res.send(err);
                            });
                          } else {
                            // Commit de la transacción
                            connect.commit((err) => {
                              if (err) {
                                connect.rollback(() => {
                                  res.send(err);
                                });
                              } else {
                                res.send("Actualizado");
                                io.emit("modificado", req.params.id);
                              }
                            });
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        });
      });
    }
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

//Envio y Enlace de Validación Post Formulario

function generarTokenUnico(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

app.post("/send-link/:email/link", async function (req, res) {
  const { email } = req.params;
  const linkToken = generarTokenUnico(); // Genera un token único para el enlace

  const link = `https://api-node-syn-production.up.railway.app/verify-link/${linkToken}`; // Reemplaza "tudominio.com" por tu dominio real

  // Puedes personalizar el contenido del correo con el enlace
  const mailOptions = {
    from: '"Syngenta Digital Pension" <syngentaDP@outlook.com>',
    to: email,
    subject: "Enlace de verificación",
    text: `Haz clic en el siguiente enlace para verificar tu cuenta: ${link}`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Hubo un error al enviar el correo.");
    } else {
      try {
        const connection = await mysql.createConnection(dbConfig);

        const query =
          "INSERT INTO codigos (email, token, codigo) VALUES (?, ?, DEFAULT)";
        await connection.execute(query, [email, linkToken]);

        console.log("Correo enviado: " + info.response);
        res.status(200).json({
          ok: true,
          message: "Enlace enviado con éxito. Por favor verifica tu correo.",
        });
      } catch (error) {
        console.error("Error al insertar enlace en la base de datos:", error);
        res
          .status(500)
          .json({ ok: false, message: "Error al enviar el enlace" });
      }
    }
  });
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
