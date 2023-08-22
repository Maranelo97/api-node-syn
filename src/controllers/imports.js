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
  