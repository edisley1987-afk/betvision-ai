import express from "express";
import cors from "cors";
import compression from "compression";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import jogosRouter from "./routes/jogos.js";
import oddsRouter from "./routes/odds.js";
import analisesRouter from "./routes/analises.js";
import valuebetsRouter from "./routes/valuebets.js";


dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();



const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";



/*
====================================
 MIDDLEWARES
====================================
*/


app.use(cors());

app.use(express.json());

app.use(compression());



app.use(express.static(
    path.join(__dirname,"public")
));



/*
====================================
 ROTAS API
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
 STATUS SISTEMA
====================================
*/


app.get("/api/ping",(req,res)=>{


    res.json({

        status:"online",

        sistema:"BetVision AI",

        versao:"1.0",

        timestamp:new Date()

    });


});



/*
====================================
 DASHBOARD PRINCIPAL
====================================
*/


app.get("/api/dashboard",(req,res)=>{


    res.json({

        sistema:"BetVision AI",

        jogosHoje:0,

        analisesGeradas:0,

        oportunidades:0,

        statusIA:"aguardando dados",

        servidor:"online"


    });


});



/*
====================================
 FRONTEND
====================================
*/


app.get("/",(req,res)=>{


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
 ERRO 404
====================================
*/


app.use((req,res)=>{


    res.status(404).json({

        erro:"Endpoint não encontrado",

        rota:req.originalUrl

    });


});



/*
====================================
 TRATAMENTO DE ERROS
====================================
*/


app.use((err,req,res,next)=>{


    console.error(
        "Erro:",
        err
    );


    res.status(500).json({

        erro:"Erro interno do servidor"

    });


});



/*
====================================
 SERVIDOR HTTP
====================================
*/


const server = app.listen(
    PORT,
    HOST,
    ()=>{


        console.log(
            `🚀 BetVision AI rodando na porta ${PORT}`
        );


    }

);



/*
====================================
 WEBSOCKET REAL TIME
====================================
*/


const wss = new WebSocketServer({

    server

});



wss.on(
    "connection",
    (socket)=>{


        console.log(
            "🔵 Cliente WebSocket conectado"
        );



        socket.send(

            JSON.stringify({

                tipo:"status",

                sistema:"BetVision AI",

                mensagem:
                "Conexão WebSocket ativa",

                horario:
                new Date()

            })

        );



        socket.on(
            "close",
            ()=>{


                console.log(
                    "Cliente WebSocket desconectado"
                );


            }

        );


    }

);



/*
====================================
 FUNÇÃO BROADCAST FUTURA
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
