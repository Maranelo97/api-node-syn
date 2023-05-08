//Audience

 exports.addAudiencia = (req, res) =>{
    req.getConnection((err, connect) => {
        if(err) return res.send(err);
        const data = {
          name: req.body.name,
          lastname: req.body.lastname,
          status: req.body.status,
          email: req.body.email,
          phone: req.body.phone,
          area: req.body.area
        }

        connect.query("INSERT INTO audiencia SET ?", [data], (err, result) => {
            if(err) return res.send(err);

            res.send("Creación exitosa");
        });
    });
  } 
  
exports.getAudience = (req, res) => {
        req.getConnection((err, connect) => {
            if(err) return res.send(err)
        connect.query("SELECT * FROM audiencia", (err, result) => {
            if (err) return res.send(err);

            res.json(result)
        })

        })
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
          phone: req.body.phone
        }

        connect.query("UPDATE audiencia SET ? WHERE id = ?", [dataToBeChanged, req.params.id], (err, result) => {
            if (err) return res.send(err)

            res.send("Actualizado")
        })
    })
  };
  
  //aqui
  
  exports.deleteAudience = (req, res) => {
    req.getConnection((err, connect) => {
        if (err) return res.send(err);

        connect.query("DELETE FROM audiencia WHERE id = ?", [req.params.id], (err, result) => {
            if (err) return res.send(err)

            res.send("Eliminado con exito")
        })
    })
  };
  
 