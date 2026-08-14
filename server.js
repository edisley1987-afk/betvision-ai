// ==================================================
// BETVISION AI
// server.js
// Versão 4.4
//
// SERVIDOR PRINCIPAL
// Neon PostgreSQL + Football-Data
//
// CORREÇÕES:
// - Servidor inicia ANTES do PostgreSQL
// - Servidor inicia ANTES da sincronização
// - Bind explícito em 0.0.0.0 para Render
// - Falha do banco não impede o servidor de subir
// - Falha da sincronização não impede o servidor de subir
// - Health Check disponível imediatamente
// - WebSocket preservado
// - Todas as rotas preservadas
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

const app = express();

const servidor =
    http.createServer(app);

// ==================================================
// RENDER
//
// O Render fornece process.env.PORT.
// Nunca devemos depender somente de uma porta fixa.
//
// 0.0.0.0 permite acesso externo ao serviço.
// ==================================================

const PORT =
    Number(process.env.PORT) || 3000;

const HOST =
    "0.0.0.0";

// ==================================================
// CAMINHOS
// ==================================================

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

// ==================================================
// ESTADO DO SISTEMA
// ==================================================

global.sistemaStatus = {

    servidor: false,

    banco: false,

    sincronizacao: false,

    websocket: false,

    iniciadoEm: null

};

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
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
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
// HEALTH CHECK
//
// IMPORTANTE:
// Esta rota fica registrada ANTES de qualquer
// inicialização do banco.
//
// O Render consegue verificar o servidor mesmo
// enquanto PostgreSQL ou sincronização inicializam.
// ==================================================

app.get(
    "/health",
    (req, res) => {

        res.status(200)
            .json({

                status: "ok",

                sistema:
                    "BetVision AI",

                servidor:
                    global.sistemaStatus.servidor
                        ? "online"
                        : "iniciando",

                banco:
                    global.sistemaStatus.banco
                        ? "online"
                        : "aguardando",

                sincronizacao:
                    global.sistemaStatus.sincronizacao
                        ? "ativa"
                        : "aguardando",

                horario:
                    new Date()

            });

    }
);

// ==================================================
// API PING
// ==================================================

app.get(
    "/api/ping",
    (req, res) => {

        res.json({

            sucesso: true,

            status:
                global.sistemaStatus.servidor
                    ? "online"
                    : "iniciando",

            sistema:
                "BetVision AI",

            banco:
                global.sistemaStatus.banco
                    ? "online"
                    : "aguardando",

            horario:
                new Date()

        });

    }
);

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
// Rota oficial:
// /api/valuebets
//
// Alias:
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
// DASHBOARD REAL
// ==================================================

