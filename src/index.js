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
const tinyurl = require("tinyurl");
const server = http.createServer(app);
const { Server } = require("socket.io");
const hbs = require("nodemailer-express-handlebars");
const routeGeo = require("./routes/geoRoutes");
const routeUser = require('./routes/ussersRoutes');
const apartmentRoutes = require('./routes/apartmentsRoutes');
const segmentRoutes = require("./routes/segmentRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const templateRoutes = require("./routes/templatesRoutes")
const handleBarOptions = {
  viewEngine: {
    extName: ".html",
    partialsDir: path.resolve(__dirname, "views"),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, "views"),
  extName: ".handlebars",
};
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("view engine", "ejs");

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
app.use('/', routeUser)
app.use("/", routeActions);
app.use("/", routeGeo);
app.use('/', apartmentRoutes);
app.use('/', segmentRoutes);
app.use("/", campaignRoutes);
app.use("/", templateRoutes)

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

app.get("/downloadPDF/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", "pdfs", filename);

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
    user: process.env.user,
    pass: process.env.pass,
  },
});
transporter.use("compile", hbs(handleBarOptions));

app.post("/verify-code/:email/code/:dni", async function (req, res) {
  const { email, dni } = req.params;
  const codigoGenerado = generarCodigoAlfanumerico(5);

  const mailOptions = {
    from: '"Syngenta Pension Plan" <no-reply@pensionplan.com.ar>',
    to: email,
    subject: "Codigo de seguridad",
    template: "syn01",
    context: {
      codigo: codigoGenerado,
    },
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Hubo un error al enviar el correo.");
    } else {
      try {
        const connection = await mysql.createConnection(dbConfig);

        const query =
          "INSERT INTO codigos (email, codigo, dni) VALUES (?, ?, ?)";
        await connection.execute(query, [email, codigoGenerado, dni]);

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
  const { importName, importedRows, records } = req.body; // Desestructura los campos

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
        "INSERT INTO audiencia (name, lastname, province, email, phone, dni, address, address2, zipCode, location, emailSyngenta, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const accionId = 15; // Nuevo valor de accionId

      Promise.all(
        records.map((data) => {
          const {
            name,
            lastname,
            province,
            email,
            phone,
            dni,
            address,
            address2,
            zipCode,
            location,
            emailSyngenta,
            area,
          } = data;
          return new Promise((resolve, reject) => {
            connect.query(
              insertQuery,
              [
                name,
                lastname,
                province,
                email,
                phone,
                dni,
                address,
                address2,
                zipCode,
                location,
                emailSyngenta,
                area,
              ],
              (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  const registroId = result.insertId;
                  const nuevaAccion = {
                    accionId,
                    registroId,
                    importName, // Agrega el importName como parte de la acción
                    fecha: new Date(),
                  };

                  connect.query(
                    "INSERT INTO registros_acciones SET ?",
                    nuevaAccion,
                    (err, result) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve(result);
                      }
                    }
                  );
                }
              }
            );
          });
        })
      )
        .then(() => {
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
                      importName,
                    });
                    io.emit("server:audienceInserted", {
                      importName,
                      importedRows: records.length,
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
    const fullLink = `https://api.pensionplan.com.ar/${linkToken}/toPending`;

    try {
      // Acorta la URL con TinyURL
      tinyurl.shorten(fullLink, async (tinyURLResponse) => {
        if (tinyURLResponse.startsWith("Error")) {
          console.error("Error al acortar el enlace:", tinyURLResponse);
          res.status(500).send("Error al acortar el enlace.");
          return;
        }

        const shortLink = tinyURLResponse;

        const mailOptions = {
          from: '"Syngenta Pension Plan" <no-reply@pensionplan.com.ar>',
          to: email,
          subject: "Confirmación de Cuenta",
          template: "syn02",
          context: {
            validador: shortLink,
          },
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
              console.error(
                "Error al insertar código en la base de datos:",
                error
              );
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
      const updateQuery =
        "UPDATE audiencia SET status = 'pendiente' WHERE email = ?";
      connection.query(updateQuery, [email], (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Error al actualizar estado:", updateErr);
          res.status(500).send("Error al actualizar el estado.");
          return;
        }

        res.status(200);
        res.send(`<!DOCTYPE html>
        <html lang="es">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Syngenta Digital Pension</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300&family=Ubuntu:wght@500&display=swap"
                rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    background-color: #46D1C7;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-around;
                }
        
                h1 {
                    color: #fff;
                    font-size: 2.5rem;
                    font-weight: bold;
                    font-family: "Ubuntu";
                }
        
        
                .divText {
                    margin-left: 5%;
                    margin-top: 6.8%;
                    width: 40%;
                }
        
                .divText p {
                    text-align: left;
                    font-size: 2rem;
                    color: #fff;
                    font-family: "Raleway";
                }
        
                .foot {
                    bottom: 12%;
                    position: absolute;
                    display: flex;
                    align-items: center;
                }
        
                .foot span {
                    font-family: "Ubuntu";
                    font-size: 1.2rem;
                    color: #fff;
                }
        
                @media (max-width: 360px) and (max-height: 740px) {
        
                    h1 {
                        color: #fff;
                        font-size: 1.7rem;
                        font-weight: bold;
                        font-family: "Ubuntu";
                    }
        
                    h1 img {
                        width: 124px;
                    }
        
                    .divText {
                        width: 75%;
                        margin-left: 5%;
                        margin-top: 69.8%;
                    }
        
        
                    .divText p {
                        text-align: center;
                        font-size: 1.3rem;
                        color: #fff;
                        font-family: "Raleway";
                    }
        
                    .foot {
                        bottom: 0%;
                        position: absolute;
                        display: flex;
                        align-items: center;
                        flex-direction: column;
                        margin-left: 59px;
                    }
        
                    .foot .aon {
                        width: 62px;
                    }
        
                    .foot .cri {
                        width: 145px;
                    }
        
                    .fly {
                        width: 75%;
                        position: absolute;
                        margin-top: 8%;
                        left: 0%;
                        height: 30%;
                        margin-left: 43px;
                    }
        
                }
        
                @media (max-width: 360px) and (max-height: 740px),
                (max-width: 390px) and (max-height: 844px) {
        
                    h1 {
                        color: #fff;
                        font-size: 1.7rem;
                        font-weight: bold;
                        font-family: "Ubuntu";
                    }
        
                    h1 img {
                        width: 124px;
                    }
        
                    .divText {
                        width: 75%;
                        margin-left: 5%;
                        margin-top: 69.8%;
                    }
        
                    .divText p {
                        text-align: center;
                        font-size: 1.3rem;
                        color: #fff;
                        font-family: "Raleway";
                    }
        
                    .foot {
                        bottom: 0%;
                        position: absolute;
                        display: flex;
                        align-items: center;
                        flex-direction: column;
                        margin-left: 59px;
                    }
        
                    .foot .aon {
                        width: 62px;
                    }
        
                    .foot .cri {
                        width: 145px;
                    }
        
                    .fly {
                        width: 75%;
                        position: absolute;
                        margin-top: 8%;
                        left: 0%;
                        height: 30%;
                        margin-left: 43px;
                    }
                }
        

                @media screen and (min-width: 1200px) and (min-height: 600px){
                  .fly{
                      width: 50%;
                  }
                  .divText{
                      margin-top: 2.8%;
                  }
              }
      

                @media (max-width: 360px) and (max-height: 740px),
                (max-width: 390px) and (max-height: 844px),
                (max-width: 720px) and (max-height: 1600px) {
        
                    h1 {
                        color: #fff;
                        font-size: 1.7rem;
                        font-weight: bold;
                        font-family: "Ubuntu";
                    }
        
                    h1 img {
                        width: 124px;
                    }
        
                    .divText {
                        width: 75%;
                        margin-left: 5%;
                        margin-top: 69.8%;
                    }
        
                    .divText p {
                        text-align: center;
                        font-size: 1.3rem;
                        color: #fff;
                        font-family: "Raleway";
                    }
        
                    .foot {
                        bottom: 0%;
                        position: absolute;
                        display: flex;
                        align-items: center;
                        flex-direction: column;
                        margin-left: 59px;
                    }
        
                    .foot .aon {
                        width: 62px;
                    }
        
                    .foot .cri {
                        width: 145px;
                    }
        
                    .fly {
                        width: 75%;
                        position: absolute;
                        margin-top: 8%;
                        left: 0%;
                        height: 30%;
                        margin-left: 43px;
                    }
                }
            </style>
        </head>
        
        <body>
        
            <div class="divText">
        
                <h1>
                    Te damos la bienvenida al plan de Pensión
                    <img width="33%" style="vertical-align: middle; margin-right: 10px; margin-bottom: 6px;"
                        src="https://i.postimg.cc/vBd7TnJ5/Logo-Syngenta-Neg.png" />
                </h1>
        
                <p>¡Has finalizado el registro en el Plan de Pensión Syngenta! Una gran decisión para tu futuro.</p>
                <div class="foot">
                    <span>Powered By</span>
                    <img class="aon" style="margin-left: 2%; width: 75px;" src="https://i.postimg.cc/j5Fsv6R7/logo-AON.png" />
                    <span style="margin-left: 5%;"> + </span>
                    <img class="cri" style="margin-left: 2%;" src="https://i.postimg.cc/XYdpJP4D/Logo-Criteria-Positivo-Gramde.png" />
                </div>
            </div>
            <div class="fly">
                <img style="width: 100%; margin-top: 5%;" src="https://i.postimg.cc/tR2cKmjW/onboarding-validated3.png" />
            </div>
        
        
        
        </body>
        
        </html>`);
        io.emit("server:toPending");
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

app.post("/add", (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    const data = {
      dni: req.body.dni,
      name: req.body.name,
      lastname: req.body.lastname,
      status: req.body.status,
      email: req.body.email,
      emailSyngenta: req.body.emailSyngenta,
      dob: new Date(req.body.dob),
      phone: req.body.phone,
      phone2: req.body.phone2 !== undefined ? req.body.phone2 : null,
      address: req.body.address,
      address2: req.body.address2,
      location: req.body.location,
      zipCode: req.body.zipCode,
      province: req.body.province,
      cuil: req.body.cuil,
      area: req.body.area,
      ingress: new Date(req.body.ingress),
      importation: "New Hires Mayo",
      added: new Date(req.body.added),
      emailsSent: 0,
      imageURL1: req.body.imageURL1 || null,
      imagelURL2: req.body.imagelURL2 || null,
      pdfURL: req.body.pdfURL,
      aports: req.body.aports,
      profile: req.body.profile,
    };

    // Iniciar transacción
    connect.beginTransaction((err) => {
      if (err) return res.send(err);

      // Insertar en la tabla de audiencia
      connect.query("INSERT INTO audiencia SET ?", [data], (err, result) => {
        if (err) {
          connect.rollback(() => {
            res.send(err);
          });
        } else {
          const registroId = result.insertId;
          const accionId = 1; // Valor de la acción inicial (ejemplo: 1 para "Creó")

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
                // Comprobar si el departamento existe
                connect.query(
                  "SELECT * FROM departamentos WHERE NombreDepartamento = ?",
                  [data.area],
                  (err, results) => {
                    if (err) {
                      connect.rollback(() => {
                        res.send(err);
                      });
                    } else {
                      if (results.length > 0) {
                        // El departamento existe, realizar la actualización
                        connect.query(
                          "UPDATE departamentos SET CantidadEmpleados = CantidadEmpleados + 1 WHERE NombreDepartamento = ?",
                          [data.area],
                          (err, result) => {
                            if (err) {
                              connect.rollback(() => {
                                res.send(err);
                              });
                            } else {
                              commitTransaction();
                            }
                          }
                        );
                      } else {
                        // El departamento no existe, crearlo y luego realizar la actualización
                        connect.query(
                          "INSERT INTO departamentos (NombreDepartamento, CantidadEmpleados) VALUES (?, 1)",
                          [data.area],
                          (err, result) => {
                            if (err) {
                              connect.rollback(() => {
                                res.send(err);
                              });
                            } else {
                              commitTransaction();
                            }
                          }
                        );
                      }
                    }
                  }
                );
              }
            }
          );
        }
      });
    });

    function commitTransaction() {
      // Commit de la transacción
      connect.commit((err) => {
        if (err) {
          connect.rollback(() => {
            res.send(err);
          });
        } else {
          res.status(200).json({
            message: "Creación exitosa",
            imageURL1: data.imageURL1,
            imagelURL2: data.imagelURL2,
          });

          io.emit("server:creado", data);
        }
      });
    }
  });
});


//email consulta
const transporterConsult = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.HELP_USER,
    pass: process.env.HELP_PASS,
  },
});

