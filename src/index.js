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
const tinyurl = require('tinyurl');
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

    io.emit("server:modificado", data);
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
  const audienceData = req.body;
  const importName = req.body.importName;

  req.getConnection((err, connect) => {
    if (err) {
      console.error("Error en la conexión a la base de datos:", err);
      return res.status(500).json({
        ok: false,
        message: "Error en la conexión a la base de datos",
      });
    }

    connect.beginTransaction((transactionErr) => {
      if (transactionErr) {
        console.error("Error al iniciar la transacción:", transactionErr);
        return res.status(500).json({
          ok: false,
          message: "Error al iniciar la transacción",
          error: transactionErr.message,
        });
      }

      const insertQuery =
        "INSERT INTO audiencia (name, lastname, province, email, phone, dni) VALUES (?, ?, ?, ?, ?, ?)";

      Promise.all(
        audienceData.map((data) => {
          const { name, lastname, province, email, phone, dni } = data;
          return new Promise((resolve, reject) => {
            connect.query(
              insertQuery,
              [name, lastname, province, email, phone, dni],
              (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              }
            );
          });
        })
      )
        .then(() => {
          const importedRows = audienceData.length;

          const importInsertQuery =
            "INSERT INTO imports (importName, importedRows) VALUES (?, ?)";
          connect.query(
            importInsertQuery,
            [importName, importedRows],
            (err, result) => {
              if (err) {
                connect.rollback(() => {
                  console.error("Error al hacer rollback:", err);
                  res.status(500).json({
                    ok: false,
                    message: "Error al registrar la importación",
                    error: err.message,
                  });
                });
              } else {
                connect.commit((commitErr) => {
                  if (commitErr) {
                    connect.rollback(() => {
                      console.error(
                        "Error al hacer commit de la transacción:",
                        commitErr
                      );
                      res.status(500).json({
                        ok: false,
                        message: "Error al hacer commit de la transacción",
                        error: commitErr.message,
                      });
                    });
                  } else {
                    res.status(200).json({
                      ok: true,
                      message:
                        "Datos insertados correctamente en la tabla de audiencia y se registró la importación",
                    });
                    io.emit("server:audienceInserted", {
                      importName,
                      importedRows: audienceData.length,
                    });
                  }
                });
              }
            }
          );
        })
        .catch((error) => {
          connect.rollback(() => {
            console.error(
              "Error al insertar datos en la base de datos:",
              error
            );
            res.status(500).json({
              ok: false,
              message: "Error al insertar datos en la base de datos",
              error: error.message,
            });
          });
        });
    });
  });
});

//Envio y Enlace de Validación Post Formulario

function generarTokenUnico(length = 8) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}



app.post("/token-account/:email/link", async function (req, res) {
  try {
    const { email } = req.params;
    const { pdfURL } = req.body;

    const linkToken = generarTokenUnico();
    const fullLink = `https://api-node-syn-production.up.railway.app/token-account/${linkToken}/toPendent`;

    try {
      // Acorta la URL con TinyURL
      tinyurl.shorten(fullLink, async (tinyURLResponse) => {
        if (tinyURLResponse.startsWith('Error')) {
          console.error("Error al acortar el enlace:", tinyURLResponse);
          res.status(500).send("Error al acortar el enlace.");
          return;
        }

        const shortLink = tinyURLResponse;

        const mailOptions = {
          from: '"Syngenta Digital Pension" <syngentaDP@outlook.com>',
          to: email,
          subject: "Confirmación de cuenta",
          html: `
            <p>¡Hola!</p>
            <p>Clickea en este enlace para terminar el proceso: <a href="${shortLink}">Link de Confirmación</a> Al clickear aqui podrás recibir los beneficios de Syngenta Digital Pension</p>
            <p>Adjunto encontrarás el PDF de tu declaración jurada.</p>
          `,
          attachments: [
            {
              filename: "Declaración Jurada Digital Pension.pdf",
              href: pdfURL,
            },
          ],
        };

        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).send("Hubo un error al enviar el correo.");
          } else {
            try {
              const connection = await mysql.createConnection(dbConfig);

              const query =
                "INSERT INTO codigos (email, codigo, token, enlace_acortado) VALUES (?, DEFAULT, ?, ?)";
              await connection.execute(query, [email, linkToken, shortLink]);

              console.log("Correo enviado: " + info.response);
              res.status(200).json({
                ok: true,
                message: `Código enviado con éxito, tu código es: ${shortLink}`,
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
    } catch (error) {
      console.error("Error al acortar el enlace:", error);
      res.status(500).send("Error en el servidor al acortar el enlace.");
    }
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

app.get("/:linkToken/toPending", (req, res) => {
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
        console.error("Error al seleccionar email:", selectErr);
        res.status(500).send("Error al seleccionar el email.");
        return;
      }

      if (selectResults.length === 0) {
        res.status(404).send("Token no válido.");
        return;
      }

      const email = selectResults[0].email;

      // Actualizar el estado en la base de datos
      const updateQuery = "UPDATE audiencia SET status = 'pendiente' WHERE email = ?";
      connection.query(updateQuery, [email], (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Error al actualizar estado:", updateErr);
          res.status(500).send("Error al actualizar el estado.");
          return;
        }

        // Construir la URL completa a la página de confirmación
        const confirmationPageURL = `https://tu-sitio-web.com/confirmation/${email}`;

        // Redireccionar a la página de confirmación
        res.redirect(confirmationPageURL);
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

app.put("/accept/:id", (req, res) => {
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
      aprobbed: new Date(Date.now()),
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
            const accionId = 3;

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
                            io.emit("server:aprobado", dataToBeChangedd);
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
});

server.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
