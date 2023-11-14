exports.loginUser = (req, res) => {
    const { usuario, password } = req.body;

    req.getConnection((err, conn) => {
        if (err) {
            console.error('Error de conexión a la base de datos:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        conn.query(
            'SELECT * FROM users WHERE usuario = ? AND password = ?',
            [usuario, password],
            (err, results) => {
                if (err) {
                    console.error('Error al realizar la consulta:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }

                if (results.length > 0) {
                    const username = results[0].usuario;
                    res.json({ message: 'Inicio de sesión exitoso', username });
                } else {

                    res.status(401).json({ error: 'Credenciales incorrectas' });
                }
            }
        );
    });
};

exports.getAllUsers = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        conn.query('SELECT * FROM users', (err, results) => {
            if (err) return res.send(err);
            res.json(results);
        });
    });
};


exports.createUser = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const userData = {
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            email: req.body.email,
            password: req.body.password,
            usuario: req.body.usuario
        };

        conn.query('INSERT INTO users SET ?', [userData], (err, result) => {
            if (err) return res.send(err);

            res.send('Usuario creado exitosamente');
        });
    });
};



exports.update = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: 'Error interno del servidor' });

        const { usuario, password, newPassword } = req.body;


        conn.query(
            'SELECT * FROM users WHERE usuario = ? AND password = ?',
            [usuario, password],
            (err, results) => {
                if (err) {
                    console.error('Error al realizar la consulta:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }

                if (results.length > 0) {
               
                    conn.query(
                        'UPDATE users SET password = ? WHERE usuario = ?',
                        [newPassword, usuario],
                        (err, result) => {
                            if (err) {
                                console.error('Error al actualizar la contraseña:', err);
                                return res.status(500).json({ error: 'Error interno del servidor' });
                            }

                            res.json({ message: 'Contraseña actualizada exitosamente' });
                        }
                    );
                } else {
                    res.status(401).json({ error: 'Credenciales incorrectas' });
                }
            }
        );
    });
};

exports.deleteUser = (req, res) => {
    req.getConnection((err, connect) => {
      if (err) return res.send(err);
  
      connect.query(
        "DELETE FROM users WHERE id = ?",
        [req.params.id],
        (err, result) => {
          if (err) return res.send(err);
  
          res.send("Eliminado con exito");
        }
      );
    });
  };
  