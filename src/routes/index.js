const express = require("express");
const route = express.Router();
const {
  getAudience,
  editAudience,
  deleteAudience,
  getByDni,
  aceptarSub,
  rechazarSub,
  rollBackSub,
  ingressSub,
  toValidar,
  getCode,
  importCSV,
  abandono3,
  abandono4,
  abandono5,
  abandono6,
  abandono7,
  abandono8,
  abandono9,
  getByEmail,
} = require("../controllers/index");
const { getImports, deleteImport } = require("../controllers/imports");
const { getHealth } = require("../controllers/health-controller");

const allowOnlyFromSpecificOrigin = (req, res, next) => {
const allowedOrigins = ['http://localhost:3000', 'https://admin.pensionplan.com.ar', 'https://pensionplan.com.ar','http://localhost:5173'];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      return next();
  }
return res.status(403).json({ error: 'Acceso no permitido desde esta dirección.' });
};


route.use(allowOnlyFromSpecificOrigin)
route.get("/audience", getAudience);
route.get("/audience/:dni", getByDni);
route.get("/audiencia/:email", getByEmail);

route.get("/getCode/:codigo", getCode);

route.post("/import-csv", importCSV);
route.put("/update/:id", editAudience);
route.put("/acceptSub/:id", aceptarSub);
route.put("/reject-sub/:id", rechazarSub);
route.put("/rollBack/:id", rollBackSub);
route.put("/ingressSub/:id", ingressSub);
route.put("/toValidar/:id", toValidar);
//abandonos
route.put("/abandono-3/:id", abandono3);
route.put("/abandono-4/:id", abandono4);
route.put("/abandono-5/:id", abandono5);
route.put("/abandono-6/:id", abandono6);
route.put("/abandono-7/:id", abandono7);
route.put("/abandono-8/:id", abandono8);
route.put("/abandono-9/:id", abandono9);
route.delete("/delete/:id", deleteAudience);

//import
route.get("/getImports", getImports);
route.delete("/deleteImport/:id", deleteImport);

//health
route.get("/health", getHealth);

module.exports = route;
