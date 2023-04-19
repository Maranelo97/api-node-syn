//Audience

 exports.addAudiencia = (req, res) =>{
    req.getConnection((err, connect) => {
        if(err) return res.send(err);

        connect.query("INSERT INTO audiencia SET ?", [req.body], (err, result) => {
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

        connect.query("UPDATE audiencia SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
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
  
 