app.post("/send-help/:email", function (req, res) {
  const { email } = req.params;
  const { message, name, lastname } = req.body; // Obtén nombre, apellido y mensaje del cuerpo de la solicitud

  const mailOptions = {
    from: "consultas@pensionplan.com.ar",
    to: "consultas@pensionplan.com.ar",
    subject: "Ayuda Onboarding",
    text: `Nombre: ${name}\nApellido: ${lastname}\nCorreo electrónico: ${email}\nMensaje: ${message}`,
  };

  transporterConsult.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
      res.status(500).json({ ok: false, message: "Error al enviar el correo" });
    } else {
      console.log("Correo enviado:", info.response);
      res.status(200).json({ ok: true, message: "Consulta enviada" });
    }
  });
});


const transporterCampaign = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
});

app.post("/send-campaign", function (req, res) {
  const { message, name, lastname } = req.body;


  // Filtra el array de correos electrónicos para que solo contenga el correo del usuario actual
  const emails = ["marianoveronsantos@gmail.com", "marcelogmarquez@yahoo.com"];

  // Configura las opciones del correo para cada destinatario
  const mailPromises = emails.map(email => {
    const filteredEmails = [email];

    const mailOptions = {
      from: process.env.user,
      to: filteredEmails.join(','),
      subject: "Test Campaña",
      text: `Nombre: ${name}\nApellido: ${lastname}\nMensaje: ${message}`,
    };

    // Retorna una promesa para el envío del correo
    return new Promise((resolve, reject) => {
      transporterCampaign.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Error al enviar el correo a ${email}:`, error);
          reject({ email, error });
        } else {
          console.log(`Correo enviado a ${email}:`, info.response);
          resolve({ email, info });
        }
      });
    });
  });

  // Espera a que todas las promesas se resuelvan
  Promise.all(mailPromises)
    .then(results => {
      res.status(200).json({ ok: true, message: "Correos enviados", results });
    })
    .catch(errors => {
      res.status(500).json({ ok: false, message: "Error al enviar correos", errors });
    });
});


server.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
