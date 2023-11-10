exports.getByZip = (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      conn.query(
        "SELECT province, location FROM georeference WHERE cp = ?",
        [req.params.cp],
        (err, result) => {
          if (err) return res.send(err);
  
          res.json(result);
        }
      );
    });
  };
  
  exports.addZip = (req, res) => {
      req.getConnection((err, conn) => {
          if (err) return res.send(err);
          const dataToAdd = {
              cp: req.body.cp,
              province: req.body.province,
              location: req.body.location
          }
          conn.query ('INSERT INTO georeference SET ?', [dataToAdd], (err, result) =>{
              if (err) return res.send(err);
  
              res.send('Creación Exitosa')
          })
      })
  }
  
  exports.getAll = (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      conn.query(
        "SELECT * FROM georeference",
        (err, result) => {
          if (err) return res.send(err);
  
          res.json(result);
        }
        
      )
    })
  }
  
  exports.updateGeo = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);
  
        const geoReferenceId = req.params.id;
  
        const updatedData = {
            cp: req.body.cp,
            province: req.body.province,
            location: req.body.location
        };
  
        conn.query('UPDATE georeference SET ? WHERE id = ?', [updatedData, geoReferenceId], (err, result) => {
            if (err) return res.send(err);
  
            res.send('Actualización Exitosa');
        });
    });
  }
  
  
  exports.deleteCode = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
  
      connect.query(
        "DELETE FROM georeference WHERE id = ?",
        [req.params.id],
        (err, result) => {
          if (err) return res.send(err);
  
          res.send("Eliminado con exito");
        }
      );
    });
  };
  