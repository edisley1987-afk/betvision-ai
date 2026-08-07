// ==========================================
// BetVision AI
// services/diagnosticoService.js
// ==========================================

import os from "os";

const diagnostico = {

    inicio: Date.now(),

    postgres: {
        status: "Desconectado",
        ultimoErro: null,
        tempoResposta: 0
    },

    footballData: {
        status: "Não iniciado",
        ultimaRequisicao: null,
        ultimaURL: null,
        ultimoStatus: null,
        ultimoErro: null
    },

    ia: {
        status: "Aguardando",
        jogos: 0,
        analises: 0,
        ultimoErro: null
    },

    websocket: {
        clientes: 0
    },

    sql: [],

    eventos: []

};


// ==========================================
// EVENTOS
// ==========================================

export function registrarEvento(tipo, mensagem) {

    const evento = {

        data: new Date(),

        tipo,

        mensagem

    };

    diagnostico.eventos.unshift(evento);

    if (diagnostico.eventos.length > 200) {

        diagnostico.eventos.pop();

    }

    console.log(`[${tipo}] ${mensagem}`);

}


// ==========================================
// SQL
// ==========================================

export function registrarSQL(sql, parametros, tempo, erro = null) {

    diagnostico.sql.unshift({

        data: new Date(),

        sql,

        parametros,

        tempo,

        erro

    });

    if (diagnostico.sql.length > 100) {

        diagnostico.sql.pop();

    }

}


// ==========================================
// POSTGRES
// ==========================================

export function postgresOK(ms) {

    diagnostico.postgres.status = "ONLINE";

    diagnostico.postgres.tempoResposta = ms;

}


export function postgresErro(erro) {

    diagnostico.postgres.status = "ERRO";

    diagnostico.postgres.ultimoErro = erro;

}


// ==========================================
// FOOTBALL DATA
// ==========================================

export function footballRequest(url) {

    diagnostico.footballData.ultimaURL = url;

    diagnostico.footballData.ultimaRequisicao = new Date();

}


export function footballOK(status) {

    diagnostico.footballData.status = "ONLINE";

    diagnostico.footballData.ultimoStatus = status;

}


export function footballErro(erro) {

    diagnostico.footballData.status = "ERRO";

    diagnostico.footballData.ultimoErro = erro;

}


// ==========================================
// IA
// ==========================================

export function iaStatus(status) {

    diagnostico.ia.status = status;

}


export function iaJogos(total) {

    diagnostico.ia.jogos = total;

}


export function iaAnalises(total) {

    diagnostico.ia.analises = total;

}


export function iaErro(erro) {

    diagnostico.ia.ultimoErro = erro;

}


// ==========================================
// WEBSOCKET
// ==========================================

export function websocketClientes(total) {

    diagnostico.websocket.clientes = total;

}


// ==========================================
// STATUS COMPLETO
// ==========================================

export function obterDiagnostico() {

    return {

        servidor: {

            uptime: process.uptime(),

            memoriaMB: Math.round(process.memoryUsage().rss / 1024 / 1024),

            cpu: os.loadavg(),

            plataforma: process.platform,

            node: process.version

        },

        postgres: diagnostico.postgres,

        footballData: diagnostico.footballData,

        inteligencia: diagnostico.ia,

        websocket: diagnostico.websocket,

        sql: diagnostico.sql,

        eventos: diagnostico.eventos

    };

}
