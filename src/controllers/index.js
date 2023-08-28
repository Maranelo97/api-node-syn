const io = require('../index')

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
                    io.emit("server:creado")
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

exports.getByDni = (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query(
      `SELECT * FROM audiencia WHERE dni = ?`,
      [req.params.dni],
      (err, result) => {
        if (err) return res.send(err);

        res.json(result);
      }
    );
  });
};

exports.getCode = (req, res) => {
  req.getConnection((err, conn) => {
    if (err)
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error en la conexión a la base de datos",
        });

    conn.query(
      `SELECT * FROM codigos WHERE codigo = ?`,
      [req.params.codigo],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({
              ok: false,
              message: "Error en la consulta a la base de datos",
            });

        if (result.length === 0) {
          return res
            .status(404)
            .json({ ok: false, message: "Código no encontrado" });
        }

        res.json(result);
      }
    );
  });
};

exports.editAudience = (req, res) => {
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

exports.aceptarSub = (req, res) => {
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

exports.rechazarSub = (req, res) => {
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
    };

    const justificacion = req.body.justificacion;

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
            const accionId = 4;

            // Insertar en la tabla de registros_acciones
            const nuevaAccion = {
              accionId,
              registroId,
              justificacion, // Agregar la justificación aquí
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

exports.rollBackSub = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 5;

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

exports.ingressSub = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 6;

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

exports.toValidar = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    const dataToBeChangedd = {
      dni: req.body.dni,
      cuil: req.body.cuil,
      name: req.body.name,
      area: req.body.area,
      aports: req.body.aports,
      profile: req.body.profile,
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
      imageURL1: req.body.imageURL1,
      imagelURL2: req.body.imagelURL2,
      pdfURL: req.body.pdfURL,
      ingress: new Date(req.body.ingress),
      dob: new Date(req.body.dob),
      aprobbed: new Date(req.body.aprobbed),
      onBoarding: new Date(req.body.onBoarding),
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
            const accionId = 7;

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

//CONTROLADORES DE ABANDONO

exports.abandono3 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 8;

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

exports.abandono4 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 9;

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

exports.abandono5 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 10;

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

exports.abandono6 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 11;

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

exports.abandono7 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 12;

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

exports.abandono8 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 13;

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

exports.abandono9 = (req, res) => {
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
      aprobbed: new Date(req.body.aprobbed),
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
            const accionId = 14;

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

exports.importCSV = (req, res) => {
  const data = req.body.data; // Suponiendo que los datos se envían en el cuerpo de la solicitud
  const columnMapping = {
    NOMBRE: "name",
    APELLIDO: "lastname",
    "COD POSTAL": "zipCode",
    CUIT: "cuit",
    DNI: "dni",
    DOMICILIO1: "address",
    DOMICILIO2: "address2",
    EMAIL1: "email",
    EMAIL2: "email2",
    "F. DE NAC.": "dob",
    INGRESO: "ingress",
    LOCALIDAD: "location",
    Provincia: "province",
    TEL1: "phone",
    TEL2: "phone2",
  };

  const query =
    "INSERT INTO audiencia (name, lastname, status, email, phone, area, importation, added, emailSyngenta, dob, address) VALUES ?";
  const values = data.map((row) => [
    row.name,
    row.lastname,
    row.status,
    row.email,
    row.phone,
    row.area,
    row.importation,
    row.added,
    row.emailSyngenta,
    row.dob,
    row.address,
  ]);

  req.getConnection((err, connect) => {
    if (err) {
      console.error("Error obtaining connection:", err);
      return res.status(500).json({ error: "Error obtaining connection" });
    }

    connect.query(query, [values], (error, results) => {
      if (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ error: "Error inserting data" });
      } else {
        console.log("Data inserted successfully:", results);
        res.status(200).json({ message: "Data inserted successfully" });
      }
    });
  });
};
