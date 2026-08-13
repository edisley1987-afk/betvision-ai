// ==================================================
// BETVISION AI
// server.js
// Versão 4.3
// Servidor Principal
// Neon PostgreSQL + Football-Data
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
                sistema: "BetVision AI",
                online: true,
                horario: new Date()
            })
        );

        socket.on(
            "close",
            () => {

                global.websocketClients.delete(
                    socket
                );

            }
        );

        socket.on(
            "error",
            (erro) => {

                console.error(
                    "⚠️ WebSocket:",
                    erro.message
                );

                global.websocketClients.delete(
                    socket
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
                            "⚠️ Erro WebSocket:",
                            erro.message
                        );

                    }

                }

            }
        );

    };

// ==================================================
// CONEXÃO BANCO
// ==================================================

async function iniciarBancoEServicos() {

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

        catch (erro) {

            console.error(
                "🔴 Erro sincronização:",
                erro.message
            );

        }

    }

    catch (erro) {

        console.error(
            "🔴 Erro PostgreSQL:",
            erro.message
        );

    }

}

// ==================================================
// ROTAS API
// ==================================================

app.use(
    "/api/campeonatos",
    campeonatosRouter
);

app.use(
    "/api/odds",
    oddsRouter
);

// ==================================================
// VALUE BETS
//
// Mantemos as duas URLs:
//
// /api/valuebets
// /api/value-bets
//
// O frontend atual usa:
//
// /api/value-bets
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
// PING
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
// DASHBOARD
// ==================================================

app.get(
    "/api/dashboard",
    async (req, res) => {

        const inicio =
            Date.now();

        try {

            const resultado =
                await query(
                    `
                    SELECT

                        (
                            SELECT COUNT(*)
                            FROM campeonatos
                        ) AS campeonatos,

                        (
                            SELECT COUNT(*)
                            FROM jogos
                            WHERE
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
                            WHERE ativo = true
                        ) AS valuebets
                    `
                );

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
// STATUS
// ==================================================

app.get(
    "/api/status",
    (req, res) => {

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
                process.env.NODE_ENV ||
                "development",

            horario:
                new Date()

        });

    }
);

// ==================================================
// FRONTEND
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
// 404 API
// ==================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404)
            .json({

                sucesso: false,

                erro:
                    "Endpoint API não encontrado",

                rota:
                    req.originalUrl

            });

    }
);

// ==================================================
// TRATAMENTO DE ERROS
// ==================================================

app.use(
    (erro, req, res, next) => {

        console.error(
            "🔴 ERRO SERVIDOR:",
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
// INICIAR
// ==================================================

servidor.listen(
    PORT,
    async () => {

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

💎 Value Bets:
 /api/valuebets
 /api/value-bets

🤖 Análises:
 /api/analises

================================================
        `);

        await iniciarBancoEServicos();

    }
);