app.get(
    "/api/dashboard",
    async (req, res) => {

        const inicio =
            Date.now();

        try {

            // ------------------------------------------
            // Verificação rápida
            // ------------------------------------------

            if (
                !global.sistemaStatus.banco
            ) {

                return res.status(503)
                    .json({

                        sucesso: false,

                        status:
                            "banco_indisponivel",

                        sistema:
                            "BetVision AI",

                        mensagem:
                            "PostgreSQL ainda não está disponível.",

                        banco:
                            "aguardando",

                        horario:
                            new Date()

                    });

            }

            // ------------------------------------------
            // Consulta
            // ------------------------------------------

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
                            WHERE DATE(data_jogo) =
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

                `);

            const dados =
                resultado.rows[0] || {};

            // ------------------------------------------
            // Resposta
            // ------------------------------------------

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
                    "Probabilidade + Estatística",

                ultimaAtualizacao:
                    new Date()

            };

            const tempo =
                Date.now() - inicio;

            console.log(
                `📊 Dashboard: ${tempo} ms`
            );

            return res.json(
                resposta
            );

        }

        catch (erro) {

            console.error(
                "🔴 Erro dashboard:",
                erro.message
            );

            return res.status(500)
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

global.sistemaStatus.websocket =
    true;

wss.on(
    "connection",
    (socket) => {

        console.log(
            "🔌 Cliente WebSocket conectado"
        );

        global.websocketClients.add(
            socket
        );

        try {

            socket.send(
                JSON.stringify({

                    tipo: "status",

                    sistema:
                        "BetVision AI",

                    online: true,

                    banco:
                        global.sistemaStatus.banco,

                    horario:
                        new Date()

                })
            );

        }

        catch (erro) {

            console.error(
                "🔴 Erro envio WebSocket:",
                erro.message
            );

        }

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
                    "🔴 WebSocket:",
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
                            "🔴 Erro WebSocket:",
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
                global.sistemaStatus.servidor
                    ? "online"
                    : "iniciando",

            banco:
                global.sistemaStatus.banco
                    ? "online"
                    : "aguardando",

            sincronizacao:
                global.sistemaStatus.sincronizacao
                    ? "ativa"
                    : "aguardando",

            websocket:
                global.sistemaStatus.websocket
                    ? "ativo"
                    : "inativo",

            ambiente:
                process.env.NODE_ENV ||
                "development",

            porta:
                PORT,

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
// ROTA NÃO ENCONTRADA - API
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

        return res.status(500)
            .json({

                sucesso: false,

                erro:
                    "Erro interno do servidor"

            });

    }
);

// ==================================================
// FUNÇÃO DE INICIALIZAÇÃO DO BANCO
//
// IMPORTANTE:
// É executada DEPOIS que o servidor já está ouvindo.
// ==================================================

async function inicializarBanco() {

    console.log(
        "🔄 Iniciando conexão PostgreSQL..."
    );

    try {

        await conectarBanco();

        global.sistemaStatus.banco =
            true;

        console.log(
            "🟢 PostgreSQL conectado"
        );

    }

    catch (erro) {

        global.sistemaStatus.banco =
            false;

        console.error(
            "🔴 Erro PostgreSQL:",
            erro.message
        );

        console.error(
            "⚠️ Servidor continuará online."
        );

        console.error(
            "⚠️ O sistema tentará utilizar o banco novamente quando aplicável."
        );

    }

}

// ==================================================
// FUNÇÃO DE INICIALIZAÇÃO DA SINCRONIZAÇÃO
// ==================================================

async function inicializarSincronizacao() {

    if (
        !global.sistemaStatus.banco
    ) {

        console.log(
            "⚠️ Sincronização aguardando PostgreSQL."
        );

        return;

    }

    console.log(
        "🔄 Iniciando sincronização..."
    );

    try {

        await iniciarSincronizacao();

        global.sistemaStatus.sincronizacao =
            true;

        console.log(
            "🟢 Sincronização inicial concluída"
        );

        try {

            ativarAgendamento();

            console.log(
                "🟢 Agendamento da sincronização ativo"
            );

        }

        catch (erro) {

            console.error(
                "🔴 Erro ao ativar agendamento:",
                erro.message
            );

        }

    }

    catch (erro) {

        global.sistemaStatus.sincronizacao =
            false;

        console.error(
            "🔴 Erro sincronização:",
            erro.message
        );

        console.error(
            "⚠️ Servidor continuará online."
        );

    }

}

// ==================================================
// INICIALIZAÇÃO DO SISTEMA
//
// PRIMEIRO:
// servidor HTTP
//
// DEPOIS:
// PostgreSQL
//
// DEPOIS:
// sincronização
//
// Isso evita o timeout do Render.
// ==================================================

async function iniciarServidor() {

    return new Promise(
        (resolve, reject) => {

            servidor.listen(
                PORT,
                HOST,
                () => {

                    global.sistemaStatus.servidor =
                        true;

                    global.sistemaStatus.iniciadoEm =
                        new Date();

                    console.log(`

================================================

🤖 BETVISION AI

================================================

🟢 Sistema operacional

🚀 Porta:
${PORT}

🌐 Host:
${HOST}

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

⚽ Jogos:
 /api/jogos

🏆 Campeonatos:
 /api/campeonatos

📊 Dashboard:
 /api/dashboard

❤️ Health:
 /health

📡 Ping:
 /api/ping

================================================

                    `);

                    resolve();

                }
            );

            servidor.on(
                "error",
                (erro) => {

                    console.error(
                        "🔴 Erro servidor HTTP:",
                        erro
                    );

                    reject(
                        erro
                    );

                }
            );

        }
    );

}

// ==================================================
// INICIALIZAÇÃO PRINCIPAL
//
// ATENÇÃO:
//
// NÃO colocamos await conectarBanco()
// antes do listen().
//
// O Render precisa detectar a porta primeiro.
// ==================================================

async function iniciarSistema() {

    try {

        // ------------------------------------------
        // 1. SUBIR SERVIDOR IMEDIATAMENTE
        // ------------------------------------------

        await iniciarServidor();

        console.log(
            "🟢 Porta detectada pelo Render"
        );

        // ------------------------------------------
        // 2. BANCO
        // ------------------------------------------

        await inicializarBanco();

        // ------------------------------------------
        // 3. SINCRONIZAÇÃO
        // ------------------------------------------

        await inicializarSincronizacao();

        // ------------------------------------------
        // 4. STATUS FINAL
        // ------------------------------------------

        console.log(`

================================================

📋 STATUS FINAL DO BETVISION AI

Servidor:
${global.sistemaStatus.servidor ? "🟢 ONLINE" : "🔴 OFFLINE"}

PostgreSQL:
${global.sistemaStatus.banco ? "🟢 CONECTADO" : "🔴 INDISPONÍVEL"}

Sincronização:
${global.sistemaStatus.sincronizacao ? "🟢 ATIVA" : "🟡 AGUARDANDO"}

WebSocket:
${global.sistemaStatus.websocket ? "🟢 ATIVO" : "🔴 INATIVO"}

================================================

        `);

    }

    catch (erro) {

        console.error(
            "🔴 Erro crítico na inicialização:",
            erro
        );

        // ------------------------------------------
        // IMPORTANTE:
        //
        // Não encerramos automaticamente o processo
        // se o servidor HTTP já estiver funcionando.
        // ------------------------------------------

        if (
            global.sistemaStatus.servidor
        ) {

            console.error(
                "⚠️ Servidor HTTP permanece online."
            );

        }

        else {

            console.error(
                "🔴 Servidor HTTP não conseguiu iniciar."
            );

            process.exit(1);

        }

    }

}

// ==================================================
// TRATAMENTO DE ERROS NÃO CAPTURADOS
// ==================================================

process.on(
    "unhandledRejection",
    (erro) => {

        console.error(
            "🔴 UNHANDLED REJECTION:",
            erro
        );

        console.error(
            "⚠️ O servidor continuará executando."
        );

    }
);

process.on(
    "uncaughtException",
    (erro) => {

        console.error(
            "🔴 UNCAUGHT EXCEPTION:",
            erro
        );

        console.error(
            "⚠️ Verifique o erro acima."
        );

    }
);

// ==================================================
// DESLIGAMENTO GRACIOSO
// ==================================================

async function desligarServidor(
    sinal
) {

    console.log(
        `\n🛑 Recebido ${sinal}. Encerrando servidor...`
    );

    try {

        wss.clients.forEach(
            (cliente) => {

                try {

                    cliente.close();

                }

                catch (erro) {

                    console.error(
                        "Erro fechando WebSocket:",
                        erro.message
                    );

                }

            }
        );

        servidor.close(
            () => {

                console.log(
                    "🟢 Servidor HTTP encerrado."
                );

                process.exit(0);

            }
        );

        setTimeout(
            () => {

                console.error(
                    "⚠️ Encerramento forçado."
                );

                process.exit(1);

            },
            10000
        );

    }

    catch (erro) {

        console.error(
            "🔴 Erro no desligamento:",
            erro.message
        );

        process.exit(1);

    }

}

process.on(
    "SIGTERM",
    () => {

        desligarServidor(
            "SIGTERM"
        );

    }
);

process.on(
    "SIGINT",
    () => {

        desligarServidor(
            "SIGINT"
        );

    }
);

// ==================================================
// INICIAR
// ==================================================

iniciarSistema();
