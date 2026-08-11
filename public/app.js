// ==================================================
// BETVISION AI
// public/app.js
// Versão 7.1
// Frontend Dashboard Inteligente
// API REAL
// PostgreSQL / NeonDB
//
// CORREÇÕES:
// 1. Jogos somente de hoje
// 2. Value Bets sem undefined
// 3. Odds/probabilidades normalizadas
// 4. Análises IA robustas
// 5. Compatibilidade com APIs atuais
// 6. Cards profissionais via frontend
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
        100,

    SOMENTE_JOGOS_HOJE:
        true

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
            "🤖 BetVision AI Frontend v7.1 iniciado"
        );

        injetarEstilosFrontend();

        iniciarSistema();

    }
);

// ==================================================
// INICIAR SISTEMA
// ==================================================

function iniciarSistema() {

    carregarDashboard();

    carregarJogos();

    carregarCampeonatos();

    carregarValueBets();

    carregarAnalisesIA();

    conectarWebSocket();

    verificarServidor();

    iniciarAtualizacaoAutomatica();

    inicializarInterface();

    configurarNavegacao();

}

// ==================================================
// INTERFACE
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

                if (
                    botaoAtualizar.disabled
                ) {

                    return;

                }

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
        typeof dados !== "object"
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
            primeiroValor(
                dados,
                [
                    "jogosHoje",
                    "jogos_hoje"
                ],
                0
            )
        )
    );

    atualizarElemento(
        "campeonatos",
        formatarNumero(
            primeiroValor(
                dados,
                [
                    "campeonatos",
                    "campeonato",
                    "totalCampeonatos"
                ],
                0
            )
        )
    );

    atualizarElemento(
        "analisesIA",
        formatarNumero(
            primeiroValor(
                dados,
                [
                    "analisesIA",
                    "analises_ia",
                    "analises",
                    "totalAnalises"
                ],
                0
            )
        )
    );

    atualizarElemento(
        "valueBets",
        formatarNumero(
            primeiroValor(
                dados,
                [
                    "valueBets",
                    "valuebets",
                    "value_bets",
                    "totalValueBets"
                ],
                0
            )
        )
    );

    atualizarElemento(
        "roi",
        formatarPercentual(
            primeiroValor(
                dados,
                [
                    "roi",
                    "ROI"
                ],
                0
            )
        )
    );

    const precisao =
        primeiroValor(
            dados,
            [
                "precisao",
                "precisaoIA",
                "precisao_ia",
                "accuracy"
            ],
            0
        );

    atualizarElemento(
        "precisaoIA",
        formatarPercentual(
            precisao
        )
    );

    atualizarElemento(
        "precisao",
        formatarPercentual(
            precisao
        )
    );

    atualizarElemento(
        "precisaoRodape",
        formatarPercentual(
            precisao
        )
    );

    atualizarElemento(
        "nomeSistema",
        dados.sistema ??
        "BetVision AI"
    );

    atualizarElemento(
        "modeloIA",
        dados.modelo ??
        "BetVision Statistical AI"
    );

    atualizarElemento(
        "modeloStatus",
        dados.modelo ??
        "BetVision Statistical AI"
    );

    atualizarElemento(
        "modeloRodape",
        dados.modelo ??
        "BetVision Statistical AI"
    );

    atualizarUltimaAtualizacao();

    atualizarUltimaAtualizacaoCompleta();

    atualizarStatus(
        true
    );

}

