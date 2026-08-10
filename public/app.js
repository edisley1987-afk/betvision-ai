// ==================================================
// BETVISION AI
// public/app.js
// Versão 7.0
// Frontend Dashboard Inteligente
// API REAL DE ANÁLISES
// PostgreSQL / NeonDB
// ==================================================

"use strict";


// ==================================================
// CONFIGURAÇÃO
// ==================================================

const CONFIG = {

    API_URL:
        window.location.origin,

    WS_URL:
        window.location.protocol === "https:"
            ? `wss://${window.location.host}`
            : `ws://${window.location.host}`,

    INTERVALO_ATUALIZACAO:
        15000,

    INTERVALO_PING:
        30000,

    INTERVALO_WEBSOCKET:
        5000,

    LIMITE_ANALISES:
        20,

    LIMITE_JOGOS:
        100

};


// ==================================================
// ESTADO GLOBAL
// ==================================================

const estado = {

    websocket:
        null,

    conectado:
        false,

    websocketReconectando:
        false,

    ultimaAtualizacao:
        null,

    carregandoAnalises:
        false,

    carregandoJogos:
        false,

    carregandoValueBets:
        false,

    dados: {

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
            0

    },

    analises:
        [],

    jogos:
        [],

    valueBets:
        [],

    campeonatos:
        []

};


// ==================================================
// INICIALIZAÇÃO
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🤖 BetVision AI iniciado"
        );

        iniciarSistema();

    }
);


// ==================================================
// INICIAR SISTEMA
// ==================================================

function iniciarSistema() {

    console.log(
        "🚀 Inicializando sistema..."
    );

    carregarDashboard();

    carregarJogos();

    carregarCampeonatos();

    carregarValueBets();

    carregarAnalisesIA();

    conectarWebSocket();

    verificarServidor();

    iniciarAtualizacaoAutomatica();

    inicializarInterface();

}


// ==================================================
// INICIALIZAR INTERFACE
// ==================================================

