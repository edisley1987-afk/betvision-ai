// ==========================================
// BetVision AI
// Frontend v5.0
// public/app.js
// PARTE 1A
// ==========================================

"use strict";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const CONFIG = {

    api: "",

    refreshDashboard: 30000,

    websocketReconnect: 5000

};

// ==========================================
// ESTADO GLOBAL
// ==========================================

const estado = {

    dashboard: {},

    jogos: [],

    analises: [],

    valueBets: [],

    campeonatos: [],

    websocket: null,

    conectado: false

};

// ==========================================
// API
// ==========================================

async function api(url, options = {}) {

    try {

        const resposta = await fetch(

            CONFIG.api + url,

            {

                headers: {

                    "Content-Type": "application/json"

                },

                ...options

            }

        );

        if (!resposta.ok) {

            throw new Error(`HTTP ${resposta.status}`);

        }

        return await resposta.json();

    }

    catch (erro) {

        console.error("Erro API:", url, erro);

        return null;

    }

}

// ==========================================
// UTILIDADES
// ==========================================

function $(id) {

    return document.getElementById(id);

}

function atualizarTexto(id, valor) {

    const elemento = $(id);

    if (elemento) {

        elemento.textContent = valor;

    }

}

function formatarData(data) {

    if (!data) return "-";

    return new Date(data).toLocaleString("pt-BR");

}

function formatarHora(data) {

    if (!data) return "-";

    return new Date(data).toLocaleTimeString("pt-BR", {

        hour: "2-digit",

        minute: "2-digit"

    });

}

// ==========================================
// STATUS
// ==========================================

function atualizarStatus(status) {

    const elemento = $("statusSistema");

    if (!elemento) return;

    if (status === "operacional") {

        elemento.className = "status online";

        elemento.innerHTML = "🟢 Sistema conectado";

    } else {

        elemento.className = "status offline";

        elemento.innerHTML = "🔴 Sistema offline";

    }

}

// ==========================================
// DASHBOARD
// ==========================================

async function carregarDashboard() {

    const dados = await api("/api/dashboard");

    if (!dados) return;

    estado.dashboard = dados;

    renderDashboard();

}

function renderDashboard() {

    const d = estado.dashboard;

    atualizarTexto("jogosHoje", d.jogosHoje ?? 0);

    atualizarTexto("campeonatos", d.campeonatos ?? 0);

    atualizarTexto("analisesIA", d.analisesIA ?? 0);

    atualizarTexto("valueBets", d.valueBets ?? 0);

    atualizarTexto("roiPrevisto", `${d.roi ?? 0}%`);

    atualizarTexto("precisaoIA", `${d.precisao ?? 0}%`);

    atualizarTexto("nomeSistema", d.sistema ?? "BetVision AI");

    atualizarTexto("modeloIA", d.modelo ?? "-");

    atualizarTexto("modeloRodape", d.modelo ?? "-");

    atualizarTexto(

        "ultimaAtualizacao",

        formatarData(d.ultimaAtualizacao)

    );

    atualizarTexto(

        "ultimaAtualizacaoCompleta",

        formatarData(d.ultimaAtualizacao)

    );

    atualizarStatus(d.status);

}

// ==========================================
// PLACEHOLDERS
// (serão implementados nas próximas partes)
// ==========================================

async function carregarJogos() {}

async function carregarAnalises() {}

async function carregarValueBets() {}

async function carregarCampeonatos() {}

function conectarWebSocket() {}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarSistema() {

    console.log("🚀 BetVision AI iniciado");

    await carregarDashboard();

    await carregarJogos();

    await carregarAnalises();

    await carregarValueBets();

    conectarWebSocket();

    setInterval(async () => {

        await carregarDashboard();

        await carregarJogos();

        await carregarAnalises();

        await carregarValueBets();

    }, CONFIG.refreshDashboard);

}

document.addEventListener(

    "DOMContentLoaded",

    iniciarSistema

);

console.log("✅ app.js Parte 1A carregada");
// ==========================================
// BetVision AI
// Frontend v5.0
// PARTE 1B
// Jogos
// ==========================================

// ==========================================
// CARREGAR JOGOS
// ==========================================

