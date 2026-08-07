// ==================================================
// BETVISION AI
// server.js
// Versão 4.0
// Arquitetura completa
// ==================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import path from "path";

import {
    fileURLToPath
} from "url";


import {
    WebSocketServer
} from "ws";



import {
    conectarBanco
} from "./database/database.js";



// ROTAS

import campeonatosRouter 
from "./routes/campeonatos.js";


import oddsRouter 
from "./routes/odds.js";


import valuebetsRouter 
from "./routes/valuebets.js";


import jogosRouter 
from "./routes/jogos.js";


import futebolRouter 
from "./routes/futebol.js";


import analisesRouter 
from "./routes/analises.js";


import inteligenciaRouter 
from "./routes/inteligencia.js";



// ==================================================
// CONFIGURAÇÃO
// ==================================================

dotenv.config();



const app =
    express();



const servidor =
    http.createServer(app);



const PORT =
    process.env.PORT || 3000;



const __filename =
    fileURLToPath(import.meta.url);



const __dirname =
    path.dirname(__filename);



// ==================================================
// MIDDLEWARES
// ==================================================

app.use(

    helmet({

        contentSecurityPolicy:false

    })

);


app.use(
    compression()
);


app.use(
    cors()
);


app.use(
    express.json()
);


app.use(
    express.urlencoded({

        extended:true

    })

);


app.use(
    morgan("dev")
);



// ==================================================
// FRONTEND
// ==================================================

app.use(

    express.static(

        path.join(

            __dirname,

            "public"

        )

    )

);
// ==================================================
// BANCO DE DADOS
// ==================================================

try {

    await conectarBanco();

    console.log(
        "🟢 PostgreSQL conectado"
    );


}
catch (erro) {


    console.error(

        "🔴 Erro PostgreSQL:",

        erro.message

    );


}




// ==================================================
// ROTAS API
// ==================================================


// Campeonatos

app.use(

    "/api/campeonatos",

    campeonatosRouter

);




// Odds

app.use(

    "/api/odds",

    oddsRouter

);




// Value Bets

app.use(

    "/api/valuebets",

    valuebetsRouter

);




// Jogos

app.use(

    "/api/jogos",

    jogosRouter

);




// Futebol / Sincronização

app.use(

    "/api/futebol",

    futebolRouter

);




// Análises IA

app.use(

    "/api/analises",

    analisesRouter

);




// Inteligência Artificial

app.use(

    "/api/inteligencia",

    inteligenciaRouter

);





// ==================================================
// WEBSOCKET
// ==================================================

const wss =

    new WebSocketServer({

        server: servidor

    });



global.websocketClients =

    new Set();




wss.on(

    "connection",

    (socket)=>{


        console.log(

            "🔌 Cliente WebSocket conectado"

        );



        global.websocketClients.add(

            socket

        );



        socket.send(

            JSON.stringify({

                tipo:
                    "status",


                sistema:
                    "BetVision AI",


                online:
                    true,


                horario:
                    new Date()


            })

        );



        socket.on(

            "close",

            ()=>{


                global.websocketClients.delete(

                    socket

                );


            }

        );


    }

);






// ==================================================
// FUNÇÃO TEMPO REAL
// ==================================================

global.enviarAtualizacao =

(dados)=>{


    const mensagem =

        JSON.stringify(

            dados

        );



    global.websocketClients.forEach(

        cliente=>{


            if(

                cliente.readyState === 1

            ){


                cliente.send(

                    mensagem

                );


            }


        }

    );


};






// ==================================================
// API PING
// ==================================================

app.get(

    "/api/ping",

    (req,res)=>{


        res.json({

            status:
                "online",


            sistema:
                "BetVision AI",


            horario:
                new Date()


        });


    }

);
// ==================================================
// DASHBOARD PRINCIPAL
// ==================================================

app.get(

    "/api/dashboard",

    async(req,res)=>{


        try{


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


                roi:
                    0,


                precisao:
                    0,


                modelo:
                    "Probabilidade + Estatística",


                ultimaAtualizacao:
                    new Date()


            });



        }
        catch(erro){


            res.status(500)
            .json({

                erro:
                    erro.message

            });


        }


    }

);






// ==================================================
// PÁGINA PRINCIPAL
// ==================================================

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






// ==================================================
// ROTA DE SAÚDE DO SISTEMA
// ==================================================

app.get(

    "/api/status",

    (req,res)=>{


        res.json({

            sistema:
                "BetVision AI",


            servidor:
                "online",


            banco:
                "PostgreSQL",


            websocket:
                "ativo",


            ambiente:
                process.env.NODE_ENV || "development",


            data:
                new Date()


        });


    }

);






// ==================================================
// TRATAMENTO DE ERROS
// ==================================================

app.use(

    (erro,req,res,next)=>{


        console.error(

            "ERRO:",

            erro

        );



        res.status(500)
        .json({

            sucesso:false,


            erro:
                "Erro interno do servidor"


        });


    }

);






// ==================================================
// INICIAR SERVIDOR
// ==================================================

servidor.listen(

    PORT,

    ()=>{


        console.log(`

==================================================

🤖 BETVISION AI

==================================================

🟢 Sistema online

🚀 Porta:
${PORT}

🌐 Ambiente:
${process.env.NODE_ENV || "development"}

📡 WebSocket:
Ativo

🗄️ Banco:
PostgreSQL NeonDB

==================================================

        `);


    }

);
