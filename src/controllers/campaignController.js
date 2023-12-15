
exports.createCampaign = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const campaignData = {
            nombre: req.body.nombre,
            segmentos: JSON.stringify(req.body.segmentos),
            mensaje: req.body.mensaje,
            creador: req.body.creador,
            createdAt: new Date(req.body.createdAt),
            score: req.body.score,
            title: req.body.title,
            sendAt: new Date(req.body.sendAt),
            aperturas: req.body.aperturas,
            inscripciones: req.body.inscripciones,
            sendBy: req.body.sendBy,
            status: req.body.status,
            destinationCount: req.body.destinationCount
        };
        conn.query('INSERT INTO campaigns SET ?', [campaignData], (err, result) => {
            if (err) return res.send(err);

            res.send('Campaña creada exitosamente');
        });
    });
};

exports.updateCampaign = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: 'Error interno del servidor' });
  
        const id = req.params.id;
  
        const detallesArray = req.body.segmentos;
        const segmentCount = detallesArray ? detallesArray.length : 0;

        const updatedData = {
            nombre: req.body.nombre,
            segmentos: JSON.stringify(detallesArray),
            mensaje: req.body.mensaje,
            creador: req.body.creador,
            score: req.body.score,
            title: req.body.title,
            aperturas: req.body.aperturas,
            inscripciones: req.body.inscripciones,
            sendBy: req.body.sendBy,
            status: req.body.status,
            destinationCount: segmentCount
        };
  
        conn.query('UPDATE campaigns SET ? WHERE id = ?', [updatedData, id], (err, result) => {
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


  exports.deleteCampaigns = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
  
      connect.query(
        "DELETE FROM campaigns WHERE id = ?",
        [req.params.id],
        (err, result) => {
          if (err) return res.send(err);
  
          res.send("Eliminado con exito");
        }
      );
    });
  };

  exports.getAllCampaigns = (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.send(err);
  
      conn.query(
        "SELECT * FROM campaigns",
        (err, result) => {
          if (err) return res.send(err);
  
          res.json(result);
        }
        
      )
    })
  }