// ==================================================
// ELEMENTO
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
// STATUS
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
// RECONEXÃO
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
// WEBSOCKET MESSAGE
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
        typeof mensagem !== "object"
    ) {

        return;

    }

    const tipo =
        String(
            mensagem.tipo ??
            mensagem.type ??
            ""
        );

    if (
        tipo ===
        "dashboard"
    ) {

        atualizarDashboard(
            mensagem.dados ??
            mensagem.data ??
            mensagem
        );

    }

    if (
        tipo ===
        "status"
    ) {

        atualizarStatus(
            mensagem.online ===
            true
        );

    }

    if (
        tipo ===
        "valueBet" ||
        tipo ===
        "valuebet"
    ) {

        const aposta =
            mensagem.dados ??
            mensagem.data ??
            mensagem.valuebet ??
            mensagem.valueBet ??
            mensagem;

        adicionarValueBet(
            aposta
        );

        carregarDashboard();

    }

    if (
        tipo ===
        "valuebets"
    ) {

        const lista =
            extrairListaValueBets(
                mensagem
            );

        estado.valueBets =
            normalizarValueBets(
                lista
            );

        renderizarValueBets(
            estado.valueBets
        );

        carregarDashboard();

    }

    if (
        tipo ===
        "jogoAtualizado" ||
        tipo ===
        "jogo" ||
        tipo ===
        "jogos"
    ) {

        carregarDashboard();

        carregarJogos();

        carregarAnalisesIA();

        carregarValueBets();

    }

    if (
        tipo ===
        "analise" ||
        tipo ===
        "analiseIA" ||
        tipo ===
        "analises"
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
                primeiroValor(
                    campeonato,
                    [
                        "nome",
                        "name",
                        "nome_campeonato",
                        "competition_name"
                    ],
                    "Campeonato"
                );

            const pais =
                primeiroValor(
                    campeonato,
                    [
                        "pais",
                        "country",
                        "country_name"
                    ],
                    ""
                );

            div.innerHTML = `

                <div class="campeonato-icone">
                    🏆
                </div>

                <div class="campeonato-info">

                    <strong>
                        ${escaparHTML(nome)}
                    </strong>

                    ${
                        pais
                            ? `
                                <span>
                                    ${escaparHTML(pais)}
                                </span>
                            `
                            : ""
                    }

                </div>

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

        console.log(
            "💎 Resposta /api/valuebets:",
            dados
        );

        const lista =
            extrairListaValueBets(
                dados
            );

        estado.valueBets =
            normalizarValueBets(
                lista
            );

        console.log(
            `💎 ${estado.valueBets.length} Value Bets encontradas`
        );

        renderizarValueBets(
            estado.valueBets
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
        !dados ||
        typeof dados !== "object"
    ) {

        return [];

    }

    const propriedades = [

        "valuebets",

        "valueBets",

        "value_bets",

        "dados",

        "data",

        "resultados",

        "results",

        "items"

    ];

    for (
        const propriedade
        of propriedades
    ) {

        if (
            Array.isArray(
                dados[propriedade]
            )
        ) {

            return dados[
                propriedade
            ];

        }

    }

    if (
        dados.valuebet &&
        typeof dados.valuebet ===
        "object"
    ) {

        return [
            dados.valuebet
        ];

    }

    if (
        dados.valueBet &&
        typeof dados.valueBet ===
        "object"
    ) {

        return [
            dados.valueBet
        ];

    }

    return [];

}

// ==================================================
// NORMALIZAR VALUE BETS
// ==================================================

function normalizarValueBets(
    lista
) {

    if (
        !Array.isArray(lista)
    ) {

        return [];

    }

    return lista
        .filter(
            item =>
                item &&
                typeof item ===
                "object"
        )
        .map(
            item =>
                normalizarValueBet(
                    item
                )
        );

}

// ==================================================
// NORMALIZAR VALUE BET
// ==================================================

function normalizarValueBet(
    aposta
) {

    const jogoObjeto =
        (
            aposta.jogo &&
            typeof aposta.jogo ===
            "object"
        )
            ? aposta.jogo
            : null;

    const casa =
        primeiroValor(
            aposta,
            [
                "time_casa",
                "timeCasa",
                "home_team",
                "homeTeam",
                "casa",
                "mandante"
            ],
            jogoObjeto
                ? primeiroValor(
                    jogoObjeto,
                    [
                        "time_casa",
                        "timeCasa",
                        "home_team",
                        "homeTeam",
                        "casa"
                    ],
                    "Casa"
                )
                : "Casa"
        );

    const fora =
        primeiroValor(
            aposta,
            [
                "time_fora",
                "timeFora",
                "away_team",
                "awayTeam",
                "fora",
                "visitante"
            ],
            jogoObjeto
                ? primeiroValor(
                    jogoObjeto,
                    [
                        "time_fora",
                        "timeFora",
                        "away_team",
                        "awayTeam",
                        "fora"
                    ],
                    "Fora"
                )
                : "Fora"
        );

    const jogoTexto =
        typeof aposta.jogo ===
        "string"
            ? aposta.jogo
            : `${casa} x ${fora}`;

    const mercado =
        primeiroValor(
            aposta,
            [
                "mercado",
                "market",
                "tipo_mercado",
                "tipoMercado",
                "selection",
                "aposta"
            ],
            "Não informado"
        );

    const odd =
        obterOdd(
            aposta
        );

    const oddJusta =
        obterNumeroFlexivel(
            aposta,
            [
                "oddJusta",
                "odd_justa",
                "fair_odd",
                "fairOdd",
                "odd_fair",
                "oddJustaCalculada"
            ]
        );

    const probabilidade =
        normalizarPercentual(
            obterNumeroFlexivel(
                aposta,
                [
                    "probabilidade",
                    "probabilidade_real",
                    "probabilidadeReal",
                    "probability",
                    "prob",
                    "chance"
                ]
            )
        );

    const edge =
        normalizarPercentual(
            obterNumeroFlexivel(
                aposta,
                [
                    "edge",
                    "valor_edge",
                    "value_edge"
                ]
            )
        );

    const roi =
        normalizarPercentual(
            obterNumeroFlexivel(
                aposta,
                [
                    "roi",
                    "valor_esperado",
                    "valorEsperado",
                    "expected_value"
                ]
            )
        );

    return {

        ...aposta,

        jogo:
            jogoTexto,

        time_casa:
            casa,

        time_fora:
            fora,

        mercado:
            mercado,

        odd:
            odd,

        oddJusta:
            oddJusta,

        probabilidade:
            probabilidade,

        edge:
            edge,

        roi:
            roi

    };

}

// ==================================================
// OBTER ODD
// ==================================================

function obterOdd(
    aposta
) {

    const valor =
        obterNumeroFlexivel(
            aposta,
            [
                "odd",
                "oddMercado",
                "odd_mercado",
                "odds",
                "price",
                "cotacao"
            ]
        );

    return valor > 0
        ? valor
        : 0;

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
                aposta.jogo ||
                `${aposta.time_casa || "Casa"} x ${aposta.time_fora || "Fora"}`;

            const odd =
                Number(
                    aposta.odd
                ) || 0;

            const oddJusta =
                Number(
                    aposta.oddJusta
                ) || 0;

            const probabilidade =
                Number(
                    aposta.probabilidade
                ) || 0;

            const edge =
                Number(
                    aposta.edge
                ) || 0;

            const roi =
                Number(
                    aposta.roi
                ) || 0;

            const classeValue =
                edge > 0
                    ? "positivo"
                    : "neutro";

            card.innerHTML = `

                <div class="valuebet-header">

                    <div class="valuebet-icon">
                        💎
                    </div>

                    <div class="valuebet-jogo">
                        ${escaparHTML(jogo)}
                    </div>

                </div>

                <div class="valuebet-mercado">
                    Mercado:
                    <strong>
                        ${escaparHTML(
                            aposta.mercado ||
                            "Não informado"
                        )}
                    </strong>
                </div>

                <div class="valuebet-grid">

                    <div class="valuebet-item">

                        <span>
                            Odd
                        </span>

                        <strong>
                            ${formatarOdd(odd)}
                        </strong>

                    </div>

                    <div class="valuebet-item">

                        <span>
                            Odd Justa
                        </span>

                        <strong>
                            ${
                                oddJusta > 0
                                    ? formatarOdd(
                                        oddJusta
                                    )
                                    : "-"
                            }
                        </strong>

                    </div>

                    <div class="valuebet-item">

                        <span>
                            Probabilidade
                        </span>

                        <strong>
                            ${formatarPercentual(
                                probabilidade
                            )}
                        </strong>

                    </div>

                    <div class="valuebet-item">

                        <span>
                            Edge
                        </span>

                        <strong
                            class="${classeValue}"
                        >
                            ${formatarPercentual(
                                edge
                            )}
                        </strong>

                    </div>

                    <div class="valuebet-item">

                        <span>
                            ROI
                        </span>

                        <strong>
                            ${formatarPercentual(
                                roi
                            )}
                        </strong>

                    </div>

                </div>

                <div class="valuebet-footer">

                    <span>
                        💎 VALUE BET
                    </span>

                    <span class="value-status">
                        ${edge > 0 ? "POSITIVA" : "ANÁLISE"}
                    </span>

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

    const normalizada =
        normalizarValueBet(
            aposta
        );

    estado.valueBets.unshift(
        normalizada
    );

    estado.valueBets =
        estado.valueBets.slice(
            0,
            CONFIG.LIMITE_ANALISES
        );

    renderizarValueBets(
        estado.valueBets
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

        console.log(
            "⚽ Buscando jogos..."
        );

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

        console.log(
            "⚽ Resposta /api/jogos:",
            dados
        );

        let jogos =
            extrairLista(
                dados,
                [
                    "jogos",
                    "matches",
                    "dados",
                    "data",
                    "resultados",
                    "results",
                    "items"
                ]
            );

        console.log(
            `⚽ Jogos recebidos da API: ${jogos.length}`
        );

        if (
            CONFIG.SOMENTE_JOGOS_HOJE
        ) {

            jogos =
                filtrarJogosDeHoje(
                    jogos
                );

            console.log(
                `📅 Jogos de hoje: ${jogos.length}`
            );

        }

        jogos =
            jogos.slice(
                0,
                CONFIG.LIMITE_JOGOS
            );

        estado.jogos =
            jogos;

        renderizarJogos(
            jogos
        );

        atualizarContadorJogos(
            jogos.length
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro jogos:",
            erro
        );

        estado.jogos =
            [];

        renderizarJogos(
            []
        );

        atualizarContadorJogos(
            0
        );

    }

    finally {

        estado.carregandoJogos =
            false;

    }

}

