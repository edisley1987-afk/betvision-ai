// ==========================================================
// BETVISION AI
// server.js
//
// VERSÃO 5.0
//
// SERVIDOR PRINCIPAL
//
// CORREÇÕES:
// - Render detecta a porta imediatamente
// - listen() antes da sincronização pesada
// - PostgreSQL / NeonDB
// - Timezone America/Sao_Paulo
// - Jogos de HOJE + AMANHÃ
// - Análises exibidas SOMENTE HOJE
// - Dashboard corrigido
// - WebSocket
// - Proteção contra erro de sincronização
// - Não derruba servidor se sincronização falhar
// - Mantém todas as rotas existentes
// ==========================================================

import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import http from "http";

import {
    WebSocketServer
} from "ws";


// ==========================================================
// BANCO
// ==========================================================

import {
    conectarBanco,
    query
} from "./database/database.js";


// ==========================================================
// SINCRONIZAÇÃO
// ==========================================================

import {
    sincronizarSistema
} from "./services/sincronizacaoService.js";


// ==========================================================
// ROTAS
// ==========================================================

import campeonatosRouter from "./routes/campeonatos.js";
import oddsRouter from "./routes/odds.js";
import valuebetsRouter from "./routes/valuebets.js";
import jogosRouter from "./routes/jogos.js";
import futebolRouter from "./routes/futebol.js";
import analisesRouter from "./routes/analises.js";
import inteligenciaRouter from "./routes/inteligencia.js";


// ==========================================================
// SERVIÇOS DO BANCO
// ==========================================================

import {
    obterDataHojeBrasil,
    obterDataAmanhaBrasil,
    listarJogosHoje,
    listarJogosAmanha,
    listarAnalisesHoje,
    listarValueBetsDisponiveis,
    estatisticasBanco
} from "./services/bancoService.js";


// ==========================================================
// EXPRESS
// ==========================================================

const app =
    express();


// ==========================================================
// HTTP SERVER
// ==========================================================

const servidor =
    http.createServer(app);


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const PORT =
    Number(
        process.env.PORT
    ) || 3000;

const HOST =
    "0.0.0.0";

const TIMEZONE =
    "America/Sao_Paulo";


// ==========================================================
// MIDDLEWARES
// ==========================================================

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    compression()
);

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

app.use(
    morgan("combined")
);


// ==========================================================
// ARQUIVOS ESTÁTICOS
// ==========================================================

app.use(
    express.static(
        "public"
    )
);


// ==========================================================
// WEBSOCKET
// ==========================================================

const wss =
    new WebSocketServer({
        server: servidor,
        path: "/ws"
    });


// ==========================================================
// CLIENTES WEBSOCKET
// ==========================================================

const clientesWebSocket =
    new Set();


// ==========================================================
// CONEXÃO WEBSOCKET
// ==========================================================

