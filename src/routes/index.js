const express = require("express");
const route = express.Router();
const {
    addAudiencia,
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
} = require("../controllers/index");
const { getImports, deleteImport } = require("../controllers/imports");

route.get("/audience", getAudience);
route.get("/audience/:dni", getByDni);
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
route.delete("/deleteImport/:id", deleteImport)

module.exports = route;
