//Audience
exports.addAudiencia = (req, res) => {
  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    const data = {
      name: req.body.name,
      lastname: req.body.lastname,
      status: req.body.status,
      email: req.body.email,
      emailSyngenta: req.body.emailSyngenta,
      dob: req.body.dob,
      phone: req.body.phone,
      address: req.body.address,
      location: req.body.location,
      zipCode: req.body.zipCode,
      province: req.body.province,
      cuil: req.body.cuil,
      area: req.body.area,
      importation: "New Hires Mayo",
      added: new Date(),
      emailsSent: 0,
      imageURL: "",
      accionID: 1,
    };

    connect.query("INSERT INTO audiencia SET ?", [data], (err, result) => {
      if (err) return res.send(err);

      const imageURL = req.body.imageURL;
      data.imageURL = imageURL;

      connect.query(
        "UPDATE audiencia SET imageURL = ? WHERE id = ?",
        [imageURL, result.insertId],
        (err, updateResult) => {
          if (err) return res.send(err);

          res.status(200).json({ message: "Creación exitosa", imageURL });
        }
      );
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

    const dataToBeChanged = {
      name: req.body.name,
      status: req.body.status,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      importation: req.body.importation,
      accionID: 2,
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