// ==================================================
// FILTRAR JOGOS DE HOJE
// ==================================================

function filtrarJogosDeHoje(
    jogos
) {

    if (
        !Array.isArray(jogos)
    ) {

        return [];

    }

    const hoje =
        obterChaveDataHoje();

    return jogos.filter(
        jogo => {

            const data =
                obterDataJogo(
                    jogo
                );

            if (!data) {

                return false;

            }

            return (
                obterChaveData(
                    data
                ) ===
                hoje
            );

        }
    );

}

// ==================================================
// DATA DO JOGO
// ==================================================

function obterDataJogo(
    jogo
) {

    if (
        !jogo ||
        typeof jogo !==
        "object"
    ) {

        return null;

    }

    return primeiroValor(
        jogo,
        [
            "data",
            "data_jogo",
            "dataJogo",
            "horario",
            "horário",
            "date",
            "datetime",
            "kickoff",
            "start_time",
            "startTime",
            "utc_date",
            "utcDate"
        ],
        null
    );

}

// ==================================================
// CHAVE DATA HOJE
// ==================================================

function obterChaveDataHoje() {

    const agora =
        new Date();

    return [

        agora.getFullYear(),

        String(
            agora.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            agora.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}

// ==================================================
// CHAVE DATA
// ==================================================

function obterChaveData(
    valor
) {

    if (
        !valor
    ) {

        return "";

    }

    if (
        valor instanceof Date
    ) {

        if (
            Number.isNaN(
                valor.getTime()
            )
        ) {

            return "";

        }

        return [

            valor.getFullYear(),

            String(
                valor.getMonth() + 1
            ).padStart(
                2,
                "0"
            ),

            String(
                valor.getDate()
            ).padStart(
                2,
                "0"
            )

        ].join("-");

    }

    const texto =
        String(
            valor
        ).trim();

    // YYYY-MM-DD
    const iso =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (iso) {

        return `${iso[1]}-${iso[2]}-${iso[3]}`;

    }

    // DD/MM/YYYY
    const br =
        texto.match(
            /^(\d{2})\/(\d{2})\/(\d{4})/
        );

    if (br) {

        return `${br[3]}-${br[2]}-${br[1]}`;

    }

    const data =
        new Date(
            texto
        );

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return "";

    }

    return obterChaveData(
        data
    );

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

        console.warn(
            "⚠️ #listaJogos não encontrado"
        );

        return;

    }

    area.innerHTML =
        "";

    if (
        !Array.isArray(jogos) ||
        jogos.length === 0
    ) {

        area.innerHTML = `

            <div class="empty jogos-vazio">

                <div>
                    ⚽
                </div>

                <strong>
                    Nenhum jogo hoje
                </strong>

                <span>
                    A API não retornou jogos para a data atual.
                </span>

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
                primeiroValor(
                    jogo,
                    [
                        "casa",
                        "time_casa",
                        "timeCasa",
                        "home_team",
                        "homeTeam",
                        "mandante"
                    ],
                    "Casa"
                );

            const fora =
                primeiroValor(
                    jogo,
                    [
                        "fora",
                        "time_fora",
                        "timeFora",
                        "away_team",
                        "awayTeam",
                        "visitante"
                    ],
                    "Fora"
                );

            const campeonato =
                primeiroValor(
                    jogo,
                    [
                        "campeonato",
                        "nome_campeonato",
                        "competicao",
                        "competition",
                        "competition_name"
                    ],
                    ""
                );

            const data =
                obterDataJogo(
                    jogo
                );

            const hora =
                extrairHora(
                    data
                );

            div.innerHTML = `

                <div class="jogo-topo">

                    <span class="jogo-badge">
                        HOJE
                    </span>

                    ${
                        hora
                            ? `
                                <span class="jogo-hora">
                                    ⏰ ${escaparHTML(hora)}
                                </span>
                            `
                            : ""
                    }

                </div>

                <div class="jogo-times">

                    <div class="time-casa">

                        <span class="time-icon">
                            🏠
                        </span>

                        <strong>
                            ${escaparHTML(casa)}
                        </strong>

                    </div>

                    <span class="versus">
                        VS
                    </span>

                    <div class="time-fora">

                        <strong>
                            ${escaparHTML(fora)}
                        </strong>

                        <span class="time-icon">
                            ✈️
                        </span>

                    </div>

                </div>

                ${
                    campeonato
                        ? `
                            <div class="jogo-campeonato">
                                🏆
                                ${escaparHTML(campeonato)}
                            </div>
                        `
                        : ""
                }

                ${
                    data
                        ? `
                            <div class="jogo-data">
                                📅
                                ${escaparHTML(
                                    formatarData(
                                        data
                                    )
                                )}
                            </div>
                        `
                        : ""
                }

            `;

            area.appendChild(
                div
            );

        }
    );

}

// ==================================================
// HORA
// ==================================================

function extrairHora(
    valor
) {

    if (!valor) {

        return "";

    }

    const texto =
        String(
            valor
        );

    const match =
        texto.match(
            /T(\d{2}):(\d{2})/
        );

    if (match) {

        return `${match[1]}:${match[2]}`;

    }

    const matchBR =
        texto.match(
            /(\d{2}):(\d{2})/
        );

    if (matchBR) {

        return `${matchBR[1]}:${matchBR[2]}`;

    }

    return "";

}

// ==================================================
// CONTADOR JOGOS
// ==================================================

function atualizarContadorJogos(
    quantidade
) {

    atualizarElemento(
        "jogosHoje",
        formatarNumero(
            quantidade
        )
    );

}

// ==================================================
// ANÁLISES IA
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
            "🤖 Buscando análises reais..."
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

        const lista =
            extrairLista(
                dados,
                [
                    "analises",
                    "analisesIA",
                    "analises_ia",
                    "dados",
                    "data",
                    "resultados",
                    "results",
                    "items"
                ]
            );

        estado.analises =
            normalizarAnalises(
                lista
            );

        console.log(
            `🤖 ${estado.analises.length} análises recebidas`
        );

        renderizarAnalisesIA(
            estado.analises
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
// NORMALIZAR ANÁLISES
// ==================================================

function normalizarAnalises(
    lista
) {

    if (
        !Array.isArray(lista)
    ) {

        return [];

    }

    return lista
        .filter(
            item =>
                item &&
                typeof item ===
                "object"
        )
        .map(
            item =>
                normalizarAnalise(
                    item
                )
        );

}

// ==================================================
// NORMALIZAR ANÁLISE
// ==================================================

function normalizarAnalise(
    analise
) {

    const casa =
        primeiroValor(
            analise,
            [
                "time_casa",
                "timeCasa",
                "home_team",
                "homeTeam",
                "casa",
                "mandante"
            ],
            ""
        );

    const fora =
        primeiroValor(
            analise,
            [
                "time_fora",
                "timeFora",
                "away_team",
                "awayTeam",
                "fora",
                "visitante"
            ],
            ""
        );

    let jogo =
        analise.jogo;

    if (
        jogo &&
        typeof jogo ===
        "object"
    ) {

        jogo =
            primeiroValor(
                jogo,
                [
                    "nome",
                    "name",
                    "jogo"
                ],
                ""
            );

    }

    if (
        !jogo
    ) {

        jogo =
            casa &&
            fora
                ? `${casa} x ${fora}`
                : "Jogo não informado";

    }

    const probCasa =
        normalizarPercentual(
            obterNumeroFlexivel(
                analise,
                [
                    "probabilidade_casa",
                    "probCasa",
                    "probabilidadeCasa",
                    "home_probability",
                    "homeProbability",
                    "prob_casa"
                ]
            )
        );

    const probEmpate =
        normalizarPercentual(
            obterNumeroFlexivel(
                analise,
                [
                    "probabilidade_empate",
                    "probEmpate",
                    "probabilidadeEmpate",
                    "draw_probability",
                    "drawProbability",
                    "prob_empate"
                ]
            )
        );

    const probFora =
        normalizarPercentual(
            obterNumeroFlexivel(
                analise,
                [
                    "probabilidade_fora",
                    "probFora",
                    "probabilidadeFora",
                    "away_probability",
                    "awayProbability",
                    "prob_fora"
                ]
            )
        );

    const golsEsperados =
        obterNumeroFlexivel(
            analise,
            [
                "gols_esperados",
                "golsEsperados",
                "expected_goals",
                "expectedGoals",
                "xg"
            ]
        );

    const placar =
        primeiroValor(
            analise,
            [
                "placar_previsto",
                "placarPrevisto",
                "predicted_score",
                "predictedScore",
                "placar",
                "score"
            ],
            "--"
        );

    const confianca =
        primeiroValor(
            analise,
            [
                "confianca",
                "confidence",
                "nivel_confianca",
                "nivelConfianca"
            ],
            "BAIXA"
        );

    const algoritmo =
        primeiroValor(
            analise,
            [
                "algoritmo",
                "modelo",
                "model",
                "modelo_ia",
                "modeloIA"
            ],
            "BetVision Statistical AI"
        );

    const valueBet =
        analisarBooleano(
            primeiroValor(
                analise,
                [
                    "value_bet",
                    "valueBet",
                    "valuebet",
                    "is_value_bet"
                ],
                false
            )
        );

    const criadoEm =
        primeiroValor(
            analise,
            [
                "criado_em",
                "criadoEm",
                "created_at",
                "createdAt",
                "data_criacao",
                "dataCriacao"
            ],
            ""
        );

    return {

        ...analise,

        jogo:
            String(jogo),

        time_casa:
            casa,

        time_fora:
            fora,

        probabilidade_casa:
            probCasa,

        probabilidade_empate:
            probEmpate,

        probabilidade_fora:
            probFora,

        gols_esperados:
            golsEsperados,

        placar_previsto:
            String(placar),

        confianca:
            confianca,

        algoritmo:
            algoritmo,

        value_bet:
            valueBet,

        criado_em:
            criadoEm

    };

}

// ==================================================
// RENDER ANÁLISES
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
            "⚠️ #listaAnalises não encontrado"
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

    const lista =
        [...analises].sort(
            (
                a,
                b
            ) => {

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

    const exibidas =
        lista.slice(
            0,
            CONFIG.LIMITE_ANALISES
        );

    exibidas.forEach(
        analise => {

            area.appendChild(
                criarCardAnalise(
                    analise
                )
            );

        }
    );

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
// CARD ANÁLISE
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

    const jogo =
        analise.jogo ||
        obterJogoAnalise(
            analise
        );

    const probCasa =
        Number(
            analise.probabilidade_casa
        ) || 0;

    const probEmpate =
        Number(
            analise.probabilidade_empate
        ) || 0;

    const probFora =
        Number(
            analise.probabilidade_fora
        ) || 0;

    const golsEsperados =
        Number(
            analise.gols_esperados
        ) || 0;

    const placar =
        analise.placar_previsto ||
        "--";

    const confianca =
        analise.confianca ||
        "BAIXA";

    const algoritmo =
        analise.algoritmo ||
        "BetVision Statistical AI";

    const possuiValueBet =
        analisarBooleano(
            analise.value_bet
        );

    const favorito =
        determinarFavorito(
            probCasa,
            probEmpate,
            probFora
        );

    const classeConfianca =
        normalizarClasse(
            confianca
        );

    const criadoEm =
        analise.criado_em ||
        "";

    card.innerHTML = `

        <div class="analise-header">

            <h3>
                ⚽
                ${escaparHTML(jogo)}
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

            <div class="probabilidade casa">

                <span>
                    🏠 Casa
                </span>

                <strong>
                    ${formatarPercentual(
                        probCasa
                    )}
                </strong>

            </div>

            <div class="probabilidade empate">

                <span>
                    🤝 Empate
                </span>

                <strong>
                    ${formatarPercentual(
                        probEmpate
                    )}
                </strong>

            </div>

            <div class="probabilidade fora">

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
// FAVORITO
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
                Number(casa) || 0
        },

        {
            nome:
                "Empate",

            valor:
                Number(empate) || 0
        },

        {
            nome:
                "Fora",

            valor:
                Number(fora) || 0
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

    if (
        valores[0].valor <= 0
    ) {

        return "Indefinido";

    }

    return (
        valores[0]?.nome ??
        "Indefinido"
    );

}

// ==================================================
// MODAL IA
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

    const dados =
        normalizarAnalise(
            analise
        );

    const favorito =
        determinarFavorito(
            dados.probabilidade_casa,
            dados.probabilidade_empate,
            dados.probabilidade_fora
        );

    conteudo.innerHTML = `

        <div class="analise-completa">

            <h3>
                ⚽
                ${escaparHTML(
                    dados.jogo
                )}
            </h3>

            <div class="modal-algoritmo">

                🤖 Modelo:

                <strong>
                    ${escaparHTML(
                        dados.algoritmo
                    )}
                </strong>

            </div>

            <div class="modal-placar">

                <span>
                    Placar Previsto
                </span>

                <strong>
                    ${escaparHTML(
                        dados.placar_previsto
                    )}
                </strong>

            </div>

            <div class="modal-probabilidades">

                <div>

                    🏠 Casa

                    <strong>
                        ${formatarPercentual(
                            dados.probabilidade_casa
                        )}
                    </strong>

                </div>

                <div>

                    🤝 Empate

                    <strong>
                        ${formatarPercentual(
                            dados.probabilidade_empate
                        )}
                    </strong>

                </div>

                <div>

                    ✈️ Fora

                    <strong>
                        ${formatarPercentual(
                            dados.probabilidade_fora
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
                        dados.gols_esperados
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
                            dados.confianca
                        ).toUpperCase()
                    )}

                </p>

                <p>

                    💎

                    <strong>
                        Value Bet:
                    </strong>

                    ${
                        dados.value_bet
                            ? "SIM"
                            : "NÃO"
                    }

                </p>

                ${
                    dados.criado_em
                        ? `
                            <p>

                                📅

                                <strong>
                                    Análise:
                                </strong>

                                ${escaparHTML(
                                    formatarData(
                                        dados.criado_em
                                    )
                                )}

                            </p>
                        `
                        : ""
                }

            </div>

        </div>

    `;

    modal.classList.add(
        "ativo"
    );

    modal.style.display =
        "flex";

}

