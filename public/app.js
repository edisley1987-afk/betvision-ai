// ======================================================
// BetVision AI - Backend Server
// app.js
// ======================================================


import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";



// ======================================================
// ROTAS
// ======================================================


import jogosRouter from "./routes/jogos.js";
import oddsRouter from "./routes/odds.js";
import analisesRouter from "./routes/analises.js";
import valuebetsRouter from "./routes/valuebets.js";
import futebolRouter from "./routes/futebol.js";
import inteligenciaRouter from "./routes/inteligencia.js";




// ======================================================
// BANCO
// ======================================================


import db,{ conectarBanco } from "./database/database.js";




// ======================================================
// SERVIÇOS
// ======================================================


import {
    sincronizarSistema

} from "./services/sincronizacaoService.js";


import {
    listarCampeonatos

} from "./services/bancoService.js";




// ======================================================
// CONFIG
// ======================================================


dotenv.config();



const __filename =
fileURLToPath(import.meta.url);


const __dirname =
path.dirname(__filename);



const app =
express();



const PORT =
process.env.PORT || 3000;



const HOST =
"0.0.0.0";




// ======================================================
// MIDDLEWARES
// ======================================================


app.use(
    helmet()
);


app.use(
    morgan("combined")
);


app.use(
    cors()
);


app.use(
    express.json()
);


app.use(
    compression()
);



// arquivos frontend

app.use(

express.static(

path.join(
__dirname,
"public"

)

)

);




// ======================================================
// ROTAS API
// ======================================================


app.use(

"/api/jogos",

jogosRouter

);



app.use(

"/api/odds",

oddsRouter

);



app.use(

"/api/analises",

analisesRouter

);



app.use(

"/api/valuebets",

valuebetsRouter

);



app.use(

"/api/futebol",

futebolRouter

);



app.use(

"/api/inteligencia",

inteligenciaRouter

);






// ======================================================
// CAMPEONATOS
// ======================================================


app.get(

"/api/campeonatos",

async(req,res)=>{


try{


const dados =
await listarCampeonatos();



res.json({

total:
dados.length,


campeonatos:
dados


});


}

catch(error){


res.status(500).json({

erro:
error.message

});


}


}


);






// ======================================================
// DASHBOARD REAL
// ======================================================


app.get(

"/api/dashboard",

async(req,res)=>{


try{


const campeonatos =
await listarCampeonatos();



let jogos = 0;
let analises = 0;
let valuebets = 0;



try{


const r1 =
await db.query(

`
SELECT COUNT(*) 
FROM jogos

`

);


jogos =
Number(
r1.rows[0].count
);



}

catch{}




try{


const r2 =
await db.query(

`
SELECT COUNT(*) 
FROM analises

`

);


analises =
Number(
r2.rows[0].count
);



}

catch{}





try{


const r3 =
await db.query(

`
SELECT COUNT(*) 
FROM valuebets

`

);


valuebets =
Number(
r3.rows[0].count
);



}

catch{}





res.json({


sistema:

"BetVision AI",



status:

"operacional",



jogosHoje:

jogos,



campeonatos:

campeonatos.length,



analisesIA:

analises,



valueBets:

valuebets,



modelo:

"Probabilidade + Estatística",



ultimaAtualizacao:

new Date()


});



}


catch(error){


console.error(
error
);



res.status(500).json({

erro:

error.message

});


}


}


);






// ======================================================
// PING
// ======================================================


app.get(

"/api/ping",

(req,res)=>{


res.json({

status:
"online",

sistema:
"BetVision AI",

versao:
"3.0",

hora:
new Date()

});


}


);
// ======================================================
// DEBUG BANCO
// ======================================================

app.get("/api/debug-db", async (req, res) => {

    try {

        const resultado = {};

        // Campeonatos
        try {
            const r = await db.query("SELECT COUNT(*) FROM campeonatos");
            resultado.campeonatos = Number(r.rows[0].count);
        } catch (e) {
            resultado.campeonatos = e.message;
        }

        // Jogos
        try {
            const r = await db.query("SELECT COUNT(*) FROM jogos");
            resultado.jogos = Number(r.rows[0].count);
        } catch (e) {
            resultado.jogos = e.message;
        }

        // Análises
        try {
            const r = await db.query("SELECT COUNT(*) FROM analises");
            resultado.analises = Number(r.rows[0].count);
        } catch (e) {
            resultado.analises = e.message;
        }

        // Value Bets
        try {
            const r = await db.query("SELECT COUNT(*) FROM valuebets");
            resultado.valuebets = Number(r.rows[0].count);
        } catch (e) {
            resultado.valuebets = e.message;
        }

        // Informações do banco
        try {
            const r = await db.query("SELECT current_database(), current_user");
            resultado.database = r.rows[0];
        } catch (e) {
            resultado.database = e.message;
        }

        res.json(resultado);

    } catch (erro) {

        res.status(500).json({
            erro: erro.message,
            stack: erro.stack
        });

    }

});





// ======================================================
// FRONTEND
// ======================================================


app.get(

"/",

(req,res)=>{


res.sendFile(

path.join(

__dirname,

"public",

"index.html"

)

);


}

);







// ======================================================
// SERVIDOR
// ======================================================


const server =

app.listen(

PORT,

HOST,

async()=>{


console.log(

`🚀 BetVision AI online porta ${PORT}`

);



await conectarBanco();



try{


const campeonatos =

await sincronizarSistema();



console.log(

`🌎 ${campeonatos.length} campeonatos sincronizados`

);



}

catch(error){


console.error(

"Erro sincronização:",

error.message

);


}



}

);







// ======================================================
// WEBSOCKET
// ======================================================


const wss =

new WebSocketServer({

server

});





wss.on(

"connection",

socket=>{


console.log(

"🔵 WebSocket conectado"

);



socket.send(

JSON.stringify({

tipo:
"status",

sistema:
"BetVision AI",

mensagem:
"IA tempo real ativa",

data:
new Date()

})

);



socket.on(

"close",

()=>{


console.log(

"Cliente desconectado"

);


}

);



}

);






// ======================================================
// BROADCAST
// ======================================================


export function enviarAtualizacao(dados){



wss.clients.forEach(

cliente=>{


if(

cliente.readyState === 1

){


cliente.send(

JSON.stringify(dados)

);


}


}


);


}






// ======================================================
// 404
// ======================================================


app.use(

(req,res)=>{


res.status(404).json({

erro:
"Rota não encontrada",

rota:
req.originalUrl

});


}

);






// ======================================================
// ERRO GLOBAL
// ======================================================


app.use(

(err,req,res,next)=>{


console.error(err);



res.status(500).json({

erro:

"Erro interno do servidor"

});


}

);
