exports.realizarAction = (req, res) => {
  const data = {
    accionId: req.body.accionId,
    registroId: req.body.registroId,
  };

  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    connect.query(
      "INSERT INTO registros_acciones SET ?",
      [data],
      (err, result) => {
        if (err) return res.send(err);

        res.json({ message: "Acción Registrada" });
      }
    );
  });
};

exports.getHistorialActions = (req, res) => {
  const data = req.params.registroId;

  req.getConnection((err, connect) => {
    if (err) return res.send(err);

    connect.query(
      `SELECT r.*, a.accion AS descripcion_accion
        FROM registros_acciones r
        LEFT JOIN actions a ON r.accionId = a.id
        WHERE r.registroId = ?`,
      [data],
      (err, result) => {
        if (err) return res.send(err);

        res.json(result);
      }
    );
  });
};