function inicializarInterface() {

    const botaoAtualizar =
        document.getElementById(
            "btnAtualizar"
        );

    if (botaoAtualizar) {

        botaoAtualizar.addEventListener(
            "click",
            async () => {

                botaoAtualizar.disabled =
                    true;

                botaoAtualizar.textContent =
                    "🔄 Atualizando...";

                try {

                    await atualizarTudo();

                }

                finally {

                    botaoAtualizar.disabled =
                        false;

                    botaoAtualizar.textContent =
                        "🔄 Atualizar";

                }

            }
        );

    }


    const fecharModal =
        document.getElementById(
            "fecharModal"
        );

    if (fecharModal) {

        fecharModal.addEventListener(
            "click",
            fecharModalIA
        );

    }


    const modal =
        document.getElementById(
            "modalIA"
        );

    if (modal) {

        modal.addEventListener(
            "click",
            evento => {

                if (
                    evento.target ===
                    modal
                ) {

                    fecharModalIA();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Escape"
            ) {

                fecharModalIA();

            }

        }
    );

}


// ==================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==================================================

function iniciarAtualizacaoAutomatica() {

    setInterval(
        () => {

            console.log(
                "🔄 Atualização automática..."
            );

            carregarDashboard();

            carregarJogos();

            carregarValueBets();

            carregarAnalisesIA();

        },
        CONFIG.INTERVALO_ATUALIZACAO
    );

}


// ==================================================
// DASHBOARD
// ==================================================

async function carregarDashboard() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/dashboard`,
                {
                    cache:
                        "no-store"
                }
            );

        if (!resposta.ok) {

            throw new Error(
                `Falha dashboard HTTP ${resposta.status}`
            );

        }

        const dados =
            await resposta.json();

        console.log(
            "📊 Dashboard:",
            dados
        );

        atualizarDashboard(
            dados
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro dashboard:",
            erro
        );

        atualizarStatus(
            false
        );

    }

}


// ==================================================
// ATUALIZAR DASHBOARD
// ==================================================

function atualizarDashboard(
    dados
) {

    if (
        !dados ||
        typeof dados !==
        "object"
    ) {

        return;

    }


    estado.dados = {

        ...estado.dados,

        ...dados

    };


    estado.ultimaAtualizacao =
        dados.ultimaAtualizacao
            ? new Date(
                dados.ultimaAtualizacao
            )
            : new Date();


    atualizarElemento(
        "jogosHoje",
        formatarNumero(
            dados.jogosHoje ??
            dados.jogos_hoje ??
            0
        )
    );


    atualizarElemento(
        "campeonatos",
        formatarNumero(
            dados.campeonatos ??
            0
        )
    );


    atualizarElemento(
        "analisesIA",
        formatarNumero(
            dados.analisesIA ??
            dados.analises_ia ??
            0
        )
    );


    atualizarElemento(
        "valueBets",
        formatarNumero(
            dados.valueBets ??
            dados.valuebets ??
            0
        )
    );


    atualizarElemento(
        "roi",
        `${formatarNumeroDecimal(
            dados.roi ??
            0
        )}%`
    );


    atualizarElemento(
        "precisaoIA",
        `${formatarNumeroDecimal(
            dados.precisao ??
            dados.precisaoIA ??
            0
        )}%`
    );


    atualizarElemento(
        "precisao",
        `${formatarNumeroDecimal(
            dados.precisao ??
            dados.precisaoIA ??
            0
        )}%`
    );


    atualizarElemento(
        "precisaoRodape",
        `${formatarNumeroDecimal(
            dados.precisao ??
            dados.precisaoIA ??
            0
        )}%`
    );


    atualizarElemento(
        "nomeSistema",
        dados.sistema ??
        "BetVision AI"
    );


    atualizarElemento(
        "modeloIA",
        dados.modelo ??
        "Prediction Engine v2.0"
    );


    atualizarElemento(
        "modeloStatus",
        dados.modelo ??
        "BetVision Statistical AI"
    );


    atualizarElemento(
        "modeloRodape",
        dados.modelo ??
        "BetVision Statistical AI v2.0"
    );


    atualizarUltimaAtualizacao();


    atualizarUltimaAtualizacaoCompleta();


    atualizarStatus(
        true
    );

}


// ==================================================
// ATUALIZAR ELEMENTO
// ==================================================

function atualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );

    if (!elemento) {

        return;

    }

    elemento.textContent =
        valor ??
        "";

}


// ==================================================
// ÚLTIMA ATUALIZAÇÃO
// ==================================================

function atualizarUltimaAtualizacao() {

    const elemento =
        document.getElementById(
            "ultimaAtualizacao"
        );

    if (
        !elemento ||
        !estado.ultimaAtualizacao
    ) {

        return;

    }

    elemento.textContent =
        formatarData(
            estado.ultimaAtualizacao
        );

}


// ==================================================
// ÚLTIMA ATUALIZAÇÃO COMPLETA
// ==================================================

function atualizarUltimaAtualizacaoCompleta() {

    const elemento =
        document.getElementById(
            "ultimaAtualizacaoCompleta"
        );

    if (
        !elemento ||
        !estado.ultimaAtualizacao
    ) {

        return;

    }

    elemento.textContent =
        formatarData(
            estado.ultimaAtualizacao
        );

}


// ==================================================
// STATUS DO SISTEMA
// ==================================================

function atualizarStatus(
    online
) {

    const elemento =
        document.getElementById(
            "statusSistema"
        );

    const statusServidor =
        document.getElementById(
            "statusServidor"
        );

    const apiStatus =
        document.getElementById(
            "apiStatus"
        );


    if (online) {

        if (elemento) {

            elemento.textContent =
                "🟢 Sistema Online";

            elemento.className =
                "online";

        }


        if (statusServidor) {

            statusServidor.textContent =
                "🟢 Online";

            statusServidor.className =
                "status online";

        }


        if (apiStatus) {

            apiStatus.textContent =
                "Online";

        }

    }

    else {

        if (elemento) {

            elemento.textContent =
                "🔴 Sem conexão";

            elemento.className =
                "offline";

        }


        if (statusServidor) {

            statusServidor.textContent =
                "🔴 Offline";

            statusServidor.className =
                "status offline";

        }


        if (apiStatus) {

            apiStatus.textContent =
                "Offline";

        }

    }

}


// ==================================================
// WEBSOCKET
// ==================================================

function conectarWebSocket() {

    if (
        estado.websocket &&
        (
            estado.websocket.readyState ===
            WebSocket.OPEN ||

            estado.websocket.readyState ===
            WebSocket.CONNECTING
        )
    ) {

        return;

    }


    try {

        console.log(
            "🔌 Conectando WebSocket..."
        );


        estado.websocket =
            new WebSocket(
                CONFIG.WS_URL
            );


        estado.websocket.onopen =
            () => {

                console.log(
                    "🟢 WebSocket conectado"
                );

                estado.conectado =
                    true;

                estado.websocketReconectando =
                    false;


                atualizarElemento(
                    "wsStatus",
                    "Conectado"
                );


                atualizarStatus(
                    true
                );

            };


        estado.websocket.onmessage =
            evento => {

                try {

                    const mensagem =
                        JSON.parse(
                            evento.data
                        );

                    processarMensagemWebSocket(
                        mensagem
                    );

                }

                catch (erro) {

                    console.error(
                        "❌ Erro mensagem WS:",
                        erro
                    );

                }

            };


        estado.websocket.onerror =
            erro => {

                console.error(
                    "❌ Erro WebSocket:",
                    erro
                );

                estado.conectado =
                    false;


                atualizarElemento(
                    "wsStatus",
                    "Erro"
                );

            };


        estado.websocket.onclose =
            () => {

                console.warn(
                    "🔴 WebSocket desconectado"
                );

                estado.conectado =
                    false;

                estado.websocket =
                    null;


                atualizarElemento(
                    "wsStatus",
                    "Desconectado"
                );


                agendarReconexaoWebSocket();

            };

    }

    catch (erro) {

        console.error(
            "❌ Falha WebSocket:",
            erro
        );

        estado.conectado =
            false;

        atualizarElemento(
            "wsStatus",
            "Erro"
        );

        agendarReconexaoWebSocket();

    }

}


// ==================================================
// RECONEXÃO WEBSOCKET
// ==================================================

function agendarReconexaoWebSocket() {

    if (
        estado.websocketReconectando
    ) {

        return;

    }


    estado.websocketReconectando =
        true;


    setTimeout(
        () => {

            estado.websocketReconectando =
                false;

            conectarWebSocket();

        },
        CONFIG.INTERVALO_WEBSOCKET
    );

}


// ==================================================
// PROCESSAR WEBSOCKET
// ==================================================

function processarMensagemWebSocket(
    mensagem
) {

    console.log(
        "📡 Evento recebido:",
        mensagem
    );


    if (
        !mensagem ||
        typeof mensagem !==
        "object"
    ) {

        return;

    }


    if (
        mensagem.tipo ===
        "dashboard"
    ) {

        atualizarDashboard(
            mensagem.dados ??
            mensagem
        );

    }


    if (
        mensagem.tipo ===
        "status"
    ) {

        atualizarStatus(
            mensagem.online ===
            true
        );

    }


    if (
        mensagem.tipo ===
        "valueBet"
    ) {

        adicionarValueBet(
            mensagem.dados ??
            mensagem.valuebet ??
            mensagem
        );

        carregarDashboard();

    }


    if (
        mensagem.tipo ===
        "valuebets"
    ) {

        const lista =
            extrairListaValueBets(
                mensagem
            );

        estado.valueBets =
            lista;

        renderizarValueBets(
            lista
        );

        carregarDashboard();

    }


    if (
        mensagem.tipo ===
        "jogoAtualizado"
    ) {

        carregarDashboard();

        carregarJogos();

        carregarAnalisesIA();

    }


    if (
        mensagem.tipo ===
        "analise" ||
        mensagem.tipo ===
        "analiseIA"
    ) {

        carregarAnalisesIA();

        carregarDashboard();

    }

}


// ==================================================
// ENVIAR WEBSOCKET
// ==================================================

function enviarWebSocket(
    dados
) {

    if (
        estado.websocket &&
        estado.websocket.readyState ===
        WebSocket.OPEN
    ) {

        estado.websocket.send(
            JSON.stringify(
                dados
            )
        );

        return true;

    }

    return false;

}


// ==================================================
// CAMPEONATOS
// ==================================================

async function carregarCampeonatos() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/campeonatos`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro campeonatos HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        const lista =
            extrairLista(
                dados,
                [
                    "campeonatos",
                    "dados",
                    "data",
                    "resultados"
                ]
            );


        estado.campeonatos =
            lista;


        renderizarCampeonatos(
            lista
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro campeonatos:",
            erro
        );

    }

}