async function carregarJogos() {

    try {

        const resposta = await api("/api/jogos");

        if (!resposta) {

            estado.jogos = [];

            renderJogos();

            return;

        }

        estado.jogos = Array.isArray(resposta)
            ? resposta
            : (resposta.jogos || []);

        renderJogos();

    } catch (erro) {

        console.error("Erro ao carregar jogos:", erro);

        estado.jogos = [];

        renderJogos();

    }

}

// ==========================================
// RENDER JOGOS
// ==========================================

function renderJogos() {

    const lista = $("listaJogos");

    if (!lista) return;

    lista.innerHTML = "";

    if (estado.jogos.length === 0) {

        lista.innerHTML = `

        <div class="empty-state">

            Nenhum jogo encontrado.

        </div>

        `;

        return;

    }

    estado.jogos.forEach(jogo => {

        lista.appendChild(criarCardJogo(jogo));

    });

}

// ==========================================
// CARD DO JOGO
// ==========================================

function criarCardJogo(jogo) {

    const card = document.createElement("div");

    card.className = "jogo-card";

    card.innerHTML = `

<div class="jogo-topo">

    <span class="liga">

        🏆 ${jogo.campeonato || "-"}

    </span>

    <span class="pais">

        🌎 ${jogo.pais || "-"}

    </span>

</div>

<div class="jogo-times">

    <div class="time">

        ${jogo.escudos?.casa
            ? `<img class="escudo" src="${jogo.escudos.casa}" alt="">`
            : ""}

        <strong>${jogo.casa}</strong>

    </div>

    <div class="versus">

        X

    </div>

    <div class="time">

        ${jogo.escudos?.fora
            ? `<img class="escudo" src="${jogo.escudos.fora}" alt="">`
            : ""}

        <strong>${jogo.fora}</strong>

    </div>

</div>

<div class="jogo-info">

    📅 ${formatarData(jogo.horario)}

</div>

<div class="jogo-info">

    🕒 ${formatarHora(jogo.horario)}

</div>

<div class="jogo-info">

    📍 ${jogo.estadio || "-"}

</div>

<div class="jogo-info">

    🥇 Rodada ${jogo.rodada ?? "-"}

</div>

<div class="status-linha">

    ${statusHTML(jogo.status)}

</div>

<div class="acoes-jogo">

    <button class="btnIA"

        data-id="${jogo.id}">

        🤖 IA

    </button>

    <button class="btnOdds"

        data-id="${jogo.id}">

        💰 Odds

    </button>

    <button class="btnStats"

        data-id="${jogo.id}">

        📊 Estatísticas

    </button>

</div>

`;

    return card;

}

// ==========================================
// STATUS
// ==========================================

function statusHTML(status) {

    switch (status) {

        case "LIVE":

            return `<span class="status live">🟢 AO VIVO</span>`;

        case "FINISHED":

            return `<span class="status finished">⚪ ENCERRADO</span>`;

        case "PAUSED":

            return `<span class="status paused">🟡 INTERVALO</span>`;

        case "POSTPONED":

            return `<span class="status postponed">🔴 ADIADO</span>`;

        default:

            return `<span class="status scheduled">🔵 AGENDADO</span>`;

    }

}

// ==========================================
// EVENTOS DOS BOTÕES
// ==========================================

document.addEventListener("click", e => {

    const btnIA = e.target.closest(".btnIA");

    if (btnIA) {

        abrirModalIA(btnIA.dataset.id);

        return;

    }

    const btnOdds = e.target.closest(".btnOdds");

    if (btnOdds) {

        abrirOdds(btnOdds.dataset.id);

        return;

    }

    const btnStats = e.target.closest(".btnStats");

    if (btnStats) {

        abrirEstatisticas(btnStats.dataset.id);

    }

});

// ==========================================
// PLACEHOLDERS
// ==========================================

function abrirModalIA(id) {

    console.log("Abrir IA:", id);

}

function abrirOdds(id) {

    console.log("Abrir Odds:", id);

}

function abrirEstatisticas(id) {

    console.log("Abrir Estatísticas:", id);

}

