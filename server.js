import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


/*
====================================
 ROTAS
====================================
*/

import jogosRouter from "./routes/jogos.js";
import oddsRouter from "./routes/odds.js";
import analisesRouter from "./routes/analises.js";
import valuebetsRouter from "./routes/valuebets.js";
import futebolRouter from "./routes/futebol.js";
import inteligenciaRouter from "./routes/inteligencia.js";



/*
====================================
 BANCO
====================================
*/

import "./database/database.js";



/*
====================================
 SERVIÇOS
====================================
*/

import {
    sincronizarSistema
}
from "./services/sincronizacaoService.js";


import {
    listarCampeonatos
}
from "./services/bancoService.js";



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



/*
====================================
 MIDDLEWARES
====================================
*/


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



app.use(

    express.static(

        path.join(
            __dirname,
            "public"
        )

    )

);



/*
====================================
 ROTAS
====================================
*/


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



/*
 INTELIGÊNCIA ARTIFICIAL
*/


app.use(

"/api/inteligencia",

inteligenciaRouter

);




/*
====================================
 CAMPEONATOS
====================================
*/


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



/*
====================================
 STATUS
====================================
*/


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


        modulos:

        [

            "Banco SQLite",

            "Futebol API",

            "IA Predict"

        ],


        horario:
        new Date()

    });


}

);



/*
====================================
 DASHBOARD
====================================
*/


app.get(

"/api/dashboard",

(req,res)=>{


    res.json({

        sistema:
        "BetVision AI",


        status:
        "operacional",


        jogosHoje:
        0,


        campeonatos:
        0,


        analisesIA:
        0,


        valueBets:
        0,


        modelo:
        "Probabilidade + Estatística"


    });


}

);



/*
====================================
 FRONTEND
====================================
*/


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



/*
====================================
 SERVIDOR
====================================
*/


const server = app.listen(

PORT,

HOST,

async()=>{


    console.log(

        `🚀 BetVision AI online porta ${PORT}`

    );



    try{


        const campeonatos =

        await sincronizarSistema();



        console.log(

        `🌎 ${campeonatos.length} campeonatos sincronizados`

        );


    }

    catch(error){


        console.error(

            "Erro sincronização",

            error.message

        );


    }


}

);




/*
====================================
 WEBSOCKET
====================================
*/


const wss =
new WebSocketServer({

    server

});




wss.on(

"connection",

(socket)=>{


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




/*
====================================
 BROADCAST
====================================
*/


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



/*
====================================
 404
====================================
*/


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



/*
====================================
 ERRO GLOBAL
====================================
*/


app.use(

(err,req,res,next)=>{


    console.error(

        err

    );



    res.status(500).json({

        erro:
        "Erro interno do servidor"

    });


}

);
