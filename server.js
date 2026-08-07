// ==================================================
// BETVISION AI
// server.js
// Versão 4.1
// Servidor Principal
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
    conectarBanco,
    query
} from "./database/database.js";



// ==================================================
// ROTAS
// ==================================================

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
// CONEXÃO BANCO
// ==================================================

try {

    await conectarBanco();


    console.log(
        "🟢 PostgreSQL conectado"
    );


    // ==================================================
    // SINCRONIZAÇÃO CAMPEONATOS API FOOTBALL-DATA
    // ==================================================

    await iniciarSincronizacao();


    ativarAgendamento();


}
catch(erro){

    console.error(

        "🔴 Erro PostgreSQL:",

        erro.message

    );

}

// ==================================================
// ROTAS DO SISTEMA
// ==================================================


app.use(

    "/api/campeonatos",

    campeonatosRouter

);



app.use(

    "/api/odds",

    oddsRouter

);



app.use(

    "/api/valuebets",

    valuebetsRouter

);



app.use(

    "/api/jogos",

    jogosRouter

);



app.use(

    "/api/futebol",

    futebolRouter

);



app.use(

    "/api/analises",

    analisesRouter

);



app.use(

    "/api/inteligencia",

    inteligenciaRouter

);






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
// DASHBOARD REAL
// ==================================================

app.get(

    "/api/dashboard",

    async(req,res)=>{


        try{


            const campeonatos =

                await query(

                    `
                    SELECT COUNT(*) 

                    FROM campeonatos

                    `

                );



            const jogos =

                await query(

                    `
                    SELECT COUNT(*) 

                    FROM jogos

                    `

                );



            const analises =

                await query(

                    `
                    SELECT COUNT(*) 

                    FROM analises

                    `

                );



            const valuebets =

                await query(

                    `
                    SELECT COUNT(*)

                    FROM value_bets

                    WHERE ativo=true

                    `

                );





            res.json({

                sistema:
                    "BetVision AI",



                status:
                    "operacional",



                jogosHoje:
                    Number(
                        jogos.rows[0].count
                    ),



                campeonatos:
                    Number(
                        campeonatos.rows[0].count
                    ),



                analisesIA:
                    Number(
                        analises.rows[0].count
                    ),



                valueBets:
                    Number(
                        valuebets.rows[0].count
                    ),



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


            console.error(

                "Erro dashboard:",

                erro.message

            );



            res.status(500)
            .json({

                erro:
                    erro.message

            });


        }


    }

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
// ENVIO TEMPO REAL WEBSOCKET
// ==================================================

global.enviarAtualizacao = (

    dados

)=>{


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
// STATUS DO SISTEMA
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
                "PostgreSQL NeonDB",


            websocket:
                "ativo",


            ambiente:
                process.env.NODE_ENV || "development",


            horario:
                new Date()


        });


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
// ERROS
// ==================================================

app.use(

    (erro,req,res,next)=>{


        console.error(

            "ERRO SERVIDOR:",

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

================================================

🤖 BETVISION AI

================================================

🟢 Sistema operacional

🚀 Porta:
${PORT}

🌐 Ambiente:
${process.env.NODE_ENV || "development"}

🗄 Banco:
PostgreSQL NeonDB

📡 WebSocket:
Ativo

================================================

        `);


    }

);
