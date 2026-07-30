// ==========================================
// BetVision AI - Frontend
// public/app.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    carregarDashboard();
    carregarCampeonatos();
    carregarValueBets();
    conectarWebSocket();

});

// ==========================================
// DASHBOARD
// ==========================================

async function carregarDashboard() {

    try {

        const resposta = await fetch("/api/dashboard");

        if (!resposta.ok) {
            throw new Error("Dashboard indisponível");
        }

        const dados = await resposta.json();

        atualizarKPIs(dados);

    } catch (erro) {

        console.error("Erro dashboard:", erro);

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
        (dados.precisao ?? 0) + "%"
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

        const data = new Date(dados.ultimaAtualizacao);

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
// CAMPEONATOS
// ==========================================

async function carregarCampeonatos() {

    try {

        const resposta = await fetch("/api/campeonatos");

        if (!resposta.ok) {
            throw new Error();
        }

        const dados = await resposta.json();

        mostrarMensagem(
            "listaAnalises",
            `Base carregada com ${dados.total} campeonatos.`
        );

    } catch {

        mostrarMensagem(
            "listaAnalises",
            "Erro carregando campeonatos."
        );

    }

}

// ==========================================
// VALUE BETS
// ==========================================

async function carregarValueBets() {

    try {

        const resposta = await fetch("/api/valuebets");

        if (!resposta.ok) {

            mostrarMensagem(
                "listaValueBets",
                "Nenhuma oportunidade encontrada."
            );

            return;

        }

        const dados = await resposta.json();

        mostrarMensagem(
            "listaValueBets",
            `${dados.length ?? 0} oportunidades encontradas.`
        );

    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "listaValueBets",
            "Erro carregando Value Bets."
        );

    }

}

// ==========================================
// WEBSOCKET
// ==========================================

let socket;

function conectarWebSocket() {

    const protocolo =
        location.protocol === "https:"
            ? "wss"
            : "ws";

    socket = new WebSocket(
        `${protocolo}://${location.host}`
    );

    socket.onopen = () => {

        console.log(
            "BetVision AI WebSocket conectado"
        );

        atualizarElemento(
            "wsStatus",
            "Conectado"
        );

    };

    socket.onmessage = (evento) => {

        try {

            const dados = JSON.parse(evento.data);

            console.log(
                "Atualização IA:",
                dados
            );

            if (dados.dashboard) {

                atualizarKPIs({

                    ...dados.dashboard,

                    sistema: "BetVision AI",

                    status: "Operacional",

                    modelo: "Probabilidade + Estatística",

                    ultimaAtualizacao:
                        new Date().toISOString()

                });

            }

            if (dados.tipo === "valuebet") {

                carregarValueBets();

            }

        } catch (erro) {

            console.error(
                "Mensagem inválida:",
                erro
            );

        }

    };

    socket.onerror = () => {

        atualizarElemento(
            "wsStatus",
            "Erro"
        );

    };

    socket.onclose = () => {

        atualizarElemento(
            "wsStatus",
            "Reconectando..."
        );

        setTimeout(
            conectarWebSocket,
            5000
        );

    };

}

// ==========================================
// UTILITÁRIOS
// ==========================================

function atualizarElemento(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.textContent = valor;

    }

}

function mostrarMensagem(id, texto) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.innerHTML = texto;

    }

}
