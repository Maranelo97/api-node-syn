exports.getAllTemplates = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        conn.query('SELECT * FROM plantillas', (err, results) => {
            if (err) return res.send(err);
            res.json(results);
        });
    });
};