// ==================================================
// FECHAR MODAL
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

function fecharAnaliseCompleta() {

    fecharModalIA();

}

// ==================================================
// EXTRAIR LISTA
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
        !dados ||
        typeof dados !==
        "object"
    ) {

        return [];

    }

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

    return [];

}

// ==================================================
// PRIMEIRO VALOR VÁLIDO
// ==================================================

function primeiroValor(
    objeto,
    propriedades,
    padrao = null
) {

    if (
        !objeto ||
        typeof objeto !==
        "object"
    ) {

        return padrao;

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

            return valor;

        }

    }

    return padrao;

}

// ==================================================
// NÚMERO FLEXÍVEL
// ==================================================

function obterNumeroFlexivel(
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
            valor ===
            undefined ||
            valor ===
            null ||
            valor ===
            ""
        ) {

            continue;

        }

        if (
            typeof valor ===
            "object"
        ) {

            const interno =
                primeiroValor(
                    valor,
                    [
                        "valor",
                        "value",
                        "odd",
                        "probabilidade",
                        "probability"
                    ],
                    null
                );

            if (
                interno !==
                null
            ) {

                const numero =
                    converterNumero(
                        interno
                    );

                if (
                    Number.isFinite(
                        numero
                    )
                ) {

                    return numero;

                }

            }

            continue;

        }

        const numero =
            converterNumero(
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

    return 0;

}

