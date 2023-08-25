exports.getImports = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
      connect.query(
        `SELECT * FROM imports`,
        (err, result) => {
          if (err) return res.send(err);
  
          res.json(result);
        }
      );
    });
  };



  exports.deleteImport = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
  
      connect.query(
        "DELETE FROM imports WHERE id = ?",
        [req.params.id],
        (err, result) => {
          if (err) return res.send(err);
  
          res.send("Eliminado con exito");
        }
      );
    });
  };
  