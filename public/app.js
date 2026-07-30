// ==========================================
// BetVision AI v4.0
// public/app.js
// Parte 1A
// Inicialização + Dashboard + KPIs
// ==========================================

"use strict";

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let socket = null;

let graficoAnalises = null;
let graficoValue = null;

let dashboardCache = {};

const API = {

    dashboard: "/api/dashboard",
    campeonatos: "/api/campeonatos",
    jogos: "/api/jogos",
    analises: "/api/analises",
    valuebets: "/api/valuebets",
    ping: "/api/ping"

};

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    mostrarLoader();

    try {

        await carregarDashboard();

        await verificarServidor();

        conectarWebSocket();

    } catch (erro) {

        console.error(erro);

        adicionarLog(
            "Erro iniciando sistema."
        );

    }

    esconderLoader();

});

// ==========================================
// DASHBOARD
// ==========================================

async function carregarDashboard() {

    try {

        const resposta = await fetch(API.dashboard);

        if (!resposta.ok) {

            throw new Error(
                "Dashboard indisponível."
            );

        }

        const dados = await resposta.json();

        dashboardCache = dados;

        atualizarKPIs(dados);

        adicionarLog(
            "Dashboard carregado."
        );

    }

    catch (erro) {

        console.error(erro);

        toast(
            "Erro carregando dashboard."
        );

    }

}

// ==========================================
// KPIs
// ==========================================

function atualizarKPIs(dados) {

    atualizarElemento(
        "jogosHoje",
        dados.jogosHoje ?? 0
    );

    atualizarElemento(
        "campeonatos",
        dados.campeonatos ?? 0
    );

    atualizarElemento(
        "analisesIA",
        dados.analisesIA ?? 0
    );

    atualizarElemento(
        "valueBets",
        dados.valueBets ?? 0
    );

    atualizarElemento(
        "roiPrevisto",
        (dados.roi ?? 0) + "%"
    );

    atualizarElemento(
        "precisaoIA",
        (dados.precisao ?? 100) + "%"
    );

    atualizarElemento(
        "nomeSistema",
        dados.sistema ?? "BetVision AI"
    );

    atualizarElemento(
        "statusSistema",
        dados.status ?? "Operacional"
    );

    atualizarElemento(
        "modeloIA",
        dados.modelo ?? "-"
    );

    atualizarElemento(
        "modeloRodape",
        dados.modelo ?? "-"
    );

    if (dados.ultimaAtualizacao) {

        const data = new Date(
            dados.ultimaAtualizacao
        );

        atualizarElemento(
            "ultimaAtualizacao",
            data.toLocaleString("pt-BR")
        );

        atualizarElemento(
            "ultimaAtualizacaoCompleta",
            data.toLocaleString("pt-BR")
        );

    }

}

// ==========================================
// STATUS SERVIDOR
// ==========================================

async function verificarServidor() {

    try {

        const resposta =
            await fetch(API.ping);

        if (!resposta.ok) {

            throw new Error();

        }

        atualizarElemento(
            "apiStatus",
            "Online"
        );

        atualizarElemento(
            "dbStatus",
            "Conectado"
        );

        atualizarElemento(
            "modeloStatus",
            "Ativo"
        );

    }

    catch {

        atualizarElemento(
            "apiStatus",
            "Offline"
        );

        atualizarElemento(
            "dbStatus",
            "--"
        );

        atualizarElemento(
            "modeloStatus",
            "--"
        );

    }

}
// ==========================================
// CAMPEONATOS
// ==========================================

async function carregarCampeonatos() {

    try {

        const resposta = await fetch(API.campeonatos);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar campeonatos");
        }

        const dados = await resposta.json();

        adicionarLog(
            `${dados.total} campeonatos carregados.`
        );

    } catch (erro) {

        console.error(erro);

        adicionarLog(
            "Erro carregando campeonatos."
        );

    }

}

// ==========================================
// JOGOS DO DIA
// ==========================================

async function carregarJogos() {

    try {

        const resposta = await fetch(API.jogos);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar jogos");
        }

        const dados = await resposta.json();

        renderizarJogos(
            dados.jogos ?? dados
        );

    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "listaJogos",
            "Erro ao carregar jogos."
        );

    }

}

// ==========================================
// RENDERIZA JOGOS
// ==========================================

function renderizarJogos(jogos) {

    const lista =
        document.getElementById("listaJogos");

    if (!lista) return;

    if (!jogos || jogos.length === 0) {

        lista.innerHTML = `

            <div class="loading">

                Nenhum jogo disponível.

            </div>

        `;

        return;

    }

    lista.innerHTML =
        jogos.map(jogo => {

            return `

            <div class="card">

                <h3>

                    ${jogo.time_casa}
                    ×
                    ${jogo.time_fora}

                </h3>

                <p>

                    <strong>Campeonato:</strong>

                    ${jogo.campeonato ?? "-"}

                </p>

                <p>

                    <strong>Data:</strong>

                    ${formatarData(jogo.data_jogo)}

                </p>

                <p>

                    <strong>Status:</strong>

                    ${jogo.status ?? "Agendado"}

                </p>

            </div>

            `;

        }).join("");

}

// ==========================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==========================================

setInterval(async () => {

    try {

        await carregarDashboard();

        await carregarJogos();

    } catch (erro) {

        console.error(erro);

    }

}, 30000);

// ==========================================
// PRIMEIRO CARREGAMENTO
// ==========================================

(async () => {

    await carregarCampeonatos();

    await carregarJogos();

})();
