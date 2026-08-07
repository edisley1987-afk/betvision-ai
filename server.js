// ==================================================
// BETVISION AI
// server.js
// Versão 3.0
// Servidor principal
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
// ARQUIVOS FRONTEND
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

try{


    await conectarBanco();


    console.log(
        "🟢 PostgreSQL conectado"
    );


}
catch(erro){


    console.error(

        "🔴 Erro PostgreSQL:",

        erro.message

    );


}




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

                tipo:"status",

                online:true,

                sistema:"BetVision AI"

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
// FUNÇÃO BROADCAST
// ==================================================

global.enviarAtualizacao = function(
    dados
){


    const mensagem =
        JSON.stringify(
            dados
        );



    global.websocketClients
    .forEach(

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
// ROTAS BÁSICAS
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





app.get(
    "/api/ping",
    (req,res)=>{


        res.json({

            status:"online",

            sistema:"BetVision AI",

            horario:
                new Date()

        });


    }
);





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
// TRATAMENTO DE ERRO
// ==================================================

app.use(

    (err,req,res,next)=>{


        console.error(
            err
        );


        res.status(500)
        .json({

            erro:
            "Erro interno"

        });


    }

);





// ==================================================
// INICIAR SERVIDOR
// ==================================================

servidor.listen(

    PORT,

    ()=>{


        console.log(
            `
🤖 BetVision AI iniciado

🚀 Porta: ${PORT}

🌐 Ambiente:
${process.env.NODE_ENV || "development"}

            `
        );


    }

);
