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

import db, { conectarBanco } from "./database/database.js";


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
 CRIAR TABELAS
====================================
*/


async function criarTabelas(){

    try{


        await db.query(`

        CREATE TABLE IF NOT EXISTS campeonatos (

            id INTEGER PRIMARY KEY,

            nome VARCHAR(150) NOT NULL,

            pais VARCHAR(100),

            continente VARCHAR(100),

            temporada VARCHAR(20)

        );

        `);


        console.log(
            "✅ Tabela campeonatos verificada"
        );



        await db.query(`

        CREATE TABLE IF NOT EXISTS analises (

            id SERIAL PRIMARY KEY,

            jogo VARCHAR(200),

            probabilidade_casa NUMERIC,

            probabilidade_empate NUMERIC,

            probabilidade_fora NUMERIC,

            gols_esperados NUMERIC,

            placar_previsto VARCHAR(20),

            value_bet BOOLEAN DEFAULT false,

            confianca VARCHAR(50),

            algoritmo VARCHAR(100),

            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        );

        `);


        console.log(
            "✅ Tabela analises verificada"
        );



        await db.query(`

        CREATE TABLE IF NOT EXISTS valuebets (

            id SERIAL PRIMARY KEY,

            jogo VARCHAR(200),

            mercado VARCHAR(100),

            odd_mercado NUMERIC,

            odd_justa NUMERIC,

            valor_percentual NUMERIC,

            confianca VARCHAR(50),

            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        );

        `);


        console.log(
            "✅ Tabela valuebets verificada"
        );


    }


    catch(error){


        console.error(

            "❌ Erro criando tabelas:",
            error.message

        );


    }

}
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


app.get("/api/dashboard", async (req, res) => {

    try {

        const campeonatos = await listarCampeonatos();

        let jogos = 0;
        let analises = 0;
        let valuebets = 0;

        try {
            const r = await db.query("SELECT COUNT(*) FROM jogos");
            jogos = Number(r.rows[0].count);
        } catch (e) {
            console.log("Tabela jogos inexistente.");
        }

        try {
            const r = await db.query("SELECT COUNT(*) FROM analises");
            analises = Number(r.rows[0].count);
        } catch (e) {
            console.log("Tabela analises inexistente.");
        }

        try {
            const r = await db.query("SELECT COUNT(*) FROM valuebets");
            valuebets = Number(r.rows[0].count);
        } catch (e) {
            console.log("Tabela valuebets inexistente.");
        }

        res.json({

            sistema: "BetVision AI",
            status: "operacional",

            jogosHoje: jogos,
            campeonatos: campeonatos.length,
            analisesIA: analises,
            valueBets: valuebets,

            modelo: "Probabilidade + Estatística",
            ultimaAtualizacao: new Date()

        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

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


        await conectarBanco();



        await criarTabelas();



        const campeonatos =

        await sincronizarSistema();



        console.log(

        `🌎 ${campeonatos.length} campeonatos sincronizados`

        );


    }

    catch(error){


        console.error(

            "Erro inicialização:",

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


}

);



export function enviarAtualizacao(dados){


    wss.clients.forEach(

        cliente=>{


            if(cliente.readyState === 1){


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


    console.error(err);



    res.status(500).json({

        erro:
        "Erro interno do servidor"

    });


}

);