console.log("✅ Parte 1B carregada");
// ==========================================
// BetVision AI
// Frontend v5.0
// public/app.js
// PARTE 2A
// Análises IA
// ==========================================

// ==========================================
// CARREGAR ANÁLISES IA
// ==========================================

async function carregarAnalises() {

    try {

        const resposta = await api("/api/analises");

        if (!resposta) {

            estado.analises = [];

            renderAnalises();

            return;

        }

        estado.analises = Array.isArray(resposta)
            ? resposta
            : (resposta.analises || []);

        renderAnalises();

    }

    catch (erro) {

        console.error("Erro ao carregar análises:", erro);

        estado.analises = [];

        renderAnalises();

    }

}

// ==========================================
// RENDER ANÁLISES
// ==========================================

function renderAnalises() {

    const lista = $("listaAnalises");

    if (!lista) return;

    lista.innerHTML = "";

    if (estado.analises.length === 0) {

        lista.innerHTML = `

        <div class="empty-state">

            Nenhuma análise disponível.

        </div>

        `;

        return;

    }

    estado.analises.forEach(analise => {

        lista.appendChild(

            criarCardAnalise(analise)

        );

    });

}

// ==========================================
// CARD ANÁLISE
// ==========================================

function criarCardAnalise(analise) {

    const card = document.createElement("div");

    card.className = "analise-card";

    card.innerHTML = `

<div class="analise-topo">

    <h3>

        🤖 ${analise.jogo}

    </h3>

</div>

<div class="analise-linha">

    <strong>Casa</strong>

    <span>

        ${analise.probabilidade_casa}%

    </span>

</div>

<div class="analise-linha">

    <strong>Empate</strong>

    <span>

        ${analise.probabilidade_empate}%

    </span>

</div>

<div class="analise-linha">

    <strong>Fora</strong>

    <span>

        ${analise.probabilidade_fora}%

    </span>

</div>

<div class="analise-linha">

    <strong>Gols Esperados</strong>

    <span>

        ${analise.gols_esperados}

    </span>

</div>

<div class="analise-linha">

    <strong>Placar Previsto</strong>

    <span>

        ${analise.placar_previsto}

    </span>

</div>

<div class="analise-linha">

    <strong>Confiança</strong>

    <span>

        ${analise.confianca}

    </span>

</div>

<div class="analise-linha">

    <strong>Modelo</strong>

    <span>

        ${analise.algoritmo}

    </span>

</div>

<div class="analise-linha">

    <strong>Value Bet</strong>

    <span class="${analise.value_bet ? "verde" : "cinza"}">

        ${analise.value_bet ? "SIM" : "NÃO"}

    </span>

</div>

<div class="analise-rodape">

    ${formatarData(analise.criado_em)}

</div>

`;

    return card;

}

console.log("✅ Parte 2A carregada");
// ==========================================
// BetVision AI
// Frontend v5.0
// public/app.js
// PARTE 2B
// Value Bets
// ==========================================

// ==========================================
// CARREGAR VALUE BETS
// ==========================================

async function carregarValueBets() {

    try {

        const resposta = await api("/api/valuebets");

        if (!resposta) {

            estado.valueBets = [];

            renderValueBets();

            return;

        }

        estado.valueBets = Array.isArray(resposta)
            ? resposta
            : (resposta.valuebets || []);

        renderValueBets();

    }

    catch (erro) {

        console.error("Erro ao carregar Value Bets:", erro);

        estado.valueBets = [];

        renderValueBets();

    }

}

// ==========================================
// RENDER VALUE BETS
// ==========================================

function renderValueBets() {

    const lista = $("listaValueBets");

    if (!lista) return;

    lista.innerHTML = "";

    if (estado.valueBets.length === 0) {

        lista.innerHTML = `

        <div class="empty-state">

            Nenhuma oportunidade encontrada.

        </div>

        `;

        return;

    }

    estado.valueBets.forEach(valueBet => {

        lista.appendChild(

            criarCardValueBet(valueBet)

        );

    });

}

// ==========================================
// CARD VALUE BET
// ==========================================

