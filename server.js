// ==========================================================
// BETVISION AI
// server.js
//
// SERVIDOR PRINCIPAL
//
// VERSÃO 9.1
//
// PostgreSQL / NeonDB
// Express
// WebSocket
// Render
//
// CORREÇÕES V9.1:
//
// - CORRIGE IMPORTAÇÃO sincronizarSistema
// - USA iniciarSincronizacao()
// - ATIVA agendamento automático
// - TIMEZONE America/Sao_Paulo
// - MANTÉM TODAS AS ROTAS
// - PROTEÇÃO CONTRA ERROS DE INICIALIZAÇÃO
// - COMPATÍVEL COM NODE.JS 20+
// - COMPATÍVEL COM NODE.JS 26
//
// COMPATIBILIDADE FRONTEND v7.2:
//
// - /api/valuebets
// - /api/value-bets
// - /api/campeonatos
// - /api/ping
//
// ==========================================================

import "dotenv/config";

import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";

import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import { WebSocketServer } from "ws";


// ==========================================================
// BANCO
// ==========================================================

import {
    query
} from "./database/database.js";


// ==========================================================
// SINCRONIZAÇÃO
// ==========================================================

import {
    iniciarSincronizacao,
    ativarAgendamento
} from "./services/sincronizacaoService.js";


// ==========================================================
// ROTAS
// ==========================================================

import apiRouter from "./routes/api.js";
import futebolRouter from "./routes/futebol.js";
import jogosRouter from "./routes/jogos.js";
import matchesRouter from "./routes/matches.js";
import oddsRouter from "./routes/odds.js";
import valuebetsRouter from "./routes/valuebets.js";
import analisesRouter from "./routes/analises.js";
import inteligenciaRouter from "./routes/inteligencia.js";
import alertsRouter from "./routes/alerts.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const app =
    express();

const server =
    http.createServer(
        app
    );


const PORT =
    Number(
        process.env.PORT
    ) ||
    10000;


const HOST =
    "0.0.0.0";


const TIMEZONE =
    "America/Sao_Paulo";


const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


// ==========================================================
// ESTADO DO SISTEMA
// ==========================================================

let servidorOnline =
    false;

let bancoOnline =
    false;

let ultimaSincronizacao =
    null;

let ultimaSincronizacaoResultado =
    null;

let sincronizacaoEmAndamento =
    false;


// ==========================================================
// WEBSOCKET
// ==========================================================

const wss =
    new WebSocketServer({
        server
    });


const clientesWebSocket =
    new Set();


// ==========================================================
// WEBSOCKET - CONEXÃO
// ==========================================================

wss.on(
    "connection",
    (socket) => {

        console.log(
            "🔌 WebSocket conectado"
        );


        clientesWebSocket.add(
            socket
        );


        // --------------------------------------------------
        // MENSAGEM INICIAL
        // --------------------------------------------------

        try {

            socket.send(
                JSON.stringify({

                    tipo:
                        "status",

                    sistema:
                        "BetVision AI",

                    status:
                        "online",

                    timezone:
                        TIMEZONE,

                    timestamp:
                        new Date()
                            .toISOString()

                })
            );

        }

        catch (erro) {

            console.error(
                "⚠️ Erro enviando status WebSocket:",
                erro.message
            );

        }


        // --------------------------------------------------
        // PING / PONG
        // --------------------------------------------------

        socket.isAlive =
            true;


        socket.on(
            "pong",
            () => {

                socket.isAlive =
                    true;

            }
        );


        // --------------------------------------------------
        // FECHAMENTO
        // --------------------------------------------------

        socket.on(
            "close",
            () => {

                clientesWebSocket.delete(
                    socket
                );

                console.log(
                    "🔌 WebSocket desconectado"
                );

            }
        );


        // --------------------------------------------------
        // ERRO
        // --------------------------------------------------

        socket.on(
            "error",
            (erro) => {

                console.error(
                    "❌ Erro WebSocket:",
                    erro.message
                );

                clientesWebSocket.delete(
                    socket
                );

            }
        );

    }
);


// ==========================================================
// HEARTBEAT WEBSOCKET
// ==========================================================

const intervaloWebSocket =
    setInterval(
        () => {

            for (
                const socket of clientesWebSocket
            ) {

                if (
                    socket.isAlive === false
                ) {

                    try {

                        socket.terminate();

                    }

                    catch {}

                    clientesWebSocket.delete(
                        socket
                    );

                    continue;

                }


                socket.isAlive =
                    false;


                try {

                    socket.ping();

                }

                catch {

                    clientesWebSocket.delete(
                        socket
                    );

                }

            }

        },

        30000
    );