// ==================================================
// RENDER CAMPEONATOS
// ==================================================

function renderizarCampeonatos(
    campeonatos
) {

    const area =
        document.getElementById(
            "listaCampeonatos"
        );


    if (!area) {

        return;

    }


    area.innerHTML =
        "";


    if (
        !Array.isArray(campeonatos) ||
        campeonatos.length === 0
    ) {

        area.innerHTML = `
            <div class="empty">
                🏆 Nenhum campeonato disponível
            </div>
        `;

        return;

    }


    campeonatos.forEach(
        campeonato => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "campeonato-card";


            const nome =
                campeonato.nome ??
                campeonato.name ??
                campeonato.nome_campeonato ??
                "Campeonato";


            const pais =
                campeonato.pais ??
                campeonato.country ??
                "";


            div.innerHTML = `
                <strong>
                    ${escaparHTML(
                        nome
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        pais
                    )}
                </span>
            `;


            area.appendChild(
                div
            );

        }
    );

}


// ==================================================
// VALUE BETS
// ==================================================

async function carregarValueBets() {

    if (
        estado.carregandoValueBets
    ) {

        return;

    }


    estado.carregandoValueBets =
        true;


    try {

        console.log(
            "💎 Buscando Value Bets..."
        );


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/valuebets`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro Value Bets HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        const valuebets =
            extrairListaValueBets(
                dados
            );


        estado.valueBets =
            valuebets;


        console.log(
            `💎 ${valuebets.length} Value Bets encontradas`
        );


        renderizarValueBets(
            valuebets
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro Value Bets:",
            erro
        );


        estado.valueBets =
            [];


        renderizarValueBets(
            []
        );

    }

    finally {

        estado.carregandoValueBets =
            false;

    }

}


// ==================================================
// EXTRAIR VALUE BETS
// ==================================================

function extrairListaValueBets(
    dados
) {

    if (
        Array.isArray(dados)
    ) {

        return dados;

    }


    if (
        dados &&
        Array.isArray(
            dados.valuebets
        )
    ) {

        return dados.valuebets;

    }


    if (
        dados &&
        Array.isArray(
            dados.valueBets
        )
    ) {

        return dados.valueBets;

    }


    if (
        dados &&
        Array.isArray(
            dados.dados
        )
    ) {

        return dados.dados;

    }


    if (
        dados &&
        Array.isArray(
            dados.data
        )
    ) {

        return dados.data;

    }


    if (
        dados &&
        Array.isArray(
            dados.resultados
        )
    ) {

        return dados.resultados;

    }


    if (
        dados &&
        dados.valuebet
    ) {

        return [
            dados.valuebet
        ];

    }


    return [];

}


// ==================================================
// RENDER VALUE BETS
// ==================================================

function renderizarValueBets(
    valuebets
) {

    const area =
        document.getElementById(
            "listaValueBets"
        );


    if (!area) {

        return;

    }


    area.innerHTML =
        "";


    if (
        !Array.isArray(valuebets) ||
        valuebets.length === 0
    ) {

        area.innerHTML = `
            <div class="empty">
                💎 Nenhuma Value Bet encontrada
            </div>
        `;

        return;

    }


    valuebets.forEach(
        aposta => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "valuebet-card";


            const jogo =
                aposta.jogo ??
                `${aposta.time_casa ?? "Casa"} x ${aposta.time_fora ?? "Fora"}`;


            const mercado =
                aposta.mercado ??
                "Não informado";


            const odd =
                aposta.odd ??
                aposta.oddMercado ??
                aposta.odd_mercado ??
                0;


            const oddJusta =
                aposta.oddJusta ??
                aposta.odd_justa ??
                aposta.fair_odd ??
                0;


            const probabilidade =
                aposta.probabilidade ??
                aposta.probabilidade_real ??
                0;


            const edge =
                aposta.edge ??
                0;


            const roi =
                aposta.roi ??
                aposta.valor_esperado ??
                0;


            card.innerHTML = `
                <div class="titulo">
                    💎
                    ${escaparHTML(
                        jogo
                    )}
                </div>

                <div>
                    Mercado:
                    <strong>
                        ${escaparHTML(
                            mercado
                        )}
                    </strong>
                </div>

                <div>
                    Odd:
                    <strong>
                        ${formatarOdd(
                            odd
                        )}
                    </strong>
                </div>

                <div>
                    Odd Justa:
                    <strong>
                        ${formatarOdd(
                            oddJusta
                        )}
                    </strong>
                </div>

                <div>
                    Probabilidade:
                    <strong>
                        ${formatarPercentual(
                            probabilidade
                        )}
                    </strong>
                </div>

                <div>
                    Edge:
                    <strong>
                        ${formatarPercentual(
                            edge
                        )}
                    </strong>
                </div>

                <div>
                    ROI:
                    <strong>
                        ${formatarPercentual(
                            roi
                        )}
                    </strong>
                </div>
            `;


            area.appendChild(
                card
            );

        }
    );

}


// ==================================================
// ADICIONAR VALUE BET
// ==================================================

function adicionarValueBet(
    aposta
) {

    if (
        !aposta ||
        typeof aposta !==
        "object"
    ) {

        return;

    }


    const area =
        document.getElementById(
            "listaValueBets"
        );


    if (!area) {

        return;

    }


    const vazio =
        area.querySelector(
            ".empty"
        );


    if (vazio) {

        area.innerHTML =
            "";

    }


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "valuebet-card novo";


    const jogo =
        aposta.jogo ??
        `${aposta.time_casa ?? "Casa"} x ${aposta.time_fora ?? "Fora"}`;


    const odd =
        aposta.odd ??
        aposta.oddMercado ??
        aposta.odd_mercado ??
        0;


    card.innerHTML = `
        <strong>
            🆕 Nova Value Bet
        </strong>

        <br>

        ${escaparHTML(
            jogo
        )}

        <br>

        Mercado:

        ${escaparHTML(
            aposta.mercado ??
            ""
        )}

        <br>

        Odd:

        ${formatarOdd(
            odd
        )}
    `;


    area.prepend(
        card
    );

}


// ==================================================
// JOGOS
// ==================================================

async function carregarJogos() {

    if (
        estado.carregandoJogos
    ) {

        return;

    }


    estado.carregandoJogos =
        true;


    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/jogos`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro jogos HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        let jogos =
            extrairLista(
                dados,
                [
                    "jogos",
                    "dados",
                    "data",
                    "resultados"
                ]
            );


        if (
            jogos.length >
            CONFIG.LIMITE_JOGOS
        ) {

            jogos =
                jogos.slice(
                    0,
                    CONFIG.LIMITE_JOGOS
                );

        }


        estado.jogos =
            jogos;


        renderizarJogos(
            jogos
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro jogos:",
            erro
        );

        renderizarJogos(
            []
        );

    }

    finally {

        estado.carregandoJogos =
            false;

    }

}


