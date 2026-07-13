import express from "express";
import cors from "cors";
import compression from "compression";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(compression());

app.use(express.static(path.join(__dirname, "public")));


/*
 API STATUS
*/

app.get("/api/ping", (req, res) => {

    res.json({
        status: "online",
        sistema: "BetVision AI",
        timestamp: new Date()
    });

});


/*
 DASHBOARD
*/

app.get("/api/dashboard", (req, res) => {

    res.json({

        sistema: "BetVision AI",

        jogosHoje: 0,

        analisesGeradas: 0,

        oportunidades: 0,

        statusIA: "aguardando dados"

    });

});


/*
 FRONTEND
*/

app.get("/", (req,res)=>{

    res.sendFile(
        path.join(__dirname,"public","index.html")
    );

});


const server = app.listen(PORT,()=>{

    console.log(
        `BetVision AI rodando na porta ${PORT}`
    );

});


/*
 WEBSOCKET TEMPO REAL
*/

const wss = new WebSocketServer({
    server
});


wss.on("connection",(socket)=>{

    console.log("Cliente conectado");


    socket.send(JSON.stringify({

        tipo:"status",

        mensagem:"BetVision AI conectado"

    }));


});
