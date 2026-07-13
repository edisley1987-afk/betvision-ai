import express from "express";
import cors from "cors";
import compression from "compression";
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



/*
====================================
 BANCO E SERVIÇOS
====================================
*/


import "./database/database.js";


import {

    sincronizarSistema

}

from "./services/sincronizacaoService.js";



import {

    listarCampeonatos

}

from "./services/bancoService.js";



dotenv.config();



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



const app = express();



const PORT = process.env.PORT || 3000;

const HOST = "0.0.0.0";



/*
====================================
 MIDDLEWARE
====================================
*/


app.use(cors());


app.use(express.json());


app.use(compression());



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
 ROTAS PRINCIPAIS
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



/*
====================================
 BANCO - CAMPEONATOS
====================================
*/


app.get(

"/api/campeonatos",

async(req,res)=>{


    try{


        const dados =

        await listarCampeonatos();



        res.json({

            total:dados.length,

            campeonatos:dados

        });



    }

    catch(error){


        res.status(500).json({

            erro:
            "Erro ao buscar campeonatos",

            detalhe:
            error.message

        });


    }



});



/*
====================================
 STATUS SISTEMA
====================================
*/


app.get(

"/api/ping",

(req,res)=>{


    res.json({

        status:"online",

        sistema:"BetVision AI",

        versao:"1.0",

        banco:"SQLite",

        horario:new Date()

    });


});



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


        jogosHoje:0,


        campeonatos:0,


        analisesGeradas:0,


        oportunidades:0,


        statusIA:
        "aguardando dados"


    });


});



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


});



/*
====================================
 SERVIDOR HTTP
====================================
*/


const server = app.listen(

PORT,

HOST,

async()=>{


    console.log(

        `🚀 BetVision AI rodando porta ${PORT}`

    );



    try{


        const campeonatos =

        await sincronizarSistema();



        console.log(

            `🌎 ${campeonatos.length} campeonatos carregados`

        );


    }

    catch(error){


        console.error(

            "Erro sincronização:",

            error.message

        );


    }



});



/*
====================================
 WEBSOCKET
====================================
*/


const wss = new WebSocketServer({

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

            tipo:"status",

            sistema:"BetVision AI",

            mensagem:
            "Tempo real conectado",

            data:
            new Date()

        })

    );



    socket.on(

        "close",

        ()=>{


            console.log(

                "Cliente saiu"

            );


        }

    );



});



/*
====================================
 ENVIO TEMPO REAL
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
 ERRO 404
====================================
*/


app.use(

(req,res)=>{


    res.status(404).json({

        erro:
        "Rota não encontrada",

        caminho:
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

        "Erro interno:",

        err

    );



    res.status(500).json({

        erro:
        "Erro interno do servidor"

    });


}

);