wss.on(
    "connection",
    (ws) => {

        console.log(
            "🔌 WebSocket conectado"
        );

        clientesWebSocket.add(
            ws
        );


        // --------------------------------------------------
        // MENSAGEM INICIAL
        // --------------------------------------------------

        try {

            ws.send(
                JSON.stringify({
                    tipo: "conexao",
                    status: "online",
                    sistema: "BetVision AI",
                    timezone: TIMEZONE,
                    data: obterDataHojeBrasil(),
                    timestamp: new Date().toISOString()
                })
            );

        } catch (erro) {

            console.error(
                "⚠️ Erro enviando mensagem inicial WS:",
                erro.message
            );

        }


        // --------------------------------------------------
        // PING
        // --------------------------------------------------

        ws.isAlive =
            true;


        ws.on(
            "pong",
            () => {

                ws.isAlive =
                    true;

            }
        );


        // --------------------------------------------------
        // CLOSE
        // --------------------------------------------------

        ws.on(
            "close",
            () => {

                clientesWebSocket.delete(
                    ws
                );

                console.log(
                    "🔌 WebSocket desconectado"
                );

            }
        );


        // --------------------------------------------------
        // ERROR
        // --------------------------------------------------

        ws.on(
            "error",
            (erro) => {

                console.error(
                    "⚠️ WebSocket:",
                    erro.message
                );

                clientesWebSocket.delete(
                    ws
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
                const ws of clientesWebSocket
            ) {

                if (
                    ws.isAlive === false
                ) {

                    try {

                        ws.terminate();

                    } catch {}

                    clientesWebSocket.delete(
                        ws
                    );

                    continue;

                }


                ws.isAlive =
                    false;


                try {

                    ws.ping();

                } catch {

                    clientesWebSocket.delete(
                        ws
                    );

                }

            }

        },
        30000
    );


// ==========================================================
// BROADCAST
// ==========================================================

function transmitirWebSocket(
    dados
) {

    const mensagem =
        JSON.stringify(
            dados
        );


    for (
        const ws of clientesWebSocket
    ) {

        if (
            ws.readyState === 1
        ) {

            try {

                ws.send(
                    mensagem
                );

            } catch (erro) {

                console.error(
                    "⚠️ Erro broadcast:",
                    erro.message
                );

            }

        }

    }

}


// ==========================================================
// ROTAS
// ==========================================================


// ==========================================================
// CAMPEONATOS
// ==========================================================

app.use(
    "/api/campeonatos",
    campeonatosRouter
);


// ==========================================================
// ODDS
// ==========================================================

app.use(
    "/api/odds",
    oddsRouter
);


// ==========================================================
// VALUE BETS
// ==========================================================

app.use(
    "/api/valuebets",
    valuebetsRouter
);


// ==========================================================
// JOGOS
// ==========================================================

app.use(
    "/api/jogos",
    jogosRouter
);


// ==========================================================
// FUTEBOL
// ==========================================================

app.use(
    "/api/futebol",
    futebolRouter
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
// PING
// ==========================================================

app.get(
    "/api/ping",
    (req, res) => {

        res.json({

            sucesso: true,

            sistema:
                "BetVision AI",

            status:
                "online",

            timestamp:
                new Date().toISOString(),

            data:
                obterDataHojeBrasil(),

            timezone:
                TIMEZONE

        });

    }
);


// ==========================================================
// HEALTH CHECK
// ==========================================================

app.get(
    "/health",
    async (req, res) => {

        try {

            await query(
                "SELECT 1"
            );


            return res.json({

                status:
                    "ok",

                sistema:
                    "BetVision AI",

                banco:
                    "PostgreSQL conectado",

                timestamp:
                    new Date().toISOString(),

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE

            });

        }

        catch (erro) {

            console.error(
                "❌ Health check:",
                erro.message
            );


            return res
                .status(503)
                .json({

                    status:
                        "degraded",

                    sistema:
                        "BetVision AI",

                    banco:
                        "PostgreSQL indisponível",

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// STATUS
// ==========================================================

app.get(
    "/api/status",
    async (req, res) => {

        try {

            let banco =
                false;


            try {

                await query(
                    "SELECT 1"
                );

                banco =
                    true;

            } catch {}


            let estatisticas =
                null;


            try {

                estatisticas =
                    await estatisticasBanco();

            } catch {}


            return res.json({

                sistema:
                    "BetVision AI",

                status:
                    "operacional",

                banco:
                    banco
                        ? "conectado"
                        : "desconectado",

                timezone:
                    TIMEZONE,

                data:
                    obterDataHojeBrasil(),

                jogosHoje:
                    Number(
                        estatisticas?.jogos_hoje
                    ) || 0,

                jogosAmanha:
                    Number(
                        estatisticas?.jogos_amanha
                    ) || 0,

                campeonatos:
                    Number(
                        estatisticas?.campeonatos
                    ) || 0,

                analises:
                    Number(
                        estatisticas?.analises
                    ) || 0,

                valueBets:
                    Number(
                        estatisticas?.valuebets_ativas
                    ) || 0,

                modelo:
                    "BetVision Statistical AI",

                ultimaAtualizacao:
                    new Date().toISOString()

            });

        }

        catch (erro) {

            console.error(
                "❌ Status:",
                erro.message
            );


            return res
                .status(500)
                .json({

                    sistema:
                        "BetVision AI",

                    status:
                        "erro",

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// DASHBOARD
//
// IMPORTANTE:
//
// Jogos:
// HOJE + AMANHÃ
//
// Análises:
// SOMENTE HOJE
//
// Value Bets:
// HOJE + AMANHÃ
// ==========================================================

app.get(
    "/api/dashboard",
    async (req, res) => {

        try {

            const hoje =
                obterDataHojeBrasil();

            const amanha =
                obterDataAmanhaBrasil();


            console.log(
                "=========================================="
            );

            console.log(
                "📊 DASHBOARD"
            );

            console.log(
                `📅 Hoje: ${hoje}`
            );

            console.log(
                `📅 Amanhã: ${amanha}`
            );

            console.log(
                `🌎 Fuso: ${TIMEZONE}`
            );


            // ==================================================
            // JOGOS
            // ==================================================

            let jogosHoje =
                [];

            let jogosAmanha =
                [];


            try {

                jogosHoje =
                    await listarJogosHoje();

            } catch (erro) {

                console.error(
                    "⚠️ Erro jogos hoje:",
                    erro.message
                );

            }


            try {

                jogosAmanha =
                    await listarJogosAmanha();

            } catch (erro) {

                console.error(
                    "⚠️ Erro jogos amanhã:",
                    erro.message
                );

            }


            const jogos =
                [
                    ...jogosHoje,
                    ...jogosAmanha
                ];


            // ==================================================
            // ANÁLISES
            //
            // SOMENTE HOJE
            // ==================================================

            let analises =
                [];


            try {

                analises =
                    await listarAnalisesHoje();

            } catch (erro) {

                console.error(
                    "⚠️ Erro análises hoje:",
                    erro.message
                );

            }


            // ==================================================
            // VALUE BETS
            // ==================================================

            let valueBets =
                [];


            try {

                valueBets =
                    await listarValueBetsDisponiveis();

            } catch (erro) {

                console.error(
                    "⚠️ Erro value bets:",
                    erro.message
                );

            }


            // ==================================================
            // ESTATÍSTICAS
            // ==================================================

            let estatisticas =
                null;


            try {

                estatisticas =
                    await estatisticasBanco();

            } catch (erro) {

                console.error(
                    "⚠️ Erro estatísticas:",
                    erro.message
                );

            }


            // ==================================================
            // CAMPEONATOS
            // ==================================================

            let campeonatos =
                Number(
                    estatisticas?.campeonatos
                ) || 0;


            // ==================================================
            // PRECISÃO
            //
            // Só calcula se houver dados reais.
            // ==================================================

            let precisao =
                0;


            let roi =
                0;


            if (
                Array.isArray(valueBets) &&
                valueBets.length > 0
            ) {

                const valores =
                    valueBets
                        .map(
                            item =>
                                Number(
                                    item.valor_estimado
                                )
                        )
                        .filter(
                            valor =>
                                Number.isFinite(
                                    valor
                                )
                        );


                if (
                    valores.length > 0
                ) {

                    roi =
                        valores.reduce(
                            (
                                total,
                                valor
                            ) =>
                                total + valor,
                            0
                        ) /
                        valores.length;

                }

            }


            // ==================================================
            // NÃO INVENTAR PRECISÃO
            // ==================================================

            if (
                !analises.length
            ) {

                precisao =
                    0;

            }


            console.log(
                `⚽ Jogos hoje: ${jogosHoje.length}`
            );

            console.log(
                `⚽ Jogos amanhã: ${jogosAmanha.length}`
            );

            console.log(
                `🤖 Análises hoje: ${analises.length}`
            );

            console.log(
                `💎 Value Bets: ${valueBets.length}`
            );


            console.log(
                "=========================================="
            );


            return res.json({

                sucesso:
                    true,

                sistema:
                    "BetVision AI",

                status:
                    "operacional",

                timezone:
                    TIMEZONE,

                data:
                    hoje,

                hoje,

                amanha,


                // ==================================================
                // RESUMO
                // ==================================================

                resumo: {

                    jogosHoje:
                        jogosHoje.length,

                    jogosAmanha:
                        jogosAmanha.length,

                    jogosDisponiveis:
                        jogos.length,

                    campeonatos,

                    analisesIA:
                        analises.length,

                    valueBets:
                        valueBets.length,

                    roiPrevisto:
                        Number(
                            roi
                        ) || 0,

                    precisaoIA:
                        Number(
                            precisao
                        ) || 0

                },


                // ==================================================
                // JOGOS
                // ==================================================

                jogosHoje,

                jogosAmanha,

                jogos,


                // ==================================================
                // ANÁLISES
                //
                // SOMENTE HOJE
                // ==================================================

                analisesIA:
                    analises,

                analises:


                    analises,


                // ==================================================
                // VALUE BETS
                // ==================================================

                valueBets,


                // ==================================================
                // ESTATÍSTICAS
                // ==================================================

                estatisticas:


                    estatisticas,


                // ==================================================
                // MODELO
                // ==================================================

                modelo:
                    "BetVision Statistical AI",

                versaoModelo:
                    "v2.0",

                ultimaAtualizacao:
                    new Date().toISOString()

            });

        }

        catch (erro) {

            console.error(
                "❌ ERRO DASHBOARD:",
                erro
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

                    timezone:
                        TIMEZONE,

                    data:
                        obterDataHojeBrasil(),

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// RESUMO RÁPIDO
// ==========================================================

app.get(
    "/api/resumo",
    async (req, res) => {

        try {

            const estatisticas =
                await estatisticasBanco();


            return res.json({

                sucesso:
                    true,

                data:
                    obterDataHojeBrasil(),

                timezone:
                    TIMEZONE,

                jogosHoje:
                    Number(
                        estatisticas?.jogos_hoje
                    ) || 0,

                jogosAmanha:
                    Number(
                        estatisticas?.jogos_amanha
                    ) || 0,

                campeonatos:
                    Number(
                        estatisticas?.campeonatos
                    ) || 0,

                analisesIA:
                    Number(
                        estatisticas?.analises
                    ) || 0,

                valueBets:
                    Number(
                        estatisticas?.valuebets_ativas
                    ) || 0

            });

        }

        catch (erro) {

            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    erro:
                        erro.message

                });

        }

    }
);


// ==========================================================
// ROOT
// ==========================================================

app.get(
    "/",
    (req, res) => {

        res.json({

            sistema:
                "BetVision AI",

            status:
                "online",

            versao:
                "5.0",

            modelo:
                "BetVision Statistical AI",

            timezone:
                TIMEZONE,

            data:
                obterDataHojeBrasil(),

            endpoints: {

                ping:
                    "/api/ping",

                status:
                    "/api/status",

                health:
                    "/health",

                dashboard:
                    "/api/dashboard",

                jogos:
                    "/api/jogos",

                analises:
                    "/api/analises",

                valuebets:
                    "/api/valuebets",

                campeonatos:
                    "/api/campeonatos",

                websocket:
                    "/ws"

            }

        });

    }
);


// ==========================================================
// 404
// ==========================================================

app.use(
    (req, res) => {

        return res
            .status(404)
            .json({

                sucesso:
                    false,

                erro:
                    "Rota não encontrada",

                rota:
                    req.originalUrl

            });

    }
);


// ==========================================================
// ERROR HANDLER
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
                erro.status || 500
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
// FUNÇÃO DE SINCRONIZAÇÃO
// ==========================================================

async function executarSincronizacao() {

    try {

        console.log(
            "=========================================="
        );

        console.log(
            "🔄 INICIANDO SINCRONIZAÇÃO DO SISTEMA"
        );

        console.log(
            `📅 Data Brasil: ${obterDataHojeBrasil()}`
        );

        console.log(
            `🌎 Fuso: ${TIMEZONE}`
        );

        console.log(
            "=========================================="
        );


        await conectarBanco();


        console.log(
            "✅ PostgreSQL conectado"
        );


        try {

            await sincronizarSistema();

            console.log(
                "✅ Sincronização concluída"
            );

        }

        catch (erroSync) {

            console.error(
                "⚠️ Falha na sincronização:"
            );

            console.error(
                erroSync.message
            );

            console.log(
                "⚠️ Servidor continuará online."
            );

        }


        // ==================================================
        // NOTIFICAR FRONTEND
        // ==================================================

        transmitirWebSocket({

            tipo:
                "sistema",

            evento:
                "sincronizacao",

            status:
                "concluida",

            data:
                obterDataHojeBrasil(),

            timestamp:
                new Date().toISOString()

        });

    }

    catch (erro) {

        console.error(
            "❌ ERRO INICIALIZANDO BANCO:"
        );

        console.error(
            erro.message
        );

        console.log(
            "⚠️ Servidor permanece online."
        );

    }

}


// ==========================================================
// SINCRONIZAÇÃO AUTOMÁTICA
// ==========================================================

let sincronizacaoEmExecucao =
    false;


async function executarSincronizacaoSegura() {

    if (
        sincronizacaoEmExecucao
    ) {

        console.log(
            "⏳ Sincronização já em execução."
        );

        return;

    }


    sincronizacaoEmExecucao =
        true;


    try {

        await executarSincronizacao();

    }

    catch (erro) {

        console.error(
            "❌ Erro sincronização segura:",
            erro.message
        );

    }

    finally {

        sincronizacaoEmExecucao =
            false;

    }

}


// ==========================================================
// INICIAR SERVIDOR
//
// IMPORTANTE:
//
// O Render precisa detectar a porta ANTES
// de qualquer operação pesada.
//
// NÃO colocar await conectarBanco()
// antes do listen().
// ==========================================================

servidor.listen(
    PORT,
    HOST,
    () => {

        console.log(
            "=========================================="
        );

        console.log(
            "🚀 BETVISION AI ONLINE"
        );

        console.log(
            `🌐 Porta: ${PORT}`
        );

        console.log(
            `🌐 Host: ${HOST}`
        );

        console.log(
            `🌎 Timezone: ${TIMEZONE}`
        );

        console.log(
            `📅 Data Brasil: ${obterDataHojeBrasil()}`
        );

        console.log(
            `🔌 WebSocket: /ws`
        );

        console.log(
            "=========================================="
        );


        // --------------------------------------------------
        // SINCRONIZAÇÃO APÓS SERVIDOR ONLINE
        // --------------------------------------------------

        setTimeout(
            () => {

                executarSincronizacaoSegura();

            },
            1000
        );

    }
);


// ==========================================================
// SINCRONIZAÇÃO PERIÓDICA
//
// 15 MINUTOS
// ==========================================================

const INTERVALO_SINCRONIZACAO =
    15 * 60 * 1000;


const intervaloSincronizacao =
    setInterval(
        () => {

            console.log(
                "🔄 Executando sincronização automática..."
            );


            executarSincronizacaoSegura();

        },
        INTERVALO_SINCRONIZACAO
    );


// ==========================================================
// SHUTDOWN
// ==========================================================

async function desligarServidor(
    sinal
) {

    console.log(
        `\n🛑 Recebido ${sinal}. Encerrando servidor...`
    );


    clearInterval(
        intervaloWebSocket
    );


    clearInterval(
        intervaloSincronizacao
    );


    try {

        for (
            const ws of clientesWebSocket
        ) {

            try {

                ws.close();

            } catch {}

        }


        wss.close();


    } catch (erro) {

        console.error(
            "⚠️ Erro fechando WebSocket:",
            erro.message
        );

    }


    servidor.close(
        () => {

            console.log(
                "✅ Servidor encerrado."
            );

            process.exit(
                0
            );

        }
    );


    setTimeout(
        () => {

            console.error(
                "⚠️ Encerramento forçado."
            );

            process.exit(
                1
            );

        },
        10000
    );

}


// ==========================================================
// SIGNALS
// ==========================================================

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


// ==========================================================
// ERRO NÃO CAPTURADO
// ==========================================================

process.on(
    "uncaughtException",
    (erro) => {

        console.error(
            "❌ UNCAUGHT EXCEPTION:"
        );

        console.error(
            erro
        );

    }
);


// ==========================================================
// PROMISE NÃO TRATADA
// ==========================================================

process.on(
    "unhandledRejection",
    (erro) => {

        console.error(
            "❌ UNHANDLED REJECTION:"
        );

        console.error(
            erro
        );

    }
);