function criarCardValueBet(v) {

    const card = document.createElement("div");

    card.className = "valuebet-card";

    const percentual = Number(v.valor_percentual || 0);

    let classe = "baixo";

    if (percentual >= 25) {

        classe = "alto";

    }

    else if (percentual >= 15) {

        classe = "medio";

    }

    card.innerHTML = `

<div class="valuebet-topo">

    <h3>

        💎 ${v.jogo}

    </h3>

</div>

<div class="valuebet-linha">

    <strong>Mercado</strong>

    <span>

        ${v.mercado}

    </span>

</div>

<div class="valuebet-linha">

    <strong>Odd Mercado</strong>

    <span>

        ${v.odd_mercado}

    </span>

</div>

<div class="valuebet-linha">

    <strong>Odd Justa</strong>

    <span>

        ${v.odd_justa}

    </span>

</div>

<div class="valuebet-linha">

    <strong>Valor</strong>

    <span class="${classe}">

        +${percentual}%

    </span>

</div>

<div class="valuebet-linha">

    <strong>Confiança</strong>

    <span>

        ${v.confianca}

    </span>

</div>

<div class="valuebet-rodape">

    ${formatarData(v.criado_em)}

</div>

`;

    return card;

}

// ==========================================
// ATUALIZA DASHBOARD IA
// ==========================================

async function atualizarIA() {

    await Promise.all([

        carregarAnalises(),

        carregarValueBets()

    ]);

}

// ==========================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==========================================

setInterval(() => {

    atualizarIA();

}, 60000);

console.log("✅ Parte 2B carregada");
// ==========================================
// BetVision AI
// Frontend v5.0
// public/app.js
// PARTE 3A
// WebSocket + Atualização em Tempo Real
// ==========================================

// ==========================================
// CONECTAR WEBSOCKET
// ==========================================

function conectarWebSocket() {

    const protocolo =

        window.location.protocol === "https:"
            ? "wss://"
            : "ws://";

    const url = protocolo + window.location.host;

    console.log("🔌 Conectando WebSocket...");

    estado.websocket = new WebSocket(url);

    estado.websocket.onopen = () => {

        console.log("✅ WebSocket conectado");

        estado.conectado = true;

        atualizarStatus("operacional");

    };

    estado.websocket.onmessage = (evento) => {

        try {

            const dados = JSON.parse(evento.data);

            processarMensagemWS(dados);

        }

        catch (erro) {

            console.error(

                "Mensagem WS inválida",

                erro

            );

        }

    };

    estado.websocket.onerror = (erro) => {

        console.error(

            "Erro WebSocket",

            erro

        );

    };

    estado.websocket.onclose = () => {

        console.warn(

            "WebSocket desconectado"

        );

        estado.conectado = false;

        atualizarStatus("offline");

        setTimeout(

            conectarWebSocket,

            CONFIG.websocketReconnect

        );

    };

}

// ==========================================
// PROCESSAR EVENTOS
// ==========================================

function processarMensagemWS(msg) {

    if (!msg) return;

    console.log("📨 WS:", msg);

    switch (msg.tipo) {

        case "dashboard":

            estado.dashboard = msg.dados || msg;

            renderDashboard();

            break;

        case "jogo":

            atualizarJogo(msg.jogo);

            break;

        case "analise":

            estado.analises.unshift(msg.analise);

            renderAnalises();

            break;

        case "valuebet":

            estado.valueBets.unshift(msg.valuebet);

            renderValueBets();

            break;

        case "refresh":

            atualizarTudo();

            break;

        default:

            console.log(

                "Evento WS:",

                msg.tipo

            );

    }

}

// ==========================================
// ATUALIZA JOGO
// ==========================================

function atualizarJogo(jogo) {

    const indice = estado.jogos.findIndex(

        j => j.id === jogo.id

    );

    if (indice >= 0) {

        estado.jogos[indice] = {

            ...estado.jogos[indice],

            ...jogo

        };

    }

    else {

        estado.jogos.push(jogo);

    }

    renderJogos();

}

// ==========================================
// ATUALIZAÇÃO COMPLETA
// ==========================================

async function atualizarTudo() {

    await Promise.all([

        carregarDashboard(),

        carregarJogos(),

        carregarAnalises(),

        carregarValueBets()

    ]);

}


}, CONFIG.refreshDashboard);

