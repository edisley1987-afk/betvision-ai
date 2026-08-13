// ==================================================
// BETVISION AI
// public/app.js
// Versão 7.2
// Frontend Dashboard Inteligente
//
// CORREÇÕES:
// 1. Jogos somente de hoje
// 2. Datas com tratamento seguro de timezone
// 3. Value Bets sem undefined
// 4. Value Bets sem duplicações
// 5. Odds/probabilidades normalizadas
// 6. Análises IA robustas
// 7. Dashboard tolerante a diferentes formatos de API
// 8. WebSocket com reconexão controlada
// 9. Atualizações automáticas sem sobreposição
// 10. Modal IA robusto
// 11. Renderização segura contra HTML
// 12. Compatibilidade com APIs atuais
// 13. Estado global centralizado
// 14. CSS frontend injetado uma única vez
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

    LIMITE_VALUE_BETS:
        50,

    LIMITE_CAMPEONATOS:
        100,

    SOMENTE_JOGOS_HOJE:
        true,

    TIMEZONE_API:
        null
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

    websocketTimer:
        null,

    intervaloAtualizacao:
        null,

    intervaloPing:
        null,

    ultimaAtualizacao:
        null,

    carregandoTudo:
        false,

    carregandoDashboard:
        false,

    carregandoAnalises:
        false,

    carregandoJogos:
        false,

    carregandoValueBets:
        false,

    carregandoCampeonatos:
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
            "🤖 BetVision AI Frontend v7.2 iniciado"
        );

        injetarEstilosFrontend();

        iniciarSistema();

    }
);

// ==================================================
// INICIAR SISTEMA
// ==================================================

async function iniciarSistema() {

    inicializarInterface();

    configurarNavegacao();

    iniciarMonitoramento();

    conectarWebSocket();

    await atualizarTudo();

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
                    estado.carregandoTudo
                ) {

                    return;

                }

                const textoOriginal =
                    botaoAtualizar.textContent;

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
                        textoOriginal ||
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
// MONITORAMENTO
// ==================================================

function iniciarMonitoramento() {

    if (
        !estado.intervaloAtualizacao
    ) {

        estado.intervaloAtualizacao =
            setInterval(
                () => {

                    atualizarTudo({
                        silencioso:
                            true
                    });

                },
                CONFIG.INTERVALO_ATUALIZACAO
            );

    }

    if (
        !estado.intervaloPing
    ) {

        estado.intervaloPing =
            setInterval(
                verificarServidor,
                CONFIG.INTERVALO_PING
            );

    }

}

// ==================================================
// ATUALIZAÇÃO COMPLETA
// ==================================================

async function atualizarTudo(
    opcoes = {}
) {

    if (
        estado.carregandoTudo
    ) {

        return;

    }

    estado.carregandoTudo =
        true;

    console.log(
        "🔄 Atualizando todos os dados..."
    );

    try {

        const resultados =
            await Promise.allSettled(
                [

                    carregarDashboard(),

                    carregarJogos(),

                    carregarCampeonatos(),

                    carregarValueBets(),

                    carregarAnalisesIA()

                ]
            );

        const houveErro =
            resultados.some(
                resultado =>
                    resultado.status ===
                    "rejected"
            );

        estado.ultimaAtualizacao =
            new Date();

        atualizarElemento(
            "ultimaAtualizacao",
            formatarData(
                estado.ultimaAtualizacao
            )
        );

        if (
            !opcoes.silencioso
        ) {

            mostrarToast(
                houveErro
                    ? "⚠️ Alguns dados não puderam ser atualizados"
                    : "✅ Dados atualizados"
            );

        }

    }

    catch (erro) {

        console.error(
            "❌ Erro atualização completa:",
            erro
        );

    }

    finally {

        estado.carregandoTudo =
            false;

    }

}

// ==================================================
// DASHBOARD
// ==================================================