// ==========================================================
// FUNÇÃO BROADCAST
// ==========================================================

function transmitirWebSocket(
    dados
) {

    let mensagem;

    try {

        mensagem =
            JSON.stringify(
                dados
            );

    }

    catch (erro) {

        console.error(
            "❌ Erro serializando WebSocket:",
            erro.message
        );

        return;

    }


    for (
        const socket of clientesWebSocket
    ) {

        if (
            socket.readyState === 1
        ) {

            try {

                socket.send(
                    mensagem
                );

            }

            catch (erro) {

                console.error(
                    "⚠️ Erro broadcast:",
                    erro.message
                );

            }

        }

    }

}


// ==========================================================
// MIDDLEWARES
// ==========================================================

app.set(
    "trust proxy",
    1
);


// ==========================================================
// HELMET
// ==========================================================

app.use(

    helmet({

        crossOriginResourcePolicy:
            false,

        contentSecurityPolicy:
            false

    })

);


// ==========================================================
// CORS
// ==========================================================

app.use(

    cors({

        origin:
            true,

        credentials:
            true

    })

);


// ==========================================================
// COMPRESSION
// ==========================================================

app.use(
    compression()
);


// ==========================================================
// JSON
// ==========================================================

app.use(
    express.json({
        limit: "5mb"
    })
);


app.use(
    express.urlencoded({

        extended:
            true,

        limit:
            "5mb"

    })
);


// ==========================================================
// LOG
// ==========================================================

app.use(
    morgan("dev")
);


// ==========================================================
// ARQUIVOS ESTÁTICOS
// ==========================================================

app.use(

    express.static(

        path.join(
            __dirname,
            "public"
        )

    )

);


// ==========================================================
// PING
//
// FRONTEND v7.2 USA:
//
// GET /api/ping
//
// Antes retornava 404.
// ==========================================================

app.get(
    "/api/ping",
    (
        req,
        res
    ) => {

        return res.json({

            sucesso:
                true,

            sistema:
                "BetVision AI",

            status:
                "online",

            servidor:
                servidorOnline,

            banco:
                bancoOnline,

            timezone:
                TIMEZONE,

            timestamp:
                new Date()
                    .toISOString()

        });

    }
);


// ==========================================================
// HEALTH CHECK
// ==========================================================

app.get(
    "/health",
    async (
        req,
        res
    ) => {

        return res.json({

            sucesso:
                true,

            sistema:
                "BetVision AI",

            status:
                "online",

            servidor:
                servidorOnline,

            banco:
                bancoOnline,

            timezone:
                TIMEZONE,

            timestamp:
                new Date()
                    .toISOString(),

            ultimaSincronizacao:
                ultimaSincronizacao

        });

    }
);


// ==========================================================
// STATUS
// ==========================================================

app.get(
    "/status",
    async (
        req,
        res
    ) => {

        let banco =
            false;


        try {

            await query(
                "SELECT 1"
            );

            banco =
                true;

        }

        catch {

            banco =
                false;

        }


        return res.json({

            sistema:
                "BetVision AI",

            status:
                servidorOnline
                    ? "operacional"
                    : "inicializando",

            servidor:
                servidorOnline,

            banco:
                banco,

            bancoPostgreSQL:
                banco,

            timezone:
                TIMEZONE,

            modelo:
                "BetVision Statistical AI v9.1",

            ultimaSincronizacao:
                ultimaSincronizacao,

            ultimaSincronizacaoResultado:
                ultimaSincronizacaoResultado,

            websocket:
                clientesWebSocket.size,

            timestamp:
                new Date()
                    .toISOString()

        });

    }
);


// ==========================================================
// API ROOT
// ==========================================================

app.get(
    "/api",
    (
        req,
        res
    ) => {

        return res.json({

            sucesso:
                true,

            sistema:
                "BetVision AI",

            versao:
                "9.1",

            status:
                "operacional",

            timezone:
                TIMEZONE,

            endpoints: {

                ping:
                    "/api/ping",

                dashboard:
                    "/api/dashboard",

                jogos:
                    "/api/jogos",

                campeonatos:
                    "/api/campeonatos",

                analises:
                    "/api/analises",

                valuebets:
                    "/api/valuebets",

                valueBetsCompatibilidade:
                    "/api/value-bets",

                futebol:
                    "/api/futebol",

                matches:
                    "/api/matches",

                odds:
                    "/api/odds",

                inteligencia:
                    "/api/inteligencia",

                alerts:
                    "/api/alerts",

                auth:
                    "/api/auth",

                users:
                    "/api/users",

                admin:
                    "/api/admin"

            }

        });

    }
);