console.log("✅ Parte 3A carregada");
// ==========================================
// BetVision AI
// Frontend v5.0
// public/app.js
// PARTE 3B
// Modal IA + Eventos + Filtros
// ==========================================

// ==========================================
// EVENTOS DOS BOTÕES
// ==========================================

document.addEventListener("click", (e) => {

    const btnIA = e.target.closest(".btnIA");

    if (btnIA) {

        abrirModalIA(btnIA.dataset.id);

        return;

    }

    const btnOdds = e.target.closest(".btnOdds");

    if (btnOdds) {

        abrirOdds(btnOdds.dataset.id);

        return;

    }

    const btnStats = e.target.closest(".btnStats");

    if (btnStats) {

        abrirEstatisticas(btnStats.dataset.id);

        return;

    }

});

// ==========================================
// MODAL IA
// ==========================================

function abrirModalIA(id) {

    const jogo = estado.jogos.find(

        j => String(j.id) === String(id)

    );

    if (!jogo) return;

    const modal = $("modalIA");

    const conteudo = $("conteudoModal");

    if (!modal || !conteudo) return;

    const analise = estado.analises.find(

        a => a.jogo === `${jogo.casa} x ${jogo.fora}`

    );

    conteudo.innerHTML = `

<h2>

${jogo.casa}

<span style="color:#00bfff;">x</span>

${jogo.fora}

</h2>

<hr>

<p>

🏆 <strong>Campeonato:</strong>

${jogo.campeonato || "-"}

</p>

<p>

🌍 <strong>País:</strong>

${jogo.pais || "-"}

</p>

<p>

📅 <strong>Data:</strong>

${formatarData(jogo.horario)}

</p>

<p>

🕒 <strong>Hora:</strong>

${formatarHora(jogo.horario)}

</p>

<p>

📍 <strong>Estádio:</strong>

${jogo.estadio || "-"}

</p>

<p>

🥇 <strong>Rodada:</strong>

${jogo.rodada ?? "-"}

</p>

<hr>

<h3>

🤖 Inteligência Artificial

</h3>

${
analise
?

`

<p>

🏠 Vitória Casa:

<strong>

${analise.probabilidade_casa}%

</strong>

</p>

<p>

🤝 Empate:

<strong>

${analise.probabilidade_empate}%

</strong>

</p>

<p>

✈️ Vitória Visitante:

<strong>

${analise.probabilidade_fora}%

</strong>

</p>

<p>

⚽ Gols Esperados:

<strong>

${analise.gols_esperados}

</strong>

</p>

<p>

🎯 Placar Previsto:

<strong>

${analise.placar_previsto}

</strong>

</p>

<p>

💎 Value Bet:

<strong>

${analise.value_bet ? "SIM" : "NÃO"}

</strong>

</p>

<p>

📈 Confiança:

<strong>

${analise.confianca}

</strong>

</p>

`

:

`

<p>

Nenhuma análise disponível para este jogo.

</p>

`

}

`;

    modal.classList.add("ativo");

}

// ==========================================
// FECHAR MODAL
// ==========================================

$("fecharModal")?.addEventListener(

    "click",

    () => {

        $("modalIA")?.classList.remove("ativo");

    }

);

window.addEventListener("click", (e) => {

    if (e.target === $("modalIA")) {

        $("modalIA").classList.remove("ativo");

    }

});

// ==========================================
// ODDS
// ==========================================

function abrirOdds(id) {

    console.log("Odds:", id);

    alert(

        "Módulo de Odds será implementado na próxima versão."

    );

}

// ==========================================
// ESTATÍSTICAS
// ==========================================

function abrirEstatisticas(id) {

    console.log("Estatísticas:", id);

    alert(

        "Módulo de Estatísticas será implementado na próxima versão."

    );

}

// ==========================================
// FILTRO DE JOGOS
// ==========================================