// ==================================================
// CONVERTER NÚMERO
// ==================================================

function converterNumero(
    valor
) {

    if (
        typeof valor ===
        "number"
    ) {

        return valor;

    }

    let texto =
        String(
            valor
        )
        .trim()
        .replace(
            "%",
            ""
        );

    if (
        texto.includes(",") &&
        texto.includes(".")
    ) {

        texto =
            texto.replace(
                /\./g,
                ""
            );

        texto =
            texto.replace(
                ",",
                "."
            );

    }

    else {

        texto =
            texto.replace(
                ",",
                "."
            );

    }

    const numero =
        Number(
            texto
        );

    return numero;

}

// ==================================================
// NORMALIZAR PERCENTUAL
// ==================================================

function normalizarPercentual(
    valor
) {

    const numero =
        converterNumero(
            valor
        );

    if (
        !Number.isFinite(
            numero
        )
    ) {

        return 0;

    }

    /*
       A API pode retornar:

       0.65  => 65%
       0.42  => 42%
       65    => 65%
       42    => 42%

       Portanto somente valores entre
       0 e 1 são multiplicados por 100.
    */

    if (
        numero > 0 &&
        numero <= 1
    ) {

        return numero * 100;

    }

    return numero;

}

// ==================================================
// OBTER JOGO ANÁLISE
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
        typeof analise.jogo ===
        "string" &&
        analise.jogo.trim()
    ) {

        return analise.jogo;

    }

    const casa =
        primeiroValor(
            analise,
            [
                "time_casa",
                "timeCasa",
                "home_team",
                "homeTeam",
                "casa"
            ],
            "Casa"
        );

    const fora =
        primeiroValor(
            analise,
            [
                "time_fora",
                "timeFora",
                "away_team",
                "awayTeam",
                "fora"
            ],
            "Fora"
        );

    return `${casa} x ${fora}`;

}

