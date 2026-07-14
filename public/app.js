// ==========================================
// BetVision AI - Frontend
// public/app.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    carregarDashboard();
    conectarWebSocket();
});

// ==========================================
// DASHBOARD
// ==========================================

async function carregarDashboard() {

    try {

        const resposta = await fetch("/api/dashboard");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar dashboard");
        }

        const dados = await resposta.json();

        atualizarKPIs(dados);

        carregarCampeonatos();

    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "oportunidades",
            "Erro ao conectar ao servidor."
        );

    }

}

// ==========================================
// KPIs
// ==========================================

function atualizarKPIs(dados) {

    atualizarElemento("jogosHoje", dados.jogosHoje);
    atualizarElemento("valueBets", dados.valueBets);
    atualizarElemento("analisesIA", dados.analisesIA);

    const roi = document.getElementById("roiPrevisto");
    if (roi) roi.textContent = "0%";

    const precisao = document.getElementById("precisaoIA");
    if (precisao) precisao.textContent = "100%";

}

// ==========================================
// CAMPEONATOS
// ==========================================

async function carregarCampeonatos() {

    try {

        const resposta = await fetch("/api/campeonatos");

        const dados = await resposta.json();

        mostrarMensagem(
            "analises",
            `Base carregada com ${dados.total} campeonatos.`
        );

    } catch (erro) {

        console.error(erro);

    }

}

// ==========================================
// WEBSOCKET
// ==========================================

function conectarWebSocket() {

    const protocolo =
        location.protocol === "https:" ? "wss" : "ws";

    const socket =
        new WebSocket(`${protocolo}://${location.host}`);

    socket.onopen = () => {

        console.log("WebSocket conectado");

    };

    socket.onmessage = (evento) => {

        const dados = JSON.parse(evento.data);

        console.log(dados);

    };

    socket.onclose = () => {

        console.log("Reconectando...");

        setTimeout(conectarWebSocket, 5000);

    };

}

// ==========================================
// UTILITÁRIOS
// ==========================================

function atualizarElemento(id, valor) {

    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }

}

function mostrarMensagem(id, texto) {

    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerHTML = texto;
    }

}
