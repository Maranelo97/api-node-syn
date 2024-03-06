exports.getAllTemplates = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        conn.query('SELECT * FROM plantillas', (err, results) => {
            if (err) return res.send(err);
            res.json(results);
        });
    });
};

exports.createTemplate = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.send(err);

        const templateData = {
            name: req.body.name,
            title: req.body.title,
            emailBody: req.body.emailBody,
            createdBy: req.body.createdBy,
            createdAt: new Date(req.body.createdAt)
        };

        conn.query('INSERT INTO plantillas SET ?', [templateData], (err, result) => {
            if (err) return res.send(err);

            res.send('Plantilla creada exitosamente');
        });
    });
};