// ==================================================
// RENDER JOGOS
// ==================================================

function renderizarJogos(
    jogos
) {

    const area =
        document.getElementById(
            "listaJogos"
        );


    if (!area) {

        return;

    }


    area.innerHTML =
        "";


    if (
        !Array.isArray(jogos) ||
        jogos.length === 0
    ) {

        area.innerHTML = `
            <div class="empty">
                ⚽ Nenhum jogo encontrado
            </div>
        `;

        return;

    }


    jogos.forEach(
        jogo => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "jogo-card";


            const casa =
                jogo.casa ??
                jogo.time_casa ??
                jogo.timeCasa ??
                jogo.home_team ??
                jogo.homeTeam ??
                "Casa";


            const fora =
                jogo.fora ??
                jogo.time_fora ??
                jogo.timeFora ??
                jogo.away_team ??
                jogo.awayTeam ??
                "Fora";


            const campeonato =
                jogo.campeonato ??
                jogo.nome_campeonato ??
                jogo.competicao ??
                jogo.competition ??
                "";


            const data =
                jogo.data ??
                jogo.data_jogo ??
                jogo.dataJogo ??
                jogo.horario ??
                jogo.date ??
                "";


            div.innerHTML = `
                <h3>
                    ${escaparHTML(
                        casa
                    )}
                    x
                    ${escaparHTML(
                        fora
                    )}
                </h3>

                <p>
                    🏆
                    ${escaparHTML(
                        campeonato
                    )}
                </p>

                <p>
                    📅
                    ${
                        data
                            ? escaparHTML(
                                formatarData(
                                    data
                                )
                            )
                            : "-"
                    }
                </p>
            `;


            area.appendChild(
                div
            );

        }
    );

}


// ==================================================
// ⭐ CARREGAR ANÁLISES IA
// API REAL
// ==================================================

