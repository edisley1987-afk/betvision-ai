// ==================================================
// BETVISION AI
// server.js
// Versão 3.1
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

import { fileURLToPath } from "url";

import { WebSocketServer } from "ws";

import { conectarBanco } from "./database/database.js";

import campeonatosRouter from "./routes/campeonatos.js";


// ==================================================
// CONFIGURAÇÃO
// ==================================================

dotenv.config();


const app = express();


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
// BANCO POSTGRESQL
// ==================================================

try{


    await conectarBanco();


    console.log(
        "🟢 PostgreSQL conectado"
    );


}
catch(erro){


    console.error(

        "🔴 Falha PostgreSQL:",

        erro.message

    );


}




// ==================================================
// ROTAS API
// ==================================================


// Dashboard

app.get(

    "/api/dashboard",

    async(req,res)=>{


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

);




// Ping

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




// Campeonatos

app.use(

    "/api/campeonatos",

    campeonatosRouter

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


                online:
                    true,


                sistema:
                    "BetVision AI"

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
// ENVIO TEMPO REAL
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
            erro
        );


        res.status(500)
        .json({

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

🤖 BetVision AI iniciado

🚀 Porta: ${PORT}

🌐 Ambiente:
${process.env.NODE_ENV || "development"}

        `);


    }

);
