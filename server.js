import express from "express";
import compression from "compression";
import cors from "cors";

import api from "./routes/api.js";

const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());

app.use(express.static("public"));

app.use("/api", api);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

console.log("");

console.log("===================================");

console.log("⚽ BETVISION AI");

console.log("Servidor iniciado");

console.log("Porta:",PORT);

console.log("===================================");

});