async function carregarAnalisesIA() {

    if (
        estado.carregandoAnalises
    ) {

        return;

    }


    estado.carregandoAnalises =
        true;


    const area =
        document.getElementById(
            "listaAnalises"
        );


    try {

        console.log(
            "🤖 Buscando análises reais da API..."
        );


        if (area) {

            area.innerHTML = `
                <div class="loading">
                    🤖 Carregando análises IA...
                </div>
            `;

        }


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/analises`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro análises IA HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "🤖 Resposta /api/analises:",
            dados
        );


        const analises =
            extrairLista(
                dados,
                [
                    "analises",
                    "dados",
                    "data",
                    "resultados"
                ]
            );


        console.log(
            `🤖 ${analises.length} análises recebidas`
        );


        estado.analises =
            analises;


        renderizarAnalisesIA(
            analises
        );


    }

    catch (erro) {

        console.error(
            "❌ Erro análises IA:",
            erro
        );


        if (area) {

            area.innerHTML = `
                <div class="empty">
                    ❌ Não foi possível carregar as análises IA
                </div>
            `;

        }

    }

    finally {

        estado.carregandoAnalises =
            false;

    }

}


// ==================================================
// ⭐ RENDERIZAR ANÁLISES IA
// ==================================================

function renderizarAnalisesIA(
    analises
) {

    const area =
        document.getElementById(
            "listaAnalises"
        );


    if (!area) {

        console.warn(
            "⚠️ Elemento #listaAnalises não encontrado"
        );

        return;

    }


    area.innerHTML =
        "";


    if (
        !Array.isArray(analises) ||
        analises.length === 0
    ) {

        area.innerHTML = `
            <div class="empty">
                🤖 Nenhuma análise disponível
            </div>
        `;

        return;

    }


    // ==========================================
    // ORDENAR ANÁLISES
    // ==========================================

    const lista =
        [...analises].sort(
            (a, b) => {

                const dataA =
                    obterTimestampAnalise(
                        a
                    );


                const dataB =
                    obterTimestampAnalise(
                        b
                    );


                if (
                    dataA !==
                    dataB
                ) {

                    return (
                        dataB -
                        dataA
                    );

                }


                return (
                    Number(
                        b?.id ??
                        0
                    ) -
                    Number(
                        a?.id ??
                        0
                    )
                );

            }
        );


    // ==========================================
    // LIMITAR CARDS
    // ==========================================

    const exibidas =
        lista.slice(
            0,
            CONFIG.LIMITE_ANALISES
        );


    // ==========================================
    // RENDER
    // ==========================================

    exibidas.forEach(
        analise => {

            const card =
                criarCardAnalise(
                    analise
                );


            area.appendChild(
                card
            );

        }
    );


    // ==========================================
    // CONTADOR
    // ==========================================

    const contador =
        document.createElement(
            "div"
        );


    contador.className =
        "analises-contador";


    contador.textContent =
        `Exibindo ${exibidas.length} de ${formatarNumero(
            lista.length
        )} análises`;


    area.appendChild(
        contador
    );

}


// ==================================================
// CRIAR CARD DE ANÁLISE
// ==================================================

function criarCardAnalise(
    analise
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "analise-card";


    // ==========================================
    // JOGO
    // ==========================================

    const jogo =
        obterJogoAnalise(
            analise
        );


    // ==========================================
    // PROBABILIDADES
    // ==========================================

    const probCasa =
        obterNumero(
            analise,
            [
                "probabilidade_casa",
                "probCasa",
                "probabilidadeCasa",
                "home_probability"
            ]
        );


    const probEmpate =
        obterNumero(
            analise,
            [
                "probabilidade_empate",
                "probEmpate",
                "probabilidadeEmpate",
                "draw_probability"
            ]
        );


    const probFora =
        obterNumero(
            analise,
            [
                "probabilidade_fora",
                "probFora",
                "probabilidadeFora",
                "away_probability"
            ]
        );


    // ==========================================
    // GOLS
    // ==========================================

    const golsEsperados =
        obterNumero(
            analise,
            [
                "gols_esperados",
                "golsEsperados",
                "expected_goals",
                "expectedGoals"
            ]
        );


    // ==========================================
    // PLACAR
    // ==========================================

    const placar =
        analise.placar_previsto ??
        analise.placarPrevisto ??
        analise.predicted_score ??
        analise.predictedScore ??
        "--";


    // ==========================================
    // CONFIANÇA
    // ==========================================

    const confianca =
        analise.confianca ??
        analise.confidence ??
        "BAIXA";


    // ==========================================
    // ALGORITMO
    // ==========================================

    const algoritmo =
        analise.algoritmo ??
        analise.modelo ??
        analise.model ??
        "BetVision Statistical AI";


    // ==========================================
    // VALUE BET
    // ==========================================

    const possuiValueBet =
        analisarBooleano(
            analise.value_bet ??
            analise.valueBet ??
            analise.valuebet ??
            false
        );


    // ==========================================
    // DATA
    // ==========================================

    const criadoEm =
        analise.criado_em ??
        analise.criadoEm ??
        analise.created_at ??
        analise.createdAt ??
        analise.data_criacao ??
        "";


    // ==========================================
    // CLASSE CONFIANÇA
    // ==========================================

    const classeConfianca =
        String(
            confianca
        )
        .toLowerCase()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9_-]/g,
            ""
        );


    // ==========================================
    // FAVORITO
    // ==========================================

    const favorito =
        determinarFavorito(
            probCasa,
            probEmpate,
            probFora
        );


    // ==========================================
    // HTML
    // ==========================================

    card.innerHTML = `

        <div class="analise-header">

            <h3>
                ⚽
                ${escaparHTML(
                    jogo
                )}
            </h3>

            <span
                class="badge-confianca ${escaparHTML(
                    classeConfianca
                )}"
            >
                ${escaparHTML(
                    String(
                        confianca
                    ).toUpperCase()
                )}
            </span>

        </div>


        <div class="analise-algoritmo">

            🤖
            ${escaparHTML(
                algoritmo
            )}

        </div>


        <div class="analise-placar">

            <span>
                Placar IA
            </span>

            <strong>
                ${escaparHTML(
                    placar
                )}
            </strong>

        </div>


        <div class="probabilidades">

            <div
                class="probabilidade casa"
            >

                <span>
                    🏠 Casa
                </span>

                <strong>
                    ${formatarPercentual(
                        probCasa
                    )}
                </strong>

            </div>


            <div
                class="probabilidade empate"
            >

                <span>
                    🤝 Empate
                </span>

                <strong>
                    ${formatarPercentual(
                        probEmpate
                    )}
                </strong>

            </div>


            <div
                class="probabilidade fora"
            >

                <span>
                    ✈️ Fora
                </span>

                <strong>
                    ${formatarPercentual(
                        probFora
                    )}
                </strong>

            </div>

        </div>


        <div class="analise-detalhes">

            <div>

                <span>
                    ⚽ Gols Esperados
                </span>

                <strong>
                    ${formatarDecimal(
                        golsEsperados
                    )}
                </strong>

            </div>


            <div>

                <span>
                    🎯 Favorito
                </span>

                <strong>
                    ${escaparHTML(
                        favorito
                    )}
                </strong>

            </div>


            <div>

                <span>
                    💎 Value Bet
                </span>

                <strong
                    class="${
                        possuiValueBet
                            ? "value-positiva"
                            : "value-negativa"
                    }"
                >
                    ${
                        possuiValueBet
                            ? "SIM"
                            : "NÃO"
                    }
                </strong>

            </div>

        </div>


        ${
            criadoEm
                ? `
                    <div class="analise-data">

                        📅
                        ${escaparHTML(
                            formatarData(
                                criadoEm
                            )
                        )}

                    </div>
                `
                : ""
        }


        <button
            type="button"
            class="btn-analise"
        >
            🔎 Ver análise completa
        </button>

    `;


    // ==========================================
    // BOTÃO
    // ==========================================

    const botao =
        card.querySelector(
            ".btn-analise"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            () => {

                mostrarAnaliseCompleta(
                    analise
                );

            }
        );

    }


    return card;

}


// ==================================================
// DETERMINAR FAVORITO
// ==================================================

function determinarFavorito(
    casa,
    empate,
    fora
) {

    const valores = [

        {
            nome:
                "Casa",

            valor:
                Number(casa)
        },

        {
            nome:
                "Empate",

            valor:
                Number(empate)
        },

        {
            nome:
                "Fora",

            valor:
                Number(fora)
        }

    ];


    valores.sort(
        (
            a,
            b
        ) =>
            b.valor -
            a.valor
    );


    return (
        valores[0]?.nome ??
        "Indefinido"
    );

}


// ==================================================
// ANÁLISE COMPLETA
// USA O MODAL EXISTENTE #modalIA
// ==================================================

function mostrarAnaliseCompleta(
    analise
) {

    if (
        !analise ||
        typeof analise !==
        "object"
    ) {

        return;

    }


    const modal =
        document.getElementById(
            "modalIA"
        );


    const conteudo =
        document.getElementById(
            "conteudoModal"
        );


    if (
        !modal ||
        !conteudo
    ) {

        console.warn(
            "⚠️ Modal IA não encontrado"
        );

        return;

    }


    // ==========================================
    // DADOS
    // ==========================================

    const jogo =
        obterJogoAnalise(
            analise
        );


    const probCasa =
        obterNumero(
            analise,
            [
                "probabilidade_casa",
                "probCasa",
                "probabilidadeCasa",
                "home_probability"
            ]
        );


    const probEmpate =
        obterNumero(
            analise,
            [
                "probabilidade_empate",
                "probEmpate",
                "probabilidadeEmpate",
                "draw_probability"
            ]
        );


    const probFora =
        obterNumero(
            analise,
            [
                "probabilidade_fora",
                "probFora",
                "probabilidadeFora",
                "away_probability"
            ]
        );


    const gols =
        obterNumero(
            analise,
            [
                "gols_esperados",
                "golsEsperados",
                "expected_goals",
                "expectedGoals"
            ]
        );


    const placar =
        analise.placar_previsto ??
        analise.placarPrevisto ??
        analise.predicted_score ??
        "--";


    const confianca =
        analise.confianca ??
        analise.confidence ??
        "BAIXA";


    const algoritmo =
        analise.algoritmo ??
        analise.modelo ??
        analise.model ??
        "BetVision Statistical AI";


    const valueBet =
        analisarBooleano(
            analise.value_bet ??
            analise.valueBet ??
            analise.valuebet ??
            false
        );


    const criadoEm =
        analise.criado_em ??
        analise.criadoEm ??
        analise.created_at ??
        analise.createdAt ??
        "";


    const favorito =
        determinarFavorito(
            probCasa,
            probEmpate,
            probFora
        );


    // ==========================================
    // MODAL
    // ==========================================

    conteudo.innerHTML = `

        <div class="analise-completa">

            <h3>
                ⚽
                ${escaparHTML(
                    jogo
                )}
            </h3>


            <div class="modal-algoritmo">

                🤖 Modelo:

                <strong>
                    ${escaparHTML(
                        algoritmo
                    )}
                </strong>

            </div>


            <div class="modal-placar">

                <span>
                    Placar Previsto
                </span>

                <strong>
                    ${escaparHTML(
                        placar
                    )}
                </strong>

            </div>


            <div
                class="modal-probabilidades"
            >

                <div>

                    🏠 Casa

                    <strong>
                        ${formatarPercentual(
                            probCasa
                        )}
                    </strong>

                </div>


                <div>

                    🤝 Empate

                    <strong>
                        ${formatarPercentual(
                            probEmpate
                        )}
                    </strong>

                </div>


                <div>

                    ✈️ Fora

                    <strong>
                        ${formatarPercentual(
                            probFora
                        )}
                    </strong>

                </div>

            </div>


            <div class="modal-detalhes">

                <p>

                    ⚽

                    <strong>
                        Gols esperados:
                    </strong>

                    ${formatarDecimal(
                        gols
                    )}

                </p>


                <p>

                    🎯

                    <strong>
                        Favorito:
                    </strong>

                    ${escaparHTML(
                        favorito
                    )}

                </p>


                <p>

                    🎯

                    <strong>
                        Confiança:
                    </strong>

                    ${escaparHTML(
                        String(
                            confianca
                        ).toUpperCase()
                    )}

                </p>


                <p>

                    💎

                    <strong>
                        Value Bet:
                    </strong>

                    ${
                        valueBet
                            ? "SIM"
                            : "NÃO"
                    }

                </p>


                ${
                    criadoEm
                        ? `
                            <p>

                                📅

                                <strong>
                                    Análise:
                                </strong>

                                ${escaparHTML(
                                    formatarData(
                                        criadoEm
                                    )
                                )}

                            </p>
                        `
                        : ""
                }

            </div>

        </div>

    `;


    // ==========================================
    // ABRIR MODAL
    // ==========================================

    modal.classList.add(
        "ativo"
    );


    modal.style.display =
        "flex";

}


// ==================================================
// FECHAR MODAL IA
// ==================================================

function fecharModalIA() {

    const modal =
        document.getElementById(
            "modalIA"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "ativo"
    );


    modal.style.display =
        "none";

}


// ==================================================
// COMPATIBILIDADE
// ==================================================

function fecharAnaliseCompleta() {

    fecharModalIA();

}


// ==================================================
// EXTRAIR LISTA GENÉRICA
// ==================================================

function extrairLista(
    dados,
    propriedades = []
) {

    if (
        Array.isArray(dados)
    ) {

        return dados;

    }


    if (
        dados &&
        typeof dados ===
        "object"
    ) {

        for (
            const propriedade
            of propriedades
        ) {

            if (
                Array.isArray(
                    dados[
                        propriedade
                    ]
                )
            ) {

                return dados[
                    propriedade
                ];

            }

        }

    }


    return [];

}


// ==================================================
// OBTER JOGO DA ANÁLISE
// ==================================================

function obterJogoAnalise(
    analise
) {

    if (
        !analise ||
        typeof analise !==
        "object"
    ) {

        return "Jogo não informado";

    }


    if (
        analise.jogo
    ) {

        return String(
            analise.jogo
        );

    }


    const casa =
        analise.time_casa ??
        analise.timeCasa ??
        analise.home_team ??
        analise.homeTeam ??
        "Casa";


    const fora =
        analise.time_fora ??
        analise.timeFora ??
        analise.away_team ??
        analise.awayTeam ??
        "Fora";


    return `${casa} x ${fora}`;

}


// ==================================================
// OBTER NÚMERO
// ==================================================

function obterNumero(
    objeto,
    propriedades
) {

    if (
        !objeto ||
        typeof objeto !==
        "object"
    ) {

        return 0;

    }


    for (
        const propriedade
        of propriedades
    ) {

        const valor =
            objeto[
                propriedade
            ];


        if (
            valor !==
            undefined &&
            valor !==
            null &&
            valor !==
            ""
        ) {

            const numero =
                Number(
                    valor
                );


            if (
                Number.isFinite(
                    numero
                )
            ) {

                return numero;

            }

        }

    }


    return 0;

}


// ==================================================
// OBTER TIMESTAMP ANÁLISE
// ==================================================

function obterTimestampAnalise(
    analise
) {

    if (
        !analise ||
        typeof analise !==
        "object"
    ) {

        return 0;

    }


    const data =
        analise.criado_em ??
        analise.criadoEm ??
        analise.created_at ??
        analise.createdAt ??
        analise.data_criacao ??
        null;


    if (data) {

        const timestamp =
            new Date(
                data
            ).getTime();


        if (
            Number.isFinite(
                timestamp
            )
        ) {

            return timestamp;

        }

    }


    return Number(
        analise.id ??
        0
    );

}


// ==================================================
// CONVERTER BOOLEANO
// ==================================================

function analisarBooleano(
    valor
) {

    if (
        valor === true ||
        valor === 1
    ) {

        return true;

    }


    if (
        typeof valor ===
        "string"
    ) {

        const texto =
            valor
            .trim()
            .toLowerCase();


        return (
            texto ===
            "true" ||

            texto ===
            "1" ||

            texto ===
            "sim" ||

            texto ===
            "yes"
        );

    }


    return false;

}


// ==================================================
// FORMATAR NÚMERO
// ==================================================

function formatarNumero(
    numero
) {

    if (
        numero ===
        undefined ||
        numero ===
        null ||
        numero ===
        ""
    ) {

        return "0";

    }


    const valor =
        Number(
            numero
        );


    if (
        !Number.isFinite(
            valor
        )
    ) {

        return "0";

    }


    return valor.toLocaleString(
        "pt-BR"
    );

}


// ==================================================
// FORMATAR NÚMERO DECIMAL
// ==================================================

function formatarNumeroDecimal(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "0";

    }


    return numero.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits:
                0,

            maximumFractionDigits:
                2
        }
    );

}


// ==================================================
// FORMATAR DECIMAL
// ==================================================

function formatarDecimal(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "0,00";

    }


    return numero.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );

}


// ==================================================
// FORMATAR ODD
// ==================================================

function formatarOdd(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "0.00";

    }


    return numero.toFixed(
        2
    );

}


// ==================================================
// FORMATAR PERCENTUAL
// ==================================================

function formatarPercentual(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "0.00%";

    }


    return `${numero.toFixed(
        2
    )}%`;

}


// ==================================================
// FORMATAR DATA
// ==================================================

function formatarData(
    data
) {

    try {

        if (!data) {

            return "-";

        }


        const dataObj =
            data instanceof Date
                ? data
                : new Date(
                    data
                );


        if (
            Number.isNaN(
                dataObj.getTime()
            )
        ) {

            return "-";

        }


        return dataObj.toLocaleString(
            "pt-BR",
            {
                dateStyle:
                    "short",

                timeStyle:
                    "medium"
            }
        );

    }

    catch {

        return "-";

    }

}


// ==================================================
// ESCAPAR HTML
// ==================================================

function escaparHTML(
    valor
) {

    if (
        valor ===
        undefined ||
        valor ===
        null
    ) {

        return "";

    }


    return String(
        valor
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// ==================================================
// MENSAGEM
// ==================================================

function mostrarMensagem(
    id,
    mensagem
) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) {

        return;

    }


    elemento.innerHTML = `
        <div class="alerta">
            ${escaparHTML(
                mensagem
            )}
        </div>
    `;

}


// ==================================================
// TOAST
// ==================================================

function mostrarToast(
    mensagem
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const texto =
        document.getElementById(
            "toastTexto"
        );


    if (
        !toast ||
        !texto
    ) {

        return;

    }


    texto.textContent =
        mensagem;


    toast.classList.add(
        "ativo"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "ativo"
            );

        },
        3000
    );

}


// ==================================================
// VERIFICAR SERVIDOR
// ==================================================

async function verificarServidor() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/ping`,
                {
                    cache:
                        "no-store"
                }
            );


        atualizarStatus(
            resposta.ok
        );


        if (
            resposta.ok
        ) {

            atualizarElemento(
                "apiStatus",
                "Online"
            );

        }

        else {

            atualizarElemento(
                "apiStatus",
                "Offline"
            );

        }

    }

    catch (erro) {

        console.error(
            "❌ Servidor offline:",
            erro
        );


        atualizarStatus(
            false
        );


        atualizarElemento(
            "apiStatus",
            "Offline"
        );

    }

}