function filtrarJogos(texto) {

    texto = texto.toLowerCase();

    const lista = estado.jogos.filter(j => {

        return (

            (j.campeonato || "")

                .toLowerCase()

                .includes(texto)

            ||

            (j.casa || "")

                .toLowerCase()

                .includes(texto)

            ||

            (j.fora || "")

                .toLowerCase()

                .includes(texto)

        );

    });

    const backup = estado.jogos;

    estado.jogos = lista;

    renderJogos();

    estado.jogos = backup;

}

// ==========================================
// ORDENAR JOGOS
// ==========================================

function ordenarJogos() {

    estado.jogos.sort(

        (a, b) =>

            new Date(a.horario)

            -

            new Date(b.horario)

    );

    renderJogos();

}

// ==========================================
// EXPORTAÇÃO
// ==========================================

window.BetVision = {

    carregarDashboard,

    carregarJogos,

    carregarAnalises,

    carregarValueBets,

    atualizarTudo,

    conectarWebSocket,

    abrirModalIA,

    filtrarJogos,

    ordenarJogos,

    estado

};

console.log("✅ Parte 3B carregada");
// ==========================================
// BetVision AI
// Frontend v5.0
// public/app.js
// PARTE 4
// Finalização do Sistema
// ==========================================

// ==========================================
// LOADER
// ==========================================

function mostrarLoader() {

    const loader = $("loader");

    if (loader) {

        loader.classList.remove("oculto");

    }

}

function esconderLoader() {

    const loader = $("loader");

    if (loader) {

        loader.classList.add("oculto");

    }

}

// ==========================================
// LOGS
// ==========================================

function adicionarLog(texto) {

    const area = $("logsSistema");

    if (!area) return;

    const linha = document.createElement("div");

    linha.className = "log-item";

    linha.innerHTML = `

        <span class="hora">

            ${new Date().toLocaleTimeString("pt-BR")}

        </span>

        <span>

            ${texto}

        </span>

    `;

    area.prepend(linha);

    while (area.children.length > 100) {

        area.removeChild(area.lastChild);

    }

}

// ==========================================
// NOTIFICAÇÕES
// ==========================================

function notificar(mensagem, tipo = "info") {

    const area = $("notificacoes");

    if (!area) {

        console.log(mensagem);

        return;

    }

    const div = document.createElement("div");

    div.className = `notificacao ${tipo}`;

    div.textContent = mensagem;

    area.appendChild(div);

    setTimeout(() => {

        div.remove();

    }, 4000);

}

// ==========================================
// MONITORAMENTO DA CONEXÃO
// ==========================================

window.addEventListener("online", () => {

    notificar("Conexão restabelecida", "sucesso");

    atualizarTudo();

});

window.addEventListener("offline", () => {

    notificar("Sem conexão com a internet", "erro");

});

// ==========================================
// TRATAMENTO GLOBAL DE ERROS
// ==========================================

window.addEventListener("error", (evento) => {

    console.error(evento.error);

    adicionarLog("Erro: " + evento.message);

});

window.addEventListener("unhandledrejection", (evento) => {

    console.error(evento.reason);

    adicionarLog("Promise rejeitada");

});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarSistema() {

    try {

        mostrarLoader();

        adicionarLog("Inicializando BetVision AI...");

        await atualizarTudo();

        conectarWebSocket();

        esconderLoader();

        adicionarLog("Sistema iniciado com sucesso.");

        notificar("BetVision AI conectado", "sucesso");

    }

    catch (erro) {

        esconderLoader();

        console.error(erro);

        adicionarLog("Falha na inicialização.");

        notificar("Erro ao iniciar o sistema", "erro");

    }

}

// ==========================================
// ATUALIZAÇÃO MANUAL
// ==========================================

$("btnAtualizar")?.addEventListener(

    "click",

    async () => {

        mostrarLoader();

        await atualizarTudo();

        esconderLoader();

        adicionarLog("Atualização manual concluída.");

    }

);

// ==========================================
// ATALHOS GLOBAIS
// ==========================================

window.BetVisionAI = {

    estado,

    atualizarTudo,

    carregarDashboard,

    carregarJogos,

    carregarAnalises,

    carregarValueBets,

    conectarWebSocket,

    abrirModalIA,

    filtrarJogos,

    ordenarJogos

};
    }

);

console.log("🚀 BetVision AI Frontend v5 carregado com sucesso.");
