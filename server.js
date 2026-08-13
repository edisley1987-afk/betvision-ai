// ==================================================
// BETVISION AI
// server.js
// Versão 4.3
// Servidor Principal
//
// Neon PostgreSQL + Football-Data
//
// CORREÇÕES:
//
// - /api/value-bets corrigido
// - Mantém /api/valuebets por compatibilidade
// - Dashboard PostgreSQL
// - WebSocket
// - Rotas IA
// - Rotas análises
// - Rotas jogos
// - Rotas odds
// - Rotas Value Bets
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


// ==================================================
// BANCO
// ==================================================

import {
    conectarBanco,
    query
} from "./database/database.js";


// ==================================================
// SINCRONIZAÇÃO
// ==================================================

import {
    iniciarSincronizacao,
    ativarAgendamento
} from "./services/sincronizacaoService.js";


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

        contentSecurityPolicy: false

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

        extended: true

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
// CONEXÃO BANCO + INICIALIZAÇÃO SERVIÇOS
// ==================================================

try {

    await conectarBanco();


    console.log(
        "🟢 PostgreSQL conectado"
    );


    // ==============================================
    // SINCRONIZAÇÃO
    // ==============================================

    try {

        await iniciarSincronizacao();


        ativarAgendamento();


        console.log(
            "🟢 Sincronização de campeonatos ativa"
        );

    }

    catch (error) {

        console.error(

            "🔴 Erro sincronização:",

            error.message

        );

    }

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


// ==================================================
// CAMPEONATOS
// ==================================================

app.use(

    "/api/campeonatos",

    campeonatosRouter

);


// ==================================================
// ODDS
// ==================================================

app.use(

    "/api/odds",

    oddsRouter

);


// ==================================================
// VALUE BETS
//
// ROTA ORIGINAL:
//
// /api/valuebets
//
// ROTA NOVA:
//
// /api/value-bets
//
// O frontend atual utiliza:
//
// /api/value-bets
//
// As duas continuam funcionando.
// ==================================================

app.use(

    "/api/valuebets",

    valuebetsRouter

);


app.use(

    "/api/value-bets",

    valuebetsRouter

);


// ==================================================
// JOGOS
// ==================================================

app.use(

    "/api/jogos",

    jogosRouter

);


// ==================================================
// FUTEBOL
// ==================================================

app.use(

    "/api/futebol",

    futebolRouter

);


// ==================================================
// ANÁLISES
// ==================================================

app.use(

    "/api/analises",

    analisesRouter

);


// ==================================================
// INTELIGÊNCIA
// ==================================================

app.use(

    "/api/inteligencia",

    inteligenciaRouter

);


// ==================================================
// API PING
// ==================================================

app.get(

    "/api/ping",

    (req, res) => {

        res.json({

            sucesso: true,

            status: "online",

            sistema: "BetVision AI",

            horario: new Date()

        });

    }

);


// ==================================================
// DASHBOARD REAL
// ==================================================

app.get(

    "/api/dashboard",

    async (req, res) => {

        const inicio =
            Date.now();


        try {

            const resultado =

                await query(`

                    SELECT

                        (
                            SELECT COUNT(*)
                            FROM campeonatos
                        ) AS campeonatos,


                        (
                            SELECT COUNT(*)
                            FROM jogos

                            WHERE

                                data_jogo IS NOT NULL

                                AND

                                (
                                    data_jogo
                                    AT TIME ZONE
                                    'America/Sao_Paulo'
                                )::date

                                =

                                (
                                    CURRENT_TIMESTAMP
                                    AT TIME ZONE
                                    'America/Sao_Paulo'
                                )::date
                        ) AS jogos,


                        (
                            SELECT COUNT(*)
                            FROM analises
                        ) AS analises,


                        (
                            SELECT COUNT(*)
                            FROM value_bets

                            WHERE
                                ativo = true
                        ) AS valuebets

                `);


            const dados =
                resultado.rows[0] || {};


            const resposta = {

                sistema:
                    "BetVision AI",


                status:
                    "operacional",


                jogosHoje:
                    Number(
                        dados.jogos || 0
                    ),


                campeonatos:
                    Number(
                        dados.campeonatos || 0
                    ),


                analisesIA:
                    Number(
                        dados.analises || 0
                    ),


                valueBets:
                    Number(
                        dados.valuebets || 0
                    ),


                roi:
                    0,


                precisao:
                    0,


                modelo:
                    "BetVision Statistical AI v10.0",


                ultimaAtualizacao:
                    new Date()

            };


            const tempo =
                Date.now() - inicio;


            console.log(

                `📊 Dashboard: ${tempo} ms`

            );


            res.json(
                resposta
            );

        }

        catch (erro) {

            console.error(

                "🔴 Erro dashboard:",

                erro.message

            );


            res.status(500)
                .json({

                    sucesso: false,

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

    (socket) => {

        console.log(

            "🔌 Cliente WebSocket conectado"

        );


        global.websocketClients.add(

            socket

        );


        socket.send(

            JSON.stringify({

                tipo: "status",

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

            () => {

                global.websocketClients.delete(

                    socket

                );

                console.log(

                    "🔌 Cliente WebSocket desconectado"

                );

            }

        );


        socket.on(

            "error",

            (erro) => {

                console.error(

                    "⚠️ Erro WebSocket:",

                    erro.message

                );

            }

        );

    }

);


// ==================================================
// ENVIO WEBSOCKET
// ==================================================

global.enviarAtualizacao =

    (dados) => {

        const mensagem =

            JSON.stringify(

                dados

            );


        global.websocketClients.forEach(

            (cliente) => {

                if (

                    cliente.readyState === 1

                ) {

                    try {

                        cliente.send(

                            mensagem

                        );

                    }

                    catch (erro) {

                        console.error(

                            "⚠️ Erro enviando WebSocket:",

                            erro.message

                        );

                    }

                }

            }

        );

    };


// ==================================================
// STATUS DO SISTEMA
// ==================================================

app.get(

    "/api/status",

    (req, res) => {

        res.json({

            sucesso: true,

            sistema:
                "BetVision AI",


            servidor:
                "online",


            banco:
                "PostgreSQL NeonDB",


            websocket:
                "ativo",


            ambiente:

                process.env.NODE_ENV ||
                "development",


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

    (req, res) => {

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
// ROTA 404 PARA API
// ==================================================
//
// Ajuda a identificar rapidamente quando
// o frontend chama uma URL inexistente.
// ==================================================

app.use(

    "/api",

    (req, res) => {

        console.warn(

            `⚠️ API 404: ${req.method} ${req.originalUrl}`

        );


        res.status(404)
            .json({

                sucesso: false,

                erro:
                    "Endpoint API não encontrado",

                rota:
                    req.originalUrl,

                metodo:
                    req.method

            });

    }

);


// ==================================================
// TRATAMENTO DE ERROS
// ==================================================

app.use(

    (erro, req, res, next) => {

        console.error(

            "ERRO SERVIDOR:",

            erro

        );


        if (
            res.headersSent
        ) {

            return next(
                erro
            );

        }


        res.status(500)
            .json({

                sucesso: false,

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

    () => {

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

🧠 Motor:
BetVision Statistical AI v10.0

💎 Value Bets:

/api/value-bets
/api/valuebets

🤖 Análises:

/api/analises

⚽ Jogos:

/api/jogos

================================================

        `);

    }

);
