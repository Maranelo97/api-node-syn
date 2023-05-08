//Audience
exports.addAudiencia = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);
    const data = {
      name: req.body.name,
      lastname: req.body.lastname,
      status: req.body.status,
      email: req.body.email,
      phone: req.body.phone,
      area: req.body.area,
      importation: req.body.importation || "New Hires Mayo",
      added: Date.now(),
      emailsSent: 0
    };

    // Buscar si ya existe un registro con el mismo correo electrónico
    connect.query(
      "SELECT * FROM audiencia WHERE email = ?",
      [data.email],
      (err, result) => {
        if (err) return res.send(err);

        if (result.length > 0) {
          // Si ya existe un registro con el mismo correo electrónico, enviar una respuesta indicando que el registro ya existe
          return res.status(409).send("El registro ya existe en la base de datos");
        } else {
          // Si no existe un registro con el mismo correo electrónico, insertar el nuevo registro
          connect.query(
            "INSERT INTO audiencia SET ?",
            [data],
            (err, result) => {
              if (err) return res.send(err);

              res.send("Creación exitosa");
            }
          );
        }
      }
    );
  });
};

exports.getAudience = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);
    connect.query("SELECT * FROM audiencia", (err, result) => {
      if (err) return res.send(err);

      res.json(result);
    });
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

    const dataToBeChanged = {
      name: req.body.name,
      status: req.body.status,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
    };

    connect.query(
      "UPDATE audiencia SET ? WHERE id = ?",
      [dataToBeChanged, req.params.id],
      (err, result) => {
        if (err) return res.send(err);

        res.send("Actualizado");
      }
    );
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
