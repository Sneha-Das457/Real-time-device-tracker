const express = require("express");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");


const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:5000",
    credentials: true

}));

module.exports = app;