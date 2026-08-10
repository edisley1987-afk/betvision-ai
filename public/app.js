// ==================================================
// BETVISION AI
// public/app.js
// Versão 5.0
// Frontend Dashboard Inteligente
// Compatível com PostgreSQL NeonDB
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
        5000

};


// ==================================================
// ESTADO GLOBAL
// ==================================================

const estado = {

    websocket: null,

    conectado: false,

    websocketReconectando: false,

    ultimaAtualizacao: null,

    dados: {

        jogosHoje: 0,

        campeonatos: 0,

        analisesIA: 0,

        valueBets: 0,

        roi: 0,

        precisao: 0

    }

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

    carregarDashboard();

    carregarJogos();

    carregarCampeonatos();

    carregarValueBets();

    carregarAnalisesIA();

    conectarWebSocket();

    iniciarAtualizacaoAutomatica();

}


// ==================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==================================================

function iniciarAtualizacaoAutomatica() {

    setInterval(
        () => {

            carregarDashboard();

        },
        CONFIG.INTERVALO_ATUALIZACAO
    );

}


// ==================================================
// BUSCAR DASHBOARD
// ==================================================

async function carregarDashboard() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/dashboard`,
                {
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Falha dashboard HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        atualizarDashboard(
            dados
        );

    }

    catch (erro) {

        console.error(
            "Erro dashboard:",
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
            dados.jogosHoje ?? 0
        )
    );


    atualizarElemento(
        "campeonatos",
        formatarNumero(
            dados.campeonatos ?? 0
        )
    );


    atualizarElemento(
        "analisesIA",
        formatarNumero(
            dados.analisesIA ?? 0
        )
    );


    atualizarElemento(
        "valueBets",
        formatarNumero(
            dados.valueBets ?? 0
        )
    );


    atualizarElemento(
        "roi",
        `${dados.roi ?? 0}%`
    );


    atualizarElemento(
        "precisaoIA",
        `${dados.precisao ?? 0}%`
    );


    atualizarElemento(
        "precisao",
        `${dados.precisao ?? 0}%`
    );


    atualizarUltimaAtualizacao();

    atualizarStatus(true);

}


// ==================================================
// ATUALIZAR ELEMENTO HTML
// ==================================================

function atualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        return;

    }


    elemento.textContent =
        valor ?? "";

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
// STATUS DO SISTEMA
// ==================================================

function atualizarStatus(
    online
) {

    const elemento =
        document.getElementById(
            "statusSistema"
        );


    if (!elemento) {

        return;

    }


    if (online) {

        elemento.textContent =
            "🟢 Sistema Online";

        elemento.className =
            "online";

    }

    else {

        elemento.textContent =
            "🔴 Sem conexão";

        elemento.className =
            "offline";

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


                atualizarStatus(
                    true
                );

            };


        estado.websocket.onmessage =
            (evento) => {

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
                        "Erro mensagem WS:",
                        erro
                    );

                }

            };


        estado.websocket.onerror =
            (erro) => {

                console.error(
                    "Erro WebSocket:",
                    erro
                );

                estado.conectado =
                    false;

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


                atualizarStatus(
                    false
                );


                agendarReconexaoWebSocket();

            };

    }

    catch (erro) {

        console.error(
            "Falha WebSocket:",
            erro
        );


        estado.conectado =
            false;


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
// PROCESSAR EVENTOS WEBSOCKET
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
            mensagem.online === true
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
// CARREGAR CAMPEONATOS
// ==================================================

async function carregarCampeonatos() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/campeonatos`,
                {
                    cache: "no-store"
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
                    "data",
                    "resultados"
                ]
            );


        renderizarCampeonatos(
            lista
        );

    }

    catch (erro) {

        console.error(
            "Erro campeonatos:",
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


    area.innerHTML = "";


    if (
        !Array.isArray(campeonatos) ||
        campeonatos.length === 0
    ) {

        area.innerHTML =
            `
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
                "Campeonato";


            const pais =
                campeonato.pais ??
                campeonato.country ??
                "";


            div.innerHTML =
                `
                <strong>
                    ${escaparHTML(nome)}
                </strong>

                <span>
                    ${escaparHTML(pais)}
                </span>
                `;


            area.appendChild(
                div
            );

        }
    );

}


// ==================================================
// CARREGAR VALUE BETS
// ==================================================

async function carregarValueBets() {

    try {

        console.log(
            "💎 Buscando Value Bets..."
        );


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/valuebets`,
                {
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro Value Bets HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        // ==================================================
        // CORREÇÃO PRINCIPAL
        //
        // O endpoint retorna:
        //
        // {
        //     sucesso: true,
        //     total: 0,
        //     valuebets: []
        // }
        //
        // Portanto precisamos extrair dados.valuebets.
        // ==================================================

        const valuebets =
            extrairListaValueBets(
                dados
            );


        console.log(
            `💎 ${valuebets.length} Value Bets encontradas`
        );


        renderizarValueBets(
            valuebets
        );

    }

    catch (erro) {

        console.error(
            "Erro Value Bets:",
            erro
        );


        renderizarValueBets(
            []
        );

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


    area.innerHTML = "";


    if (
        !Array.isArray(valuebets) ||
        valuebets.length === 0
    ) {

        area.innerHTML =
            `
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


            const timeCasa =
                aposta.timeCasa ??
                aposta.time_casa ??
                extrairTimeCasa(
                    aposta.jogo
                ) ??
                "Casa";


            const timeFora =
                aposta.timeFora ??
                aposta.time_fora ??
                extrairTimeFora(
                    aposta.jogo
                ) ??
                "Fora";


            const mercado =
                aposta.mercado ??
                "Não informado";


            const selecao =
                aposta.selecao ??
                "";


            const odd =
                aposta.odd ??
                aposta.oddMercado ??
                aposta.odd_mercado ??
                0;


            const probabilidade =
                aposta.probabilidade ??
                0;


            const edge =
                aposta.edge ??
                0;


            const roi =
                aposta.roi ??
                0;


            const kelly =
                aposta.kelly ??
                0;


            const classificacao =
                aposta.classificacao ??
                "Value Bet";


            const bookmaker =
                aposta.bookmaker ??
                aposta.casa_aposta ??
                "Não informado";


            const dataJogo =
                aposta.data_jogo ??
                aposta.dataJogo ??
                "";


            card.innerHTML =
                `

                <div class="titulo">

                    ${escaparHTML(
                        timeCasa
                    )}

                    x

                    ${escaparHTML(
                        timeFora
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


                ${
                    selecao
                        ? `
                        <div>
                            Seleção:
                            <strong>
                                ${escaparHTML(
                                    selecao
                                )}
                            </strong>
                        </div>
                        `
                        : ""
                }


                <div>

                    Odd:

                    <strong>
                        ${formatarOdd(
                            odd
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


                <div>

                    Kelly:

                    <strong>
                        ${formatarPercentual(
                            kelly
                        )}
                    </strong>

                </div>


                <div>

                    Casa de aposta:

                    <strong>
                        ${escaparHTML(
                            bookmaker
                        )}
                    </strong>

                </div>


                <div class="valor">

                    ${escaparHTML(
                        classificacao
                    )}

                </div>


                ${
                    dataJogo
                        ? `
                        <div>
                            📅
                            ${escaparHTML(
                                formatarData(
                                    dataJogo
                                )
                            )}
                        </div>
                        `
                        : ""
                }

                `;


            area.appendChild(
                card
            );

        }
    );

}


// ==================================================
// ADICIONAR VALUE BET EM TEMPO REAL
// ==================================================

function adicionarValueBet(
    aposta
) {

    if (
        !aposta ||
        typeof aposta !== "object"
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

        area.innerHTML = "";

    }


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "valuebet-card novo";


    const timeCasa =
        aposta.timeCasa ??
        aposta.time_casa ??
        extrairTimeCasa(
            aposta.jogo
        ) ??
        "Casa";


    const timeFora =
        aposta.timeFora ??
        aposta.time_fora ??
        extrairTimeFora(
            aposta.jogo
        ) ??
        "Fora";


    const odd =
        aposta.odd ??
        aposta.oddMercado ??
        aposta.odd_mercado ??
        0;


    card.innerHTML =
        `

        <strong>
            🆕 Nova Value Bet
        </strong>

        <br>

        ${escaparHTML(
            timeCasa
        )}

        x

        ${escaparHTML(
            timeFora
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
// CARREGAR JOGOS
// ==================================================

async function carregarJogos() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/jogos`,
                {
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro jogos HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        const jogos =
            extrairLista(
                dados,
                [
                    "jogos",
                    "data",
                    "resultados"
                ]
            );


        renderizarJogos(
            jogos
        );

    }

    catch (erro) {

        console.error(
            "Erro jogos:",
            erro
        );

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


    area.innerHTML = "";


    if (
        !Array.isArray(jogos) ||
        jogos.length === 0
    ) {

        area.innerHTML =
            `
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
                "Casa";


            const fora =
                jogo.fora ??
                jogo.time_fora ??
                jogo.timeFora ??
                "Fora";


            const campeonato =
                jogo.campeonato ??
                jogo.nome_campeonato ??
                "";


            const data =
                jogo.data ??
                jogo.data_jogo ??
                jogo.dataJogo ??
                "";


            div.innerHTML =
                `

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
// CARREGAR ANÁLISES IA
// ==================================================

async function carregarAnalisesIA() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/analises`,
                {
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro análises IA HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        const analises =
            extrairLista(
                dados,
                [
                    "analises",
                    "data",
                    "resultados"
                ]
            );


        renderizarAnalisesIA(
            analises
        );

    }

    catch (erro) {

        console.error(
            "Erro análise IA:",
            erro
        );

    }

}


// ==================================================
// RENDER ANÁLISES IA
// ==================================================

function renderizarAnalisesIA(
    analises
) {

    const area =
        document.getElementById(
            "listaAnalisesIA"
        );


    if (!area) {

        return;

    }


    area.innerHTML = "";


    if (
        !Array.isArray(analises) ||
        analises.length === 0
    ) {

        area.innerHTML =
            `
            <div class="empty">

                🤖 Nenhuma análise disponível

            </div>
            `;

        return;

    }


    analises.forEach(
        analise => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "analise-card";


            const jogo =
                analise.jogo ??
                `${analise.time_casa ?? ""} x ${analise.time_fora ?? ""}`;


            const probabilidade =
                analise.probabilidade ??
                0;


            const previsao =
                analise.previsao ??
                "Não disponível";


            const confianca =
                analise.confianca ??
                analise.confianca_ia ??
                0;


            card.innerHTML =
                `

                <h3>

                    ${escaparHTML(
                        jogo
                    )}

                </h3>


                <p>

                    Probabilidade:

                    <strong>

                        ${formatarPercentual(
                            probabilidade
                        )}

                    </strong>

                </p>


                <p>

                    Previsão:

                    ${escaparHTML(
                        previsao
                    )}

                </p>


                <p>

                    Confiança IA:

                    <strong>

                        ${formatarPercentual(
                            confianca
                        )}

                    </strong>

                </p>

                `;


            area.appendChild(
                card
            );

        }
    );

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
        typeof dados === "object"
    ) {

        for (
            const propriedade of propriedades
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
// EXTRAIR TIME CASA
// ==================================================

function extrairTimeCasa(
    jogo
) {

    if (
        !jogo ||
        typeof jogo !== "string"
    ) {

        return null;

    }


    const partes =
        jogo.split(
            " x "
        );


    return partes[0] ??
        null;

}


// ==================================================
// EXTRAIR TIME FORA
// ==================================================

function extrairTimeFora(
    jogo
) {

    if (
        !jogo ||
        typeof jogo !== "string"
    ) {

        return null;

    }


    const partes =
        jogo.split(
            " x "
        );


    return partes[1] ??
        null;

}


// ==================================================
// FORMATAR NÚMEROS
// ==================================================

function formatarNumero(
    numero
) {

    if (
        numero === undefined ||
        numero === null ||
        numero === ""
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

        return "0%";

    }


    return `${numero.toFixed(2)}%`;

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
                : new Date(data);


        if (
            Number.isNaN(
                dataObj.getTime()
            )
        ) {

            return "-";

        }


        return dataObj.toLocaleString(
            "pt-BR"
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
        valor === undefined ||
        valor === null
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
// MOSTRAR MENSAGEM
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


    elemento.innerHTML =
        `
        <div class="alerta">

            ${escaparHTML(
                mensagem
            )}

        </div>
        `;

}


// ==================================================
// VERIFICAR STATUS API
// ==================================================

async function verificarServidor() {

    try {

        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/ping`,
                {
                    cache: "no-store"
                }
            );


        if (
            resposta.ok
        ) {

            atualizarStatus(
                true
            );

        }

        else {

            atualizarStatus(
                false
            );

        }

    }

    catch {

        atualizarStatus(
            false
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

    await Promise.allSettled([

        carregarDashboard(),

        carregarJogos(),

        carregarCampeonatos(),

        carregarValueBets(),

        carregarAnalisesIA()

    ]);

}


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

    estado

};


// ==================================================
// FIM
// ==================================================

console.log(
    "✅ BetVision AI Frontend carregado"
);
