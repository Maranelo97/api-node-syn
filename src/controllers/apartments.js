//aprtments 
exports.getAllApartments = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        conn.query('SELECT * FROM Departamentos', (err, results) => {
            if (err) return res.send(err);
            res.json(results);
        });
    });
};