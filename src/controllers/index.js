//Audience
exports.addAudiencia = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    const data = {
      dni: req.body.dni,
      name: req.body.name,
      lastname: req.body.lastname,
      status: req.body.status,
      email: req.body.email,
      emailSyngenta: req.body.emailSyngenta,
      dob: req.body.dob,
      phone: req.body.phone,
      address: req.body.address,
      address2: req.body.address2,
      location: req.body.location,
      zipCode: req.body.zipCode,
      province: req.body.province,
      cuil: req.body.cuil,
      area: req.body.area,
      ingress: req.body.ingress,
      importation: "New Hires Mayo",
      added: req.body.added,
      emailsSent: 0,
      imageURL: ""
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
                // Commit de la transacción
                connect.commit((err) => {
                  if (err) {
                    connect.rollback(() => {
                      res.send(err);
                    });
                  } else {
                    const imageURL = req.body.imageURL;
                    data.imageURL = imageURL;

                    connect.query(
                      "UPDATE audiencia SET imageURL = ? WHERE id = ?",
                      [imageURL, registroId],
                      (err, updateResult) => {
                        if (err) return res.send(err);

                        res.status(200).json({
                          message: "Creación exitosa",
                          imageURL,
                        });
                      }
                    );
                  }
                });
              }
            }
          );
        }
      });
    });
  });
};

exports.getAudience = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);
    connect.query(
      `SELECT a.*, ac.accion AS descripcion_accion
    FROM audiencia a
    LEFT JOIN actions ac ON a.accionId = ac.id`,
      (err, result) => {
        if (err) return res.send(err);

        res.json(result);
      }
    );
  });
};

exports.getOne = (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query(
      `SELECT * FROM audiencia WHERE id = ?`,
      [req.params.id],
      (err, result) => {
        if (err) return res.send(err);

        res.json(result);
      }
    );
  });
};

exports.editAudience = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    const dataToBeChangedd = {
      name: req.body.name,
      area: req.body.area,
      status: req.body.status,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      importation: req.body.importation,
      added: new Date(req.body.added),
      ingress: new Date(req.body.ingress)
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
};

//aqui

exports.deleteAudience = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    connect.query(
      "DELETE FROM audiencia WHERE id = ?",
      [req.params.id],
      (err, result) => {
        if (err) return res.send(err);

        res.send("Eliminado con exito");
      }
    );
  });
};
