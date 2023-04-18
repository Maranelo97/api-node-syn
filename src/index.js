require("dotenv").config();
const express = require('express')
const mysql = require('mysql2')
const connect = require('express-myconnection')
const route = require("./routes/index")

const app = express();
const PORT = process.env.PORT || 4002
const dbConfig = {
    host: process.env.DB_HOST||"localhost",
    port: process.env.DB_PORT ||"3306",
    user: process.env.DB_USER ||"root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mockdata"
}

app.use(cors())
app.use(connect(mysql, dbConfig, "single"))
app.use(express.json());
app.use("/", route)

app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`)
})