// ==================================================
// TIMESTAMP
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
        primeiroValor(
            analise,
            [
                "criado_em",
                "criadoEm",
                "created_at",
                "createdAt",
                "data_criacao",
                "dataCriacao"
            ],
            null
        );

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
// BOOLEANO
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
            "yes" ||

            texto ===
            "positivo"

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
        ) ||
        numero <= 0
    ) {

        return "-";

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
        normalizarPercentual(
            valor
        );

    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "0,00%";

    }

    return `${numero.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
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
// NORMALIZAR CLASSE
// ==================================================

function normalizarClasse(
    valor
) {

    return String(
        valor ??
        ""
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

        atualizarElemento(
            "apiStatus",
            resposta.ok
                ? "Online"
                : "Offline"
        );

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
// ESTILOS FRONTEND
// Não exige alteração do CSS
// ==================================================

function injetarEstilosFrontend() {

    if (
        document.getElementById(
            "betvision-v71-style"
        )
    ) {

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "betvision-v71-style";

    style.textContent = `

        /* =====================================
           VALUE BETS
        ===================================== */

        #listaValueBets {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        280px,
                        1fr
                    )
                );

            gap:
                16px;

        }

        .valuebet-card {

            padding:
                18px;

            border-radius:
                16px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.96
                );

            border:
                1px solid
                rgba(
                    0,
                    0,
                    0,
                    0.08
                );

            box-shadow:
                0 8px 25px
                rgba(
                    0,
                    0,
                    0,
                    0.08
                );

            transition:
                transform
                .2s ease,
                box-shadow
                .2s ease;

        }

        .valuebet-card:hover {

            transform:
                translateY(
                    -3px
                );

            box-shadow:
                0 12px 30px
                rgba(
                    0,
                    0,
                    0,
                    0.13
                );

        }

        .valuebet-header {

            display:
                flex;

            align-items:
                center;

            gap:
                10px;

            margin-bottom:
                12px;

        }

        .valuebet-icon {

            font-size:
                24px;

        }

        .valuebet-jogo {

            font-size:
                17px;

            font-weight:
                700;

        }

        .valuebet-mercado {

            margin-bottom:
                14px;

            font-size:
                13px;

            opacity:
                .8;

        }

        .valuebet-grid {

            display:
                grid;

            grid-template-columns:
                repeat(
                    2,
                    1fr
                );

            gap:
                10px;

        }

        .valuebet-item {

            padding:
                10px;

            border-radius:
                10px;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .035
                );

        }

        .valuebet-item span {

            display:
                block;

            font-size:
                11px;

            opacity:
                .65;

            margin-bottom:
                4px;

        }

        .valuebet-item strong {

            font-size:
                16px;

        }

        .valuebet-item strong.positivo {

            font-weight:
                800;

        }

        .valuebet-footer {

            display:
                flex;

            justify-content:
                space-between;

            margin-top:
                14px;

            padding-top:
                12px;

            border-top:
                1px solid
                rgba(
                    0,
                    0,
                    0,
                    .08
                );

            font-size:
                12px;

            font-weight:
                700;

        }

        /* =====================================
           JOGOS
        ===================================== */

        #listaJogos {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        300px,
                        1fr
                    )
                );

            gap:
                16px;

        }

        .jogo-card {

            padding:
                18px;

            border-radius:
                16px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .97
                );

            border:
                1px solid
                rgba(
                    0,
                    0,
                    0,
                    .08
                );

            box-shadow:
                0 8px 25px
                rgba(
                    0,
                    0,
                    0,
                    .08
                );

        }

        .jogo-topo {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            margin-bottom:
                16px;

        }

        .jogo-badge {

            padding:
                5px 9px;

            border-radius:
                20px;

            font-size:
                10px;

            font-weight:
                800;

        }

        .jogo-hora {

            font-weight:
                700;

            font-size:
                13px;

        }

        .jogo-times {

            display:
                grid;

            grid-template-columns:
                1fr
                auto
                1fr;

            align-items:
                center;

            gap:
                10px;

            text-align:
                center;

        }

        .time-casa,
        .time-fora {

            display:
                flex;

            flex-direction:
                column;

            align-items:
                center;

            gap:
                7px;

        }

        .time-icon {

            font-size:
                22px;

        }

        .versus {

            font-size:
                12px;

            font-weight:
                900;

            opacity:
                .55;

        }

        .jogo-campeonato,
        .jogo-data {

            margin-top:
                12px;

            font-size:
                12px;

            opacity:
                .75;

        }

        /* =====================================
           ANÁLISES
        ===================================== */

        #listaAnalises {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        320px,
                        1fr
                    )
                );

            gap:
                18px;

        }

        .analise-card {

            padding:
                18px;

            border-radius:
                18px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .97
                );

            border:
                1px solid
                rgba(
                    0,
                    0,
                    0,
                    .08
                );

            box-shadow:
                0 8px 25px
                rgba(
                    0,
                    0,
                    0,
                    .08
                );

        }

        .analise-header {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            gap:
                10px;

        }

        .analise-header h3 {

            margin:
                0;

            font-size:
                17px;

        }

        .badge-confianca {

            padding:
                5px 9px;

            border-radius:
                20px;

            font-size:
                10px;

            font-weight:
                800;

            white-space:
                nowrap;

        }

        .analise-algoritmo {

            margin-top:
                10px;

            font-size:
                12px;

            opacity:
                .7;

        }

        .analise-placar {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            margin:
                15px 0;

            padding:
                13px;

            border-radius:
                12px;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .035
                );

        }

        .analise-placar strong {

            font-size:
                24px;

        }

        .probabilidades {

            display:
                grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap:
                8px;

        }

        .probabilidade {

            text-align:
                center;

            padding:
                10px 5px;

            border-radius:
                10px;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .035
                );

        }

        .probabilidade span {

            display:
                block;

            font-size:
                11px;

            margin-bottom:
                5px;

        }

        .probabilidade strong {

            font-size:
                16px;

        }

        .analise-detalhes {

            display:
                grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap:
                8px;

            margin-top:
                12px;

        }

        .analise-detalhes div {

            padding:
                9px;

            border-radius:
                9px;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .025
                );

        }

        .analise-detalhes span {

            display:
                block;

            font-size:
                10px;

            opacity:
                .65;

            margin-bottom:
                4px;

        }

        .analise-detalhes strong {

            font-size:
                13px;

        }

        .value-positiva {

            font-weight:
                900;

        }

        .value-negativa {

            opacity:
                .6;

        }

        .analise-data {

            margin-top:
                12px;

            font-size:
                11px;

            opacity:
                .6;

        }

        .btn-analise {

            width:
                100%;

            margin-top:
                14px;

            padding:
                11px;

            border:
                0;

            border-radius:
                10px;

            cursor:
                pointer;

            font-weight:
                700;

        }

        .analises-contador {

            grid-column:
                1 / -1;

            text-align:
                center;

            padding:
                10px;

            font-size:
                12px;

            opacity:
                .6;

        }

        /* =====================================
           CAMPEONATOS
        ===================================== */

        #listaCampeonatos {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        220px,
                        1fr
                    )
                );

            gap:
                12px;

        }

        .campeonato-card {

            display:
                flex;

            align-items:
                center;

            gap:
                12px;

            padding:
                14px;

            border-radius:
                14px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .96
                );

            border:
                1px solid
                rgba(
                    0,
                    0,
                    0,
                    .07
                );

        }

        .campeonato-icone {

            font-size:
                25px;

        }

        .campeonato-info strong {

            display:
                block;

            font-size:
                14px;

        }

        .campeonato-info span {

            display:
                block;

            margin-top:
                3px;

            font-size:
                11px;

            opacity:
                .65;

        }

        /* =====================================
           VAZIOS / LOADING
        ===================================== */

        .empty {

            padding:
                30px;

            text-align:
                center;

            border-radius:
                14px;

            opacity:
                .7;

        }

        .jogos-vazio {

            grid-column:
                1 / -1;

            display:
                flex;

            flex-direction:
                column;

            gap:
                8px;

        }

        .jogos-vazio div {

            font-size:
                35px;

        }

        .loading {

            padding:
                25px;

            text-align:
                center;

            opacity:
                .7;

        }

        @media (
            max-width: 600px
        ) {

            .probabilidades {

                grid-template-columns:
                    1fr;

            }

            .analise-detalhes {

                grid-template-columns:
                    1fr;

            }

            .valuebet-grid {

                grid-template-columns:
                    1fr;

            }

        }

    `;

    document.head.appendChild(
        style
    );

}

// ==================================================
// DISPONIBILIZAR GLOBALMENTE
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
// COMPATIBILIDADE HTML
// ==================================================

window.fecharAnaliseCompleta =
    fecharAnaliseCompleta;

window.mostrarAnaliseCompleta =
    mostrarAnaliseCompleta;

// ==================================================
// LOG FINAL
// ==================================================

console.log(
    "✅ BetVision AI Frontend v7.1 carregado"
);

console.log(
    "⚽ Filtro: somente jogos de hoje"
);

console.log(
    "💎 Value Bets: normalização ativa"
);

console.log(
    "🤖 Análises IA: normalização ativa"
);

console.log(
    "🗄️ API: PostgreSQL / NeonDB"
);

console.log(
    "🔌 WebSocket:",
    CONFIG.WS_URL
);