async function carregarDashboard() {

    if (
        estado.carregandoDashboard
    ) {

        return;

    }

    estado.carregandoDashboard =
        true;

    try {

        const dados =
            await requisicaoJSON(
                "/api/dashboard"
            );

        console.log(
            "📊 Dashboard:",
            dados
        );

        atualizarDashboard(
            dados
        );

        atualizarStatus(
            true
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

    finally {

        estado.carregandoDashboard =
            false;

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

    const origem =
        dados.dashboard &&
        typeof dados.dashboard === "object"
            ? dados.dashboard
            : dados;

    const jogos =
        obterNumeroFlexivel(
            origem,
            [
                "jogosHoje",
                "jogos_hoje",
                "jogos",
                "totalJogos",
                "total_jogos"
            ]
        );

    const campeonatos =
        obterNumeroFlexivel(
            origem,
            [
                "campeonatos",
                "totalCampeonatos",
                "total_campeonatos"
            ]
        );

    const analises =
        obterNumeroFlexivel(
            origem,
            [
                "analisesIA",
                "analises_ia",
                "analises",
                "totalAnalises",
                "total_analises"
            ]
        );

    const valueBets =
        obterNumeroFlexivel(
            origem,
            [
                "valueBets",
                "value_bets",
                "valuebets",
                "totalValueBets",
                "total_value_bets"
            ]
        );

    const roi =
        obterNumeroFlexivel(
            origem,
            [
                "roi",
                "ROI",
                "retorno"
            ]
        );

    const precisao =
        obterNumeroFlexivel(
            origem,
            [
                "precisao",
                "precisão",
                "accuracy",
                "taxaPrecisao"
            ]
        );

    estado.dados.jogosHoje =
        jogos;

    estado.dados.campeonatos =
        campeonatos;

    estado.dados.analisesIA =
        analises;

    estado.dados.valueBets =
        valueBets;

    estado.dados.roi =
        roi;

    estado.dados.precisao =
        precisao;

    atualizarContadorJogos(
        jogos
    );

    atualizarElemento(
        "campeonatos",
        formatarNumero(
            campeonatos
        )
    );

    atualizarElemento(
        "analisesIA",
        formatarNumero(
            analises
        )
    );

    atualizarElemento(
        "valueBets",
        formatarNumero(
            valueBets
        )
    );

    atualizarElemento(
        "roi",
        formatarPercentual(
            roi
        )
    );

    atualizarElemento(
        "precisao",
        formatarPercentual(
            precisao
        )
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

        const dados =
            await requisicaoJSON(
                "/api/jogos"
            );

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
            jogos
                .filter(
                    jogo =>
                        jogo &&
                        typeof jogo ===
                        "object"
                )
                .slice(
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

            if (
                !data
            ) {

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
        typeof jogo !== "object"
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
// DATA DA ANÁLISE
// ==================================================

function obterDataAnalise(
    analise
) {

    if (
        !analise ||
        typeof analise !== "object"
    ) {

        return null;

    }

    return primeiroValor(
        analise,
        [
            "criado_em",
            "criadoEm",
            "created_at",
            "createdAt",
            "data_criacao",
            "dataCriacao",
            "data",
            "date",
            "datetime"
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

        ].join(
            "-"
        );

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

    if (
        iso
    ) {

        return `${iso[1]}-${iso[2]}-${iso[3]}`;

    }

    // DD/MM/YYYY
    const br =
        texto.match(
            /^(\d{2})\/(\d{2})\/(\d{4})/
        );

    if (
        br
    ) {

        return `${br[3]}-${br[2]}-${br[1]}`;

    }

    // YYYY/MM/DD
    const slashIso =
        texto.match(
            /^(\d{4})\/(\d{2})\/(\d{2})/
        );

    if (
        slashIso
    ) {

        return `${slashIso[1]}-${slashIso[2]}-${slashIso[3]}`;

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

    if (
        !area
    ) {

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
                        "competição",
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

    if (
        !valor
    ) {

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

    if (
        match
    ) {

        return `${match[1]}:${match[2]}`;

    }

    const matchBR =
        texto.match(
            /(\d{2}):(\d{2})/
        );

    if (
        matchBR
    ) {

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

    estado.dados.jogosHoje =
        Number(
            quantidade
        ) || 0;

    atualizarElemento(
        "jogosHoje",
        formatarNumero(
            estado.dados.jogosHoje
        )
    );

}

// ==================================================
// CAMPEONATOS
// ==================================================

async function carregarCampeonatos() {

    if (
        estado.carregandoCampeonatos
    ) {

        return;

    }

    estado.carregandoCampeonatos =
        true;

    try {

        const dados =
            await requisicaoJSON(
                "/api/campeonatos"
            );

        const lista =
            extrairLista(
                dados,
                [
                    "campeonatos",
                    "competicoes",
                    "competições",
                    "dados",
                    "data",
                    "resultados",
                    "results",
                    "items"
                ]
            );

        estado.campeonatos =
            lista
                .filter(
                    item =>
                        item &&
                        typeof item ===
                        "object"
                )
                .slice(
                    0,
                    CONFIG.LIMITE_CAMPEONATOS
                );

        renderizarCampeonatos(
            estado.campeonatos
        );

        estado.dados.campeonatos =
            estado.campeonatos.length;

        atualizarElemento(
            "campeonatos",
            formatarNumero(
                estado.campeonatos.length
            )
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro campeonatos:",
            erro
        );

        estado.campeonatos =
            [];

        renderizarCampeonatos(
            []
        );

    }

    finally {

        estado.carregandoCampeonatos =
            false;

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

    if (
        !area
    ) {

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

                🏆

                <strong>
                    Nenhum campeonato disponível
                </strong>

            </div>

        `;

        return;

    }

    campeonatos.forEach(
        campeonato => {

            const nome =
                primeiroValor(
                    campeonato,
                    [
                        "nome",
                        "name",
                        "campeonato",
                        "competicao",
                        "competição",
                        "competition",
                        "competition_name"
                    ],
                    "Campeonato"
                );

            const quantidade =
                obterNumeroFlexivel(
                    campeonato,
                    [
                        "jogos",
                        "total_jogos",
                        "totalJogos",
                        "quantidade",
                        "count"
                    ]
                );

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "campeonato-card";

            div.innerHTML = `

                <div class="campeonato-icone">
                    🏆
                </div>

                <div class="campeonato-info">

                    <strong>
                        ${escaparHTML(nome)}
                    </strong>

                    <span>
                        ${formatarNumero(
                            quantidade
                        )}
                        ${quantidade === 1
                            ? "jogo"
                            : "jogos"}
                    </span>

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

        const dados =
            await requisicaoJSON(
                "/api/value-bets"
            );

        console.log(
            "💎 Resposta Value Bets:",
            dados
        );

        let lista =
            extrairLista(
                dados,
                [
                    "valueBets",
                    "value_bets",
                    "valuebets",
                    "apostas",
                    "apostas_value",
                    "dados",
                    "data",
                    "resultados",
                    "results",
                    "items"
                ]
            );

        lista =
            lista
                .filter(
                    item =>
                        item &&
                        typeof item ===
                        "object"
                )
                .map(
                    normalizarValueBet
                );

        estado.valueBets =
            removerDuplicados(
                lista,
                obterChaveValueBet
            )
            .slice(
                0,
                CONFIG.LIMITE_VALUE_BETS
            );

        renderizarValueBets(
            estado.valueBets
        );

        estado.dados.valueBets =
            estado.valueBets.length;

        atualizarElemento(
            "valueBets",
            formatarNumero(
                estado.valueBets.length
            )
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

    const chave =
        obterChaveValueBet(
            normalizada
        );

    const existe =
        estado.valueBets.some(
            item =>
                obterChaveValueBet(
                    item
                ) ===
                chave
        );

    if (
        existe
    ) {

        const indice =
            estado.valueBets.findIndex(
                item =>
                    obterChaveValueBet(
                        item
                    ) ===
                    chave
            );

        if (
            indice >= 0
        ) {

            estado.valueBets.splice(
                indice,
                1
            );

        }

    }

    estado.valueBets.unshift(
        normalizada
    );

    estado.valueBets =
        estado.valueBets.slice(
            0,
            CONFIG.LIMITE_VALUE_BETS
        );

    estado.dados.valueBets =
        estado.valueBets.length;

    renderizarValueBets(
        estado.valueBets
    );

    atualizarElemento(
        "valueBets",
        formatarNumero(
            estado.valueBets.length
        )
    );

}

// ==================================================
// NORMALIZAR VALUE BET
// ==================================================

function normalizarValueBet(
    aposta
) {

    if (
        !aposta ||
        typeof aposta !==
        "object"
    ) {

        return {

            jogo:
                "Jogo não informado",

            mercado:
                "Mercado não informado",

            odd:
                0,

            probabilidade:
                0,

            oddJusta:
                0,

            edge:
                0,

            valor:
                0,

            status:
                "INDEFINIDO",

            criado_em:
                "",

            id:
                null
        };

    }

    const jogo =
        primeiroValor(
            aposta,
            [
                "jogo",
                "match",
                "nome_jogo",
                "nomeJogo"
            ],
            ""
        );

    let jogoNormalizado =
        jogo;

    if (
        jogo &&
        typeof jogo ===
        "object"
    ) {

        jogoNormalizado =
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
            ""
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
            ""
        );

    if (
        !jogoNormalizado &&
        casa &&
        fora
    ) {

        jogoNormalizado =
            `${casa} x ${fora}`;

    }

    const mercado =
        primeiroValor(
            aposta,
            [
                "mercado",
                "market",
                "tipo_mercado",
                "tipoMercado",
                "bet_type",
                "betType"
            ],
            "Mercado não informado"
        );

    const odd =
        obterNumeroFlexivel(
            aposta,
            [
                "odd",
                "odds",
                "cotacao",
                "cotação",
                "price"
            ]
        );

    const probabilidade =
        normalizarPercentual(
            obterNumeroFlexivel(
                aposta,
                [
                    "probabilidade",
                    "probabilidade_aposta",
                    "probabilidadeAposta",
                    "probability",
                    "chance"
                ]
            )
        );

    const oddJusta =
        obterNumeroFlexivel(
            aposta,
            [
                "odd_justa",
                "oddJusta",
                "fair_odd",
                "fairOdd"
            ]
        );

    const edge =
        obterNumeroFlexivel(
            aposta,
            [
                "edge",
                "valor_edge",
                "value_edge",
                "valueEdge"
            ]
        );

    const valor =
        obterNumeroFlexivel(
            aposta,
            [
                "valor",
                "value",
                "stake"
            ]
        );

    const status =
        primeiroValor(
            aposta,
            [
                "status",
                "situacao",
                "situação"
            ],
            ""
        );

    const criadoEm =
        primeiroValor(
            aposta,
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

    const id =
        primeiroValor(
            aposta,
            [
                "id",
                "api_id",
                "apiId"
            ],
            null
        );

    return {

        ...aposta,

        id:

            id,

        jogo:

            String(
                jogoNormalizado ||
                "Jogo não informado"
            ),

        time_casa:

            String(
                casa || ""
            ),

        time_fora:

            String(
                fora || ""
            ),

        mercado:

            String(
                mercado
            ),

        odd:

            odd,

        probabilidade:

            probabilidade,

        odd_justa:

            oddJusta,

        edge:

            edge,

        valor:

            valor,

        status:

            String(
                status ||
                "INDEFINIDO"
            ),

        criado_em:

            criadoEm

    };

}

// ==================================================
// CHAVE VALUE BET
// ==================================================

function obterChaveValueBet(
    aposta
) {

    if (
        !aposta ||
        typeof aposta !==
        "object"
    ) {

        return "vazio";

    }

    const id =
        primeiroValor(
            aposta,
            [
                "id",
                "api_id",
                "apiId"
            ],
            null
        );

    if (
        id !== null &&
        id !== undefined &&
        id !== ""
    ) {

        return `id:${id}`;

    }

    return [

        String(
            aposta.jogo || ""
        ).toLowerCase(),

        String(
            aposta.mercado || ""
        ).toLowerCase(),

        String(
            aposta.odd || ""
        ),

        String(
            aposta.criado_em || ""
        )

    ].join(
        "|"
    );

}

// ==================================================
// RENDER VALUE BETS
// ==================================================

function renderizarValueBets(
    apostas
) {

    const area =
        document.getElementById(
            "listaValueBets"
        );

    if (
        !area
    ) {

        return;

    }

    area.innerHTML =
        "";

    if (
        !Array.isArray(apostas) ||
        apostas.length === 0
    ) {

        area.innerHTML = `

            <div class="empty">

                <div>
                    💎
                </div>

                <strong>
                    Nenhuma Value Bet encontrada
                </strong>

                <span>
                    A API ainda não retornou oportunidades de valor.
                </span>

            </div>

        `;

        return;

    }

    apostas.forEach(
        aposta => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "valuebet-card";

            const odd =
                Number(
                    aposta.odd
                ) || 0;

            const probabilidade =
                Number(
                    aposta.probabilidade
                ) || 0;

            const oddJusta =
                Number(
                    aposta.odd_justa
                ) || 0;

            const edge =
                Number(
                    aposta.edge
                ) || 0;

            const criadoEm =
                aposta.criado_em ||
                "";

            card.innerHTML = `

                <div class="valuebet-header">

                    <span class="valuebet-icon">
                        💎
                    </span>

                    <div class="valuebet-jogo">
                        ${escaparHTML(
                            aposta.jogo
                        )}
                    </div>

                </div>

                <div class="valuebet-mercado">

                    🎯
                    ${escaparHTML(
                        aposta.mercado
                    )}

                </div>

                <div class="valuebet-grid">

                    <div class="valuebet-item">

                        <span>
                            Odd
                        </span>

                        <strong>
                            ${formatarOdd(
                                odd
                            )}
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
                            Odd justa
                        </span>

                        <strong>
                            ${formatarOdd(
                                oddJusta
                            )}
                        </strong>

                    </div>

                    <div class="valuebet-item">

                        <span>
                            Edge
                        </span>

                        <strong class="positivo">
                            ${formatarPercentual(
                                edge
                            )}
                        </strong>

                    </div>

                </div>

                <div class="valuebet-footer">

                    <span>
                        ${escaparHTML(
                            String(
                                aposta.status
                            ).toUpperCase()
                        )}
                    </span>

                    ${
                        criadoEm
                            ? `
                                <span>
                                    ${escaparHTML(
                                        formatarData(
                                            criadoEm
                                        )
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

            `;

            area.appendChild(
                card
            );

        }
    );

}

// ==================================================
// ANÁLISES IA
// ==================================================

// ==================================================
// ANÁLISES IA
// SOMENTE ANÁLISES DO DIA ATUAL
// ==================================================

async function carregarAnalisesIA() {

    if (estado.carregandoAnalises) {
        return;
    }

    estado.carregandoAnalises = true;

    const area =
        document.getElementById("listaAnalises");

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
                    cache: "no-store",
                    headers: {
                        "Cache-Control": "no-cache"
                    }
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

        const normalizadas =
            normalizarAnalises(lista);

        // ==========================================
        // SOMENTE DATA DE HOJE
        // ==========================================

        const hoje =
            obterChaveDataHoje();

        const analisesHoje =
            normalizadas.filter(
                analise => {

                    const data =
                        obterDataAnalise(
                            analise
                        );

                    if (!data) {
                        return false;
                    }

                    return (
                        obterChaveData(
                            data
                        ) === hoje
                    );

                }
            );

        estado.analises =
            analisesHoje;

        console.log(
            `📅 Data atual: ${hoje}`
        );

        console.log(
            `🤖 Análises recebidas: ${normalizadas.length}`
        );

        console.log(
            `🤖 Análises de hoje: ${analisesHoje.length}`
        );

        renderizarAnalisesIA(
            analisesHoje
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro análises IA:",
            erro
        );

        estado.analises = [];

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
            normalizarAnalise
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
            String(
                jogo
            ),

        time_casa:
            String(
                casa || ""
            ),

        time_fora:
            String(
                fora || ""
            ),

        probabilidade_casa:
            probCasa,

        probabilidade_empate:
            probEmpate,

        probabilidade_fora:
            probFora,

        gols_esperados:
            golsEsperados,

        placar_previsto:
            String(
                placar
            ),

        confianca:
            String(
                confianca
            ),

        algoritmo:
            String(
                algoritmo
            ),

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

    if (
        !area
    ) {

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

    if (
        botao
    ) {

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
                Number(
                    casa
                ) || 0
        },

        {
            nome:
                "Empate",

            valor:
                Number(
                    empate
                ) || 0
        },

        {
            nome:
                "Fora",

            valor:
                Number(
                    fora
                ) || 0
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

    if (
        !modal
    ) {

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
// EXTRAIR LISTA
// ==================================================

function extrairLista(
    dados,
    propriedades = []
) {

    if (
        Array.isArray(
            dados
        )
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

        const ultimaVirgula =
            texto.lastIndexOf(
                ","
            );

        const ultimoPonto =
            texto.lastIndexOf(
                "."
            );

        if (
            ultimaVirgula >
            ultimoPonto
        ) {

            texto =
                texto
                    .replace(
                        /\./g,
                        ""
                    )
                    .replace(
                        ",",
                        "."
                    );

        }

        else {

            texto =
                texto.replace(
                    /,/g,
                    ""
                );

        }

    }

    else if (
        texto.includes(",")
    ) {

        texto =
            texto.replace(
                ",",
                "."
            );

    }

    return Number(
        texto
    );

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

    let resultado =
        numero;

    if (
        resultado > 0 &&
        resultado <= 1
    ) {

        resultado *=
            100;

    }

    return Math.max(
        0,
        Math.min(
            100,
            resultado
        )
    );

}

// ==================================================
// OBTENER JOGO ANÁLISE
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

    if (
        data
    ) {

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
        valor ===
        true ||
        valor ===
        1
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
            "positivo" ||

            texto ===
            "positive"

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

        if (
            !data
        ) {

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

    if (
        !elemento
    ) {

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

let toastTimer =
    null;

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

    if (
        toastTimer
    ) {

        clearTimeout(
            toastTimer
        );

    }

    toastTimer =
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

    if (
        !elemento
    ) {

        return;

    }

    elemento.textContent =
        valor;

}

// ==================================================
// STATUS
// ==================================================

function atualizarStatus(
    online
) {

    const status =
        Boolean(
            online
        );

    atualizarElemento(
        "apiStatus",
        status
            ? "Online"
            : "Offline"
    );

    const indicadores =
        document.querySelectorAll(
            ".status-indicator, .api-indicator, [data-api-status]"
        );

    indicadores.forEach(
        elemento => {

            elemento.classList.toggle(
                "online",
                status
            );

            elemento.classList.toggle(
                "offline",
                !status
            );

        }
    );

}

// ==================================================
// REQUISIÇÃO JSON
// ==================================================

async function requisicaoJSON(
    endpoint,
    opcoes = {}
) {

    const resposta =
        await fetch(
            `${CONFIG.API_URL}${endpoint}`,
            {

                cache:
                    "no-store",

                headers: {

                    Accept:
                        "application/json",

                    ...(opcoes.headers ||
                        {})

                },

                ...opcoes

            }
        );

    if (
        !resposta.ok
    ) {

        throw new Error(
            `HTTP ${resposta.status} em ${endpoint}`
        );

    }

    const texto =
        await resposta.text();

    if (
        !texto.trim()
    ) {

        return {};

    }

    try {

        return JSON.parse(
            texto
        );

    }

    catch (
        erro
    ) {

        throw new Error(
            `Resposta inválida da API em ${endpoint}: ${erro.message}`
        );

    }

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
                        "no-store",

                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        atualizarStatus(
            resposta.ok
        );

    }

    catch (
        erro
    ) {

        console.error(
            "❌ Servidor offline:",
            erro
        );

        atualizarStatus(
            false
        );

    }

}

// ==================================================
// WEBSOCKET
// ==================================================

function conectarWebSocket() {

    if (
        estado.websocketReconectando
    ) {

        return;

    }

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

    estado.websocketReconectando =
        true;

    try {

        console.log(
            "🔌 Conectando WebSocket:",
            CONFIG.WS_URL
        );

        const socket =
            new WebSocket(
                CONFIG.WS_URL
            );

        estado.websocket =
            socket;

        socket.addEventListener(
            "open",
            () => {

                estado.websocketReconectando =
                    false;

                estado.conectado =
                    true;

                console.log(
                    "🔌 WebSocket conectado"
                );

                atualizarStatus(
                    true
                );

            }
        );

        socket.addEventListener(
            "message",
            evento => {

                processarMensagemWebSocket(
                    evento.data
                );

            }
        );

        socket.addEventListener(
            "error",
            erro => {

                console.error(
                    "❌ WebSocket:",
                    erro
                );

            }
        );

        socket.addEventListener(
            "close",
            () => {

                estado.conectado =
                    false;

                estado.websocketReconectando =
                    false;

                console.warn(
                    "🔌 WebSocket desconectado"
                );

                agendarReconexaoWebSocket();

            }
        );

    }

    catch (
        erro
    ) {

        estado.websocketReconectando =
            false;

        console.error(
            "❌ Erro WebSocket:",
            erro
        );

        agendarReconexaoWebSocket();

    }

}

// ==================================================
// RECONEXÃO WEBSOCKET
// ==================================================

function agendarReconexaoWebSocket() {

    if (
        estado.websocketTimer
    ) {

        return;

    }

    estado.websocketTimer =
        setTimeout(
            () => {

                estado.websocketTimer =
                    null;

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

    let dados =
        mensagem;

    if (
        typeof mensagem ===
        "string"
    ) {

        try {

            dados =
                JSON.parse(
                    mensagem
                );

        }

        catch {

            console.warn(
                "⚠️ Mensagem WebSocket não JSON:",
                mensagem
            );

            return;

        }

    }

    if (
        !dados ||
        typeof dados !==
        "object"
    ) {

        return;

    }

    console.log(
        "📡 WebSocket:",
        dados
    );

    const tipo =
        String(
            primeiroValor(
                dados,
                [
                    "tipo",
                    "type",
                    "evento",
                    "event",
                    "acao",
                    "action"
                ],
                ""
            )
        ).toLowerCase();

    const payload =
        dados.data ??
        dados.dados ??
        dados.payload ??
        dados;

    if (
        tipo.includes(
            "value"
        )
    ) {

        if (
            payload &&
            typeof payload ===
            "object"
        ) {

            adicionarValueBet(
                payload
            );

        }

        return;

    }

    if (
        tipo.includes(
            "anal"
        )
    ) {

        if (
            payload &&
            typeof payload ===
            "object"
        ) {

            const analise =
                normalizarAnalise(
                    payload
                );

            const chave =
                obterChaveAnalise(
                    analise
                );

            const indice =
                estado.analises.findIndex(
                    item =>
                        obterChaveAnalise(
                            item
                        ) ===
                        chave
                );

            if (
                indice >= 0
            ) {

                estado.analises[
                    indice
                ] =
                    analise;

            }

            else {

                estado.analises.unshift(
                    analise
                );

            }

            estado.analises =
                removerDuplicados(
                    estado.analises,
                    obterChaveAnalise
                )
                .slice(
                    0,
                    CONFIG.LIMITE_ANALISES
                );

            renderizarAnalisesIA(
                estado.analises
            );

            atualizarElemento(
                "analisesIA",
                formatarNumero(
                    estado.analises.length
                )
            );

        }

        return;

    }

    // Eventos gerais de atualização
    if (
        tipo.includes(
            "jogo"
        ) ||
        tipo.includes(
            "match"
        )
    ) {

        carregarJogos();

        return;

    }

    if (
        tipo.includes(
            "dashboard"
        ) ||
        tipo.includes(
            "atual"
        ) ||
        tipo.includes(
            "update"
        ) ||
        tipo.includes(
            "refresh"
        )
    ) {

        atualizarTudo({
            silencioso:
                true
        });

        return;

    }

}

// ==================================================
// ENVIAR WEBSOCKET
// ==================================================

function enviarWebSocket(
    dados
) {

    if (
        !estado.websocket ||
        estado.websocket.readyState !==
        WebSocket.OPEN
    ) {

        return false;

    }

    try {

        const mensagem =
            typeof dados ===
            "string"
                ? dados
                : JSON.stringify(
                    dados
                );

        estado.websocket.send(
            mensagem
        );

        return true;

    }

    catch (
        erro
    ) {

        console.error(
            "❌ Erro envio WebSocket:",
            erro
        );

        return false;

    }

}

// ==================================================
// CHAVE ANÁLISE
// ==================================================

function obterChaveAnalise(
    analise
) {

    if (
        !analise ||
        typeof analise !==
        "object"
    ) {

        return "analise-vazia";

    }

    const id =
        primeiroValor(
            analise,
            [
                "id",
                "api_id",
                "apiId"
            ],
            null
        );

    if (
        id !== null &&
        id !== undefined &&
        id !== ""
    ) {

        return `id:${id}`;

    }

    return [

        String(
            analise.jogo || ""
        ).toLowerCase(),

        String(
            analise.criado_em || ""
        ),

        String(
            analise.placar_previsto || ""
        )

    ].join(
        "|"
    );

}

// ==================================================
// REMOVER DUPLICADOS
// ==================================================

function removerDuplicados(
    lista,
    obterChave
) {

    if (
        !Array.isArray(
            lista
        )
    ) {

        return [];

    }

    const mapa =
        new Map();

    lista.forEach(
        item => {

            const chave =
                obterChave(
                    item
                );

            if (
                !mapa.has(
                    chave
                )
            ) {

                mapa.set(
                    chave,
                    item
                );

            }

        }
    );

    return [
        ...mapa.values()
    ];

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
// ==================================================

function injetarEstilosFrontend() {

    if (
        document.getElementById(
            "betvision-v72-style"
        )
    ) {

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "betvision-v72-style";

    style.textContent = `

        /* =====================================
           VALUE BETS
        ===================================== */

        #listaValueBets {

            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        280px,
                        1fr
                    )
                );

            gap: 16px;

        }

        .valuebet-card {

            padding: 18px;

            border-radius: 16px;

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

            transition:
                transform .2s ease,
                box-shadow .2s ease;

        }

        .valuebet-card:hover {

            transform:
                translateY(-3px);

            box-shadow:
                0 12px 30px
                rgba(
                    0,
                    0,
                    0,
                    .13
                );

        }

        .valuebet-header {

            display:
                flex;

            align-items:
                center;

            gap: 10px;

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

            gap:
                10px;

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
                1fr auto 1fr;

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

        /* =====================================
           MODAL
        ===================================== */

        #modalIA.ativo {

            display:
                flex;

        }

        .analise-completa {

            width:
                100%;

        }

        .modal-probabilidades {

            display:
                grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap:
                10px;

            margin:
                15px 0;

        }

        .modal-probabilidades > div {

            padding:
                12px;

            border-radius:
                10px;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .035
                );

            text-align:
                center;

        }

        .modal-probabilidades strong {

            display:
                block;

            margin-top:
                5px;

        }

        /* =====================================
           RESPONSIVO
        ===================================== */

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

            .modal-probabilidades {

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

    adicionarValueBet,

    normalizarValueBet,

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

    normalizarAnalise,

    estado

};

// ==================================================
// COMPATIBILIDADE HTML
// ==================================================

window.fecharAnaliseCompleta =
    fecharAnaliseCompleta;

window.mostrarAnaliseCompleta =
    mostrarAnaliseCompleta;

window.fecharModalIA =
    fecharModalIA;

window.atualizarTudo =
    atualizarTudo;

// ==================================================
// LIMPEZA AO SAIR
// ==================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            estado.intervaloAtualizacao
        ) {

            clearInterval(
                estado.intervaloAtualizacao
            );

        }

        if (
            estado.intervaloPing
        ) {

            clearInterval(
                estado.intervaloPing
            );

        }

        if (
            estado.websocketTimer
        ) {

            clearTimeout(
                estado.websocketTimer
            );

        }

        if (
            estado.websocket
        ) {

            try {

                estado.websocket.close();

            }

            catch {

                // Ignorar erro de encerramento

            }

        }

    }
);

// ==================================================
// LOG FINAL
// ==================================================

console.log(
    "✅ BetVision AI Frontend v7.2 carregado"
);

console.log(
    "⚽ Filtro: somente jogos de hoje"
);

console.log(
    "💎 Value Bets: normalização + deduplicação ativa"
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
