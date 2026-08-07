// ==================================================
// BetVision AI
// public/app.js
// Fase 1 - Parte 1
// Frontend Dashboard Inteligente
// ==================================================

"use strict";


// ==================================================
// CONFIGURAÇÃO DA API
// ==================================================

const CONFIG = {

    API_URL: window.location.origin,

    WS_URL:
        window.location.protocol === "https:"
            ? `wss://${window.location.host}`
            : `ws://${window.location.host}`,

    INTERVALO_ATUALIZACAO: 15000

};


// ==================================================
// ESTADO GLOBAL
// ==================================================

const estado = {

    websocket: null,

    conectado: false,

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

function iniciarSistema(){


    carregarDashboard();


    carregarCampeonatos();


    carregarValueBets();


    conectarWebSocket();


    iniciarAtualizacaoAutomatica();


}



// ==================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==================================================

function iniciarAtualizacaoAutomatica(){


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

async function carregarDashboard(){


    try{


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/dashboard`
            );


        if(!resposta.ok){

            throw new Error(
                "Falha ao buscar dashboard"
            );

        }


        const dados =
            await resposta.json();



        atualizarDashboard(
            dados
        );



    }
    catch(erro){


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
){


    estado.dados =
        dados;



    estado.ultimaAtualizacao =
        new Date();



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
        "roi",
        `${dados.roi ?? 0}%`
    );


    atualizarElemento(
        "precisaoIA",
        `${dados.precisao ?? 0}%`
    );



    atualizarUltimaAtualizacao();



    atualizarStatus(
        true
    );


}



// ==================================================
// ATUALIZAR ELEMENTOS HTML
// ==================================================

function atualizarElemento(
    id,
    valor
){


    const elemento =
        document.getElementById(id);



    if(elemento){

        elemento.innerHTML =
            valor;

    }


}



// ==================================================
// ÚLTIMA ATUALIZAÇÃO
// ==================================================

function atualizarUltimaAtualizacao(){


    const elemento =
        document.getElementById(
            "ultimaAtualizacao"
        );


    if(
        elemento &&
        estado.ultimaAtualizacao
    ){


        elemento.innerHTML =
            estado.ultimaAtualizacao
            .toLocaleString(
                "pt-BR"
            );


    }


}



// ==================================================
// STATUS SISTEMA
// ==================================================

function atualizarStatus(
    online
){


    const elemento =
        document.getElementById(
            "statusSistema"
        );


    if(!elemento)
        return;



    if(online){


        elemento.innerHTML =
            "🟢 Sistema Online";


        elemento.className =
            "online";


    }
    else{


        elemento.innerHTML =
            "🔴 Sem conexão";


        elemento.className =
            "offline";


    }


}
// ==================================================
// WEBSOCKET TEMPO REAL
// ==================================================

function conectarWebSocket(){


    try{


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


                atualizarStatus(
                    true
                );


            };





        estado.websocket.onmessage =
            (evento) => {


                try{


                    const mensagem =
                        JSON.parse(
                            evento.data
                        );



                    processarMensagemWebSocket(
                        mensagem
                    );



                }
                catch(erro){


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


                atualizarStatus(
                    false
                );



                setTimeout(
                    () => {


                        conectarWebSocket();



                    },
                    5000
                );


            };



    }
    catch(erro){


        console.error(
            "Falha WebSocket:",
            erro
        );


        setTimeout(
            conectarWebSocket,
            5000
        );


    }


}



// ==================================================
// PROCESSAR EVENTOS WEBSOCKET
// ==================================================

function processarMensagemWebSocket(
    mensagem
){


    console.log(
        "📡 Evento recebido:",
        mensagem
    );



    if(
        mensagem.tipo === "dashboard"
    ){


        atualizarDashboard(
            mensagem.dados
        );


    }





    if(
        mensagem.tipo === "status"
    ){


        atualizarStatus(
            mensagem.online
        );


    }





    if(
        mensagem.tipo === "valueBet"
    ){


        adicionarValueBet(
            mensagem.dados
        );


    }





    if(
        mensagem.tipo === "jogoAtualizado"
    ){


        carregarDashboard();


    }


}



// ==================================================
// ENVIO DE MENSAGEM WEBSOCKET
// ==================================================

function enviarWebSocket(
    dados
){


    if(
        estado.websocket &&
        estado.websocket.readyState === WebSocket.OPEN
    ){


        estado.websocket.send(
            JSON.stringify(
                dados
            )
        );


    }


}



// ==================================================
// CARREGAR CAMPEONATOS
// ==================================================

async function carregarCampeonatos(){


    try{


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/campeonatos`
            );



        if(!resposta.ok)
            throw new Error(
                "Erro campeonatos"
            );



        const dados =
            await resposta.json();



        renderizarCampeonatos(
            dados
        );



    }
    catch(erro){


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
){


    const area =
        document.getElementById(
            "listaCampeonatos"
        );



    if(!area)
        return;



    area.innerHTML = "";



    if(
        !campeonatos ||
        campeonatos.length === 0
    ){


        area.innerHTML =
            `
            <p>
            Nenhum campeonato disponível
            </p>
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



            div.innerHTML =
                `
                <strong>
                ${campeonato.nome}
                </strong>

                <span>
                ${campeonato.pais ?? ""}
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

async function carregarValueBets(){


    try{


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/valuebets`
            );



        if(!resposta.ok){

            throw new Error(
                "Erro ao buscar Value Bets"
            );

        }



        const dados =
            await resposta.json();



        renderizarValueBets(
            dados
        );



    }
    catch(erro){


        console.error(
            "Erro Value Bets:",
            erro
        );


        mostrarMensagem(
            "listaValueBets",
            "Nenhuma oportunidade disponível"
        );


    }


}




// ==================================================
// RENDER VALUE BETS
// ==================================================

function renderizarValueBets(
    valuebets
){


    const area =
        document.getElementById(
            "listaValueBets"
        );



    if(!area)
        return;



    area.innerHTML = "";



    if(
        !valuebets ||
        valuebets.length === 0
    ){


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



            card.innerHTML =
            `

            <div class="titulo">

                ${aposta.timeCasa ?? ""}
                x
                ${aposta.timeFora ?? ""}

            </div>


            <div>

                Mercado:
                <strong>
                ${aposta.mercado ?? ""}
                </strong>

            </div>


            <div>

                Odd:
                <strong>
                ${aposta.odd ?? 0}

                </strong>

            </div>


            <div>

                Probabilidade:

                <strong>

                ${aposta.probabilidade ?? 0}%

                </strong>

            </div>


            <div class="valor">

                Valor esperado:
                ${aposta.valor ?? 0}

            </div>


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
){


    const area =
        document.getElementById(
            "listaValueBets"
        );



    if(!area)
        return;



    const card =
        document.createElement(
            "div"
        );



    card.className =
        "valuebet-card novo";



    card.innerHTML =
    `

    <strong>
    🆕 Nova Value Bet
    </strong>

    <br>

    ${aposta.timeCasa}
    x
    ${aposta.timeFora}

    <br>

    Odd:
    ${aposta.odd}

    `;



    area.prepend(
        card
    );


}



// ==================================================
// CARREGAR JOGOS DO DIA
// ==================================================

async function carregarJogos(){


    try{


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/jogos`
            );



        if(!resposta.ok)
            throw new Error(
                "Erro jogos"
            );



        const jogos =
            await resposta.json();



        renderizarJogos(
            jogos
        );


    }
    catch(erro){


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
){


    const area =
        document.getElementById(
            "listaJogos"
        );



    if(!area)
        return;



    area.innerHTML = "";



    if(
        !jogos ||
        jogos.length === 0
    ){


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



            div.innerHTML =
            `

            <h3>

            ${jogo.casa ?? ""}
            x
            ${jogo.fora ?? ""}

            </h3>


            <p>

            🏆
            ${jogo.campeonato ?? ""}

            </p>


            <p>

            📅
            ${jogo.data ?? ""}

            </p>


            `;



            area.appendChild(
                div
            );


        }
    );


}



// ==================================================
// MOSTRAR ERROS / AVISOS
// ==================================================

function mostrarMensagem(
    id,
    mensagem
){


    const elemento =
        document.getElementById(
            id
        );



    if(elemento){


        elemento.innerHTML =
        `

        <div class="alerta">

        ${mensagem}

        </div>

        `;


    }


}
// ==================================================
// CARREGAR ANÁLISES IA
// ==================================================

async function carregarAnalisesIA(){


    try{


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/analises`
            );



        if(!resposta.ok){

            throw new Error(
                "Erro análises IA"
            );

        }



        const dados =
            await resposta.json();



        renderizarAnalisesIA(
            dados
        );



    }
    catch(erro){


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
){


    const area =
        document.getElementById(
            "listaAnalisesIA"
        );



    if(!area)
        return;



    area.innerHTML = "";



    if(
        !analises ||
        analises.length === 0
    ){


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



            card.innerHTML =
            `

            <h3>

            ${analise.jogo ?? ""}

            </h3>


            <p>

            Probabilidade:

            <strong>

            ${analise.probabilidade ?? 0}%

            </strong>

            </p>


            <p>

            Previsão:

            ${analise.previsao ?? ""}

            </p>


            <p>

            Confiança IA:

            ${analise.confianca ?? 0}%

            </p>


            `;



            area.appendChild(
                card
            );


        }
    );


}





// ==================================================
// FORMATAR NÚMEROS
// ==================================================

function formatarNumero(
    numero
){


    if(
        numero === undefined ||
        numero === null
    ){

        return 0;

    }



    return Number(numero)
        .toLocaleString(
            "pt-BR"
        );


}





// ==================================================
// DATA E HORA
// ==================================================

function formatarData(
    data
){


    try{


        return new Date(data)
        .toLocaleString(
            "pt-BR"
        );


    }
    catch{


        return "-";


    }


}





// ==================================================
// VERIFICAR STATUS API
// ==================================================

async function verificarServidor(){


    try{


        const resposta =
            await fetch(
                `${CONFIG.API_URL}/api/ping`
            );



        if(
            resposta.ok
        ){

            atualizarStatus(
                true
            );


        }
        else{


            atualizarStatus(
                false
            );


        }


    }
    catch{


        atualizarStatus(
            false
        );


    }


}





// ==================================================
// MONITORAMENTO AUTOMÁTICO
// ==================================================

setInterval(
    () => {


        verificarServidor();


    },
    30000
);





// ==================================================
// ATUALIZAÇÃO COMPLETA MANUAL
// ==================================================

async function atualizarTudo(){


    await Promise.all([

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

    carregarValueBets,

    carregarAnalisesIA,

    conectarWebSocket,

    estado


};





// ==================================================
// FIM APP.JS
// ==================================================

console.log(
    "✅ BetVision AI Frontend carregado"
);
