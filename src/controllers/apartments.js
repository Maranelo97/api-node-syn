//aprtments 
exports.getAllApartments = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        conn.query('SELECT * FROM departamentos', (err, results) => {
            if (err) return res.send(err);
            res.json(results);
        });
    });
};

exports.createApartment = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const apartmentData = {
            NombreDepartamento: req.body.NombreDepartamento,
            CantidadEmpleados: 0
        };

        conn.query('INSERT INTO departamentos SET ?', [apartmentData], (err, result) => {
            if (err) return res.send(err);

            res.send('Departamento creado exitosamente');
        });
    });
};

exports.update = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: 'Error interno del servidor' });

        const { id } = req.params; 
        const { NombreDepartamento } = req.body;

        const updateUserQuery = `
            UPDATE departamentos 
            SET 
                NombreDepartamento = ?
            WHERE AreaID = ?`;

        conn.query(
            updateUserQuery,
            [NombreDepartamento, id],
            (err, result) => {
                if (err) {
                    console.error('Error al actualizar los datos:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }

                if (result.affectedRows > 0) {
                    res.json({ message: 'Datos actualizados exitosamente' });
                } else {
                    res.status(404).json({ error: 'Usuario no encontrado' });
                }
            }
        );
    });
};

exports.deleteDepartment = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
  
      connect.query(
        "DELETE FROM departamentos WHERE AreaID = ?",
        [req.params.id],
        (err, result) => {
          if (err) return res.send(err);
  
          res.send("Eliminado con exito");
        }
      );
    });
  };