// ==================================================
// MONITORAMENTO API
// ==================================================

setInterval(
    () => {

        verificarServidor();

    },
    CONFIG.INTERVALO_PING
);


// ==================================================
// ATUALIZAÇÃO COMPLETA
// ==================================================

async function atualizarTudo() {

    console.log(
        "🔄 Atualizando todos os dados..."
    );


    await Promise.allSettled(
        [

            carregarDashboard(),

            carregarJogos(),

            carregarCampeonatos(),

            carregarValueBets(),

            carregarAnalisesIA()

        ]
    );


    mostrarToast(
        "✅ Dados atualizados"
    );

}


// ==================================================
// NAVEGAÇÃO
// ==================================================

function configurarNavegacao() {

    const links =
        document.querySelectorAll(
            ".sidebar nav a"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    links.forEach(
                        item =>
                            item.classList.remove(
                                "ativo"
                            )
                    );


                    link.classList.add(
                        "ativo"
                    );

                }
            );

        }
    );

}


// ==================================================
// EXECUTAR NAVEGAÇÃO
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarNavegacao();

    }
);


// ==================================================
// DISPONIBILIZAR FUNÇÕES GLOBALMENTE
// ==================================================

window.BetVisionAI = {

    atualizarTudo,

    carregarDashboard,

    carregarJogos,

    carregarCampeonatos,

    carregarValueBets,

    carregarAnalisesIA,

    renderizarValueBets,

    renderizarJogos,

    renderizarCampeonatos,

    renderizarAnalisesIA,

    conectarWebSocket,

    enviarWebSocket,

    verificarServidor,

    mostrarAnaliseCompleta,

    fecharAnaliseCompleta,

    fecharModalIA,

    mostrarToast,

    estado

};


// ==================================================
// COMPATIBILIDADE COM HTML
// ==================================================

window.fecharAnaliseCompleta =
    fecharAnaliseCompleta;


window.mostrarAnaliseCompleta =
    mostrarAnaliseCompleta;


// ==================================================
// FIM
// ==================================================

console.log(
    "✅ BetVision AI Frontend v7.0 carregado"
);


console.log(
    "🤖 Motor de análises reais conectado"
);


console.log(
    "🗄️ PostgreSQL / NeonDB"
);


console.log(
    "📊 Renderização IA: #listaAnalises"
);


console.log(
    "🔌 WebSocket:",
    CONFIG.WS_URL
);