// ==========================================================
// ROTAS PRINCIPAIS
// ==========================================================

app.use(
    "/api",
    apiRouter
);


app.use(
    "/api/futebol",
    futebolRouter
);


app.use(
    "/api/jogos",
    jogosRouter
);


app.use(
    "/api/matches",
    matchesRouter
);


app.use(
    "/api/odds",
    oddsRouter
);


// ==========================================================
// VALUE BETS
//
// ROTA PRINCIPAL:
//
// /api/valuebets
//
// ROTA COMPATÍVEL COM FRONTEND:
//
// /api/value-bets
// ==========================================================

app.use(
    "/api/valuebets",
    valuebetsRouter
);


app.use(
    "/api/value-bets",
    valuebetsRouter
);


// ==========================================================
// ANÁLISES
// ==========================================================

app.use(
    "/api/analises",
    analisesRouter
);


// ==========================================================
// INTELIGÊNCIA
// ==========================================================

app.use(
    "/api/inteligencia",
    inteligenciaRouter
);


// ==========================================================
// ALERTAS
// ==========================================================

app.use(
    "/api/alerts",
    alertsRouter
);


// ==========================================================
// AUTH
// ==========================================================

app.use(
    "/api/auth",
    authRouter
);


// ==========================================================
// USERS
// ==========================================================

app.use(
    "/api/users",
    usersRouter
);


// ==========================================================
// ADMIN
// ==========================================================

app.use(
    "/api/admin",
    adminRouter
);


// ==========================================================
// CAMPEONATOS
//
// FRONTEND v7.2:
//
// GET /api/campeonatos
//
// ==========================================================

