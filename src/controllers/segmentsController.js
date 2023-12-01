exports.createSegment = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const segmentData = {
            nombre: req.body.nombre,
            audienciaSegmento: req.body.audienciaSegmento,
            creationTime: new Date(req.body.creationTime),
            detalles: JSON.stringify(req.body.detalles)
        };

        conn.query('INSERT INTO segmentos SET ?', [segmentData], (err, result) => {
            if (err) return res.send(err);

            res.send('Segmento creado exitosamente');
        });
    });
};

exports.updateSegment = (req, res) => {
  req.getConnection((err, conn) => {
      if (err) return res.status(500).json({ error: 'Error interno del servidor' });

      const segmentID = req.params.id;

      const detallesArray = req.body.detalles;
      const audienciaSegmento = detallesArray ? detallesArray.length : 0;

      const updatedData = {
          nombre: req.body.nombre,
          audienciaSegmento: audienciaSegmento,
          creationTime: req.body.creationTime,
          detalles: JSON.stringify(detallesArray)  // Convertir el array a una cadena JSON
      };

      conn.query('UPDATE segmentos SET ? WHERE segmentID = ?', [updatedData, segmentID], (err, result) => {
          if (err) {
              console.error('Error al actualizar los datos:', err);
              return res.status(500).json({ error: 'Error interno del servidor' });
          }

          if (result.affectedRows > 0) {
              res.json({ message: 'Segmento actualizado exitosamente' });
          } else {
              res.status(404).json({ error: 'Segmento no encontrado' });
          }
      });
  });
};


exports.deleteSegment = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
  
      connect.query(
        "DELETE FROM segmentos WHERE segmentID = ?",
        [req.params.id],
        (err, result) => {
          if (err) return res.send(err);
  
          res.send("Eliminado con exito");
        }
      );
    });
  };

  exports.getAllSegments = (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      conn.query(
        "SELECT * FROM segmentos",
        (err, result) => {
          if (err) return res.send(err);
  
          res.json(result);
        }
        
      )
    })
  }