app.get(
    "/api/campeonatos",
    async (
        req,
        res
    ) => {

        try {

            const resultado =
                await query(
                    `
                    SELECT
                        *
                    FROM campeonatos
                    ORDER BY
                        nome ASC NULLS LAST
                    `
                );


            const campeonatos =
                resultado.rows || [];


            return res.json({

                sucesso:
                    true,

                total:
                    campeonatos.length,

                campeonatos:

                    campeonatos,

                data:
                    campeonatos

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro /api/campeonatos:",
                erro.message
            );


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    total:
                        0,

                    campeonatos:
                        [],

                    data:
                        [],

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// DASHBOARD
// ==========================================================

app.get(
    "/api/dashboard",
    async (
        req,
        res
    ) => {

        try {

            const hoje =
                obterDataHojeBrasilServidor();


            const resultado =
                await query(
                    `
                    SELECT

                        (
                            SELECT COUNT(*)
                            FROM jogos
                            WHERE data_jogo IS NOT NULL
                            AND (
                                data_jogo AT TIME ZONE $1
                            )::date = $2::date
                        ) AS jogos_hoje,

                        (
                            SELECT COUNT(*)
                            FROM campeonatos
                        ) AS campeonatos,

                        (
                            SELECT COUNT(*)
                            FROM analises
                        ) AS analises,

                        (
                            SELECT COUNT(*)
                            FROM value_bets
                            WHERE ativo = true
                        ) AS valuebets
                    `,
                    [
                        TIMEZONE,
                        hoje
                    ]
                );


            const dados =
                resultado.rows[0] ||
                {};


            return res.json({

                sucesso:
                    true,

                sistema:
                    "BetVision AI",

                status:
                    "operacional",

                jogosHoje:
                    Number(
                        dados.jogos_hoje
                    ) || 0,

                campeonatos:
                    Number(
                        dados.campeonatos
                    ) || 0,

                analisesIA:
                    Number(
                        dados.analises
                    ) || 0,

                valueBets:
                    Number(
                        dados.valuebets
                    ) || 0,

                roi:
                    0,

                precisao:
                    0,

                modelo:
                    "Prediction Engine v2.0",

                ultimaAtualizacao:
                    ultimaSincronizacao,

                timezone:
                    TIMEZONE,

                data:
                    hoje

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro dashboard:",
                erro.message
            );


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    sistema:
                        "BetVision AI",

                    status:
                        "erro",

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

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// STATUS DO BANCO
// ==========================================================

app.get(
    "/api/database/status",
    async (
        req,
        res
    ) => {

        try {

            const resultado =
                await query(
                    "SELECT NOW() AS agora"
                );


            bancoOnline =
                true;


            return res.json({

                sucesso:
                    true,

                conectado:
                    true,

                banco:
                    "PostgreSQL / NeonDB",

                servidor:
                    resultado.rows[0]
                        ?.agora ||
                    null,

                timezone:
                    TIMEZONE

            });

        }

        catch (erro) {

            bancoOnline =
                false;


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    conectado:
                        false,

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// DATA HOJE BRASIL
// ==========================================================

function obterDataHojeBrasilServidor() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {

                timeZone:
                    TIMEZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"

            }
        ).format(
            new Date()
        );

    }

    catch {

        return new Date()
            .toISOString()
            .slice(
                0,
                10
            );

    }

}


// ==========================================================
// SINCRONIZAÇÃO MANUAL
// ==========================================================

app.post(
    "/api/sincronizar",
    async (
        req,
        res
    ) => {

        if (
            sincronizacaoEmAndamento
        ) {

            return res.json({

                sucesso:
                    false,

                emAndamento:
                    true,

                mensagem:
                    "Sincronização já está em andamento."

            });

        }


        try {

            sincronizacaoEmAndamento =
                true;


            console.log(
                "🔄 Sincronização manual solicitada..."
            );


            const resultado =
                await iniciarSincronizacao();


            ultimaSincronizacao =
                new Date()
                    .toISOString();


            ultimaSincronizacaoResultado =
                resultado;


            transmitirWebSocket({

                tipo:
                    "sincronizacao",

                sucesso:
                    resultado?.sucesso ??
                    false,

                resultado,

                timestamp:
                    ultimaSincronizacao

            });


            return res.json({

                sucesso:
                    true,

                resultado,

                ultimaSincronizacao

            });

        }

        catch (erro) {

            console.error(
                "❌ Erro sincronização manual:",
                erro.message
            );


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    erro:
                        erro.message

                });

        }

        finally {

            sincronizacaoEmAndamento =
                false;

        }

    }
);


// ==========================================================
// FALLBACK FRONTEND
// ==========================================================

app.get(
    "*",
    (
        req,
        res,
        next
    ) => {

        if (
            req.path.startsWith(
                "/api/"
            )
        ) {

            return next();

        }


        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// ==========================================================
// 404 API
// ==========================================================

app.use(
    (
        req,
        res
    ) => {

        return res
            .status(404)
            .json({

                sucesso:
                    false,

                erro:
                    "Endpoint não encontrado",

                caminho:
                    req.originalUrl

            });

    }
);


// ==========================================================
// TRATAMENTO GLOBAL DE ERROS
// ==========================================================

app.use(
    (
        erro,
        req,
        res,
        next
    ) => {

        console.error(
            "❌ ERRO GLOBAL:",
            erro
        );


        if (
            res.headersSent
        ) {

            return next(
                erro
            );

        }


        return res
            .status(
                erro.status ||
                500
            )
            .json({

                sucesso:
                    false,

                erro:
                    erro.message ||
                    "Erro interno do servidor"

            });

    }
);


// ==========================================================
// INICIALIZAÇÃO DO BANCO
// ==========================================================

async function verificarBanco() {

    try {

        console.log(
            "🔌 Verificando PostgreSQL..."
        );


        await query(
            "SELECT NOW()"
        );


        bancoOnline =
            true;


        console.log(
            "✅ PostgreSQL conectado"
        );


        return true;

    }

    catch (erro) {

        bancoOnline =
            false;


        console.error(
            "❌ PostgreSQL não conectado:",
            erro.message
        );


        return false;

    }

}


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function iniciarServidor() {

    console.log(
        "=================================================="
    );

    console.log(
        "🚀 BETVISION AI"
    );

    console.log(
        "🚀 Prediction Engine"
    );

    console.log(
        "=================================================="
    );

    console.log(
        `📅 Timezone: ${TIMEZONE}`
    );

    console.log(
        `🌐 Porta: ${PORT}`
    );

    console.log(
        `🟢 Node.js: ${process.version}`
    );

    console.log(
        "=================================================="
    );


    // ------------------------------------------------------
    // BANCO
    // ------------------------------------------------------

    await verificarBanco();


    // ------------------------------------------------------
    // SERVIDOR
    // ------------------------------------------------------

    server.listen(
        PORT,
        HOST,
        () => {

            servidorOnline =
                true;


            console.log(
                "=================================================="
            );

            console.log(
                `🚀 BetVision AI online porta ${PORT}`
            );

            console.log(
                `🌎 Timezone: ${TIMEZONE}`
            );

            console.log(
                `🗄️ PostgreSQL: ${
                    bancoOnline
                        ? "CONECTADO"
                        : "OFFLINE"
                }`
            );

            console.log(
                "🔌 WebSocket: ATIVO"
            );

            console.log(
                "=================================================="
            );


            // --------------------------------------------------
            // ROTAS DE COMPATIBILIDADE
            // --------------------------------------------------

            console.log(
                "🌐 Rotas compatíveis frontend v7.2:"
            );

            console.log(
                "   ✅ GET /api/ping"
            );

            console.log(
                "   ✅ GET /api/campeonatos"
            );

            console.log(
                "   ✅ GET /api/valuebets"
            );

            console.log(
                "   ✅ GET /api/value-bets"
            );

            console.log(
                "   ✅ GET /api/jogos"
            );

            console.log(
                "   ✅ GET /api/analises"
            );


            // --------------------------------------------------
            // AGENDAMENTO
            // --------------------------------------------------

            try {

                ativarAgendamento();

                console.log(
                    "⏰ Agendamento automático ativado"
                );

            }

            catch (erro) {

                console.error(
                    "❌ Erro ativando agendamento:",
                    erro.message
                );

            }


            // --------------------------------------------------
            // SINCRONIZAÇÃO INICIAL
            // --------------------------------------------------

            setTimeout(
                async () => {

                    if (
                        sincronizacaoEmAndamento
                    ) {

                        return;

                    }


                    try {

                        sincronizacaoEmAndamento =
                            true;


                        console.log(
                            "🔄 Executando sincronização inicial..."
                        );


                        const resultado =
                            await iniciarSincronizacao();


                        ultimaSincronizacao =
                            new Date()
                                .toISOString();


                        ultimaSincronizacaoResultado =
                            resultado;


                        console.log(
                            "✅ Sincronização inicial concluída"
                        );


                        console.log(
                            resultado
                        );


                        transmitirWebSocket({

                            tipo:
                                "sincronizacao",

                            inicial:
                                true,

                            sucesso:
                                resultado?.sucesso ??
                                false,

                            resultado,

                            timestamp:
                                ultimaSincronizacao

                        });

                    }

                    catch (erro) {

                        console.error(
                            "❌ Erro sincronização inicial:",
                            erro.message
                        );

                    }

                    finally {

                        sincronizacaoEmAndamento =
                            false;

                    }

                },

                3000
            );

        }
    );

}


// ==========================================================
// ERROS NÃO CAPTURADOS
// ==========================================================

process.on(
    "uncaughtException",
    (
        erro
    ) => {

        console.error(
            "❌ UNCAUGHT EXCEPTION:",
            erro
        );

    }
);


process.on(
    "unhandledRejection",
    (
        erro
    ) => {

        console.error(
            "❌ UNHANDLED REJECTION:",
            erro
        );

    }
);


// ==========================================================
// DESLIGAMENTO GRACIOSO
// ==========================================================

async function desligar(
    sinal
) {

    console.log(
        `\n🛑 Recebido ${sinal}. Encerrando servidor...`
    );


    clearInterval(
        intervaloWebSocket
    );


    // ------------------------------------------------------
    // FECHAR WEBSOCKETS
    // ------------------------------------------------------

    for (
        const socket of clientesWebSocket
    ) {

        try {

            socket.close();

        }

        catch {}

    }


    clientesWebSocket.clear();


    // ------------------------------------------------------
    // FECHAR HTTP
    // ------------------------------------------------------

    server.close(
        () => {

            console.log(
                "🌐 Servidor HTTP encerrado"
            );

            process.exit(
                0
            );

        }
    );


    // ------------------------------------------------------
    // SEGURANÇA
    // ------------------------------------------------------

    setTimeout(
        () => {

            process.exit(
                0
            );

        },

        10000
    );

}


process.on(
    "SIGTERM",
    () => {

        desligar(
            "SIGTERM"
        );

    }
);


process.on(
    "SIGINT",
    () => {

        desligar(
            "SIGINT"
        );

    }
);


// ==========================================================
// INICIAR
// ==========================================================

iniciarServidor();


// ==========================================================
// EXPORT
// ==========================================================

export default app;
