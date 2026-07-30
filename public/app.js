// ==========================================
// BetVision AI - Frontend
// public/app.js
// Versão completa consolidada
// PARTE 1/4
// ==========================================


"use strict";


// ==========================================
// CONFIGURAÇÃO GLOBAL
// ==========================================


const CONFIG = {

    apiBase: "",

    websocket:

        window.location.protocol === "https:"
            ? `wss://${window.location.host}`
            : `ws://${window.location.host}`,

    refreshInterval: 30000,

    reconnectDelay: 3000

};



let estadoSistema = {

    conectado: false,

    websocket: null,

    ultimoUpdate: null,

    dashboard: null,

    campeonatos: [],

    jogos: [],

    analises: [],

    valuebets: []

};




// ==========================================
// INICIALIZAÇÃO
// ==========================================


document.addEventListener("DOMContentLoaded", () => {


    console.log(
        "🚀 BetVision AI Frontend iniciado"
    );


    carregarDashboard();


    carregarCampeonatos();


    carregarJogos();


    carregarAnalises();


    carregarValueBets();


    iniciarWebSocket();



    setInterval(() => {


        carregarDashboard();


    }, CONFIG.refreshInterval);



});





// ==========================================
// FUNÇÃO PADRÃO DE REQUISIÇÃO API
// ==========================================


async function apiRequest(endpoint, options = {}) {


    try {


        const resposta = await fetch(

            CONFIG.apiBase + endpoint,

            {

                headers: {

                    "Content-Type": "application/json"

                },

                ...options

            }

        );



        if (!resposta.ok) {


            throw new Error(

                `Erro HTTP ${resposta.status}`

            );


        }



        return await resposta.json();



    } catch (erro) {


        console.error(

            "Erro API:",

            endpoint,

            erro

        );


        return null;


    }


}





// ==========================================
// DASHBOARD PRINCIPAL
// ==========================================


async function carregarDashboard() {


    const dados = await apiRequest(

        "/api/dashboard"

    );



    if (!dados) {


        atualizarStatusSistema(

            false

        );


        return;


    }



    estadoSistema.dashboard = dados;



    estadoSistema.ultimoUpdate =

        new Date();



    atualizarStatusSistema(

        true

    );



    renderizarDashboard(

        dados

    );


}





// ==========================================
// RENDER DASHBOARD
// ==========================================


function renderizarDashboard(dados) {



    atualizarElemento(

        "totalJogos",

        dados.jogosHoje ?? 0

    );



    atualizarElemento(

        "totalCampeonatos",

        dados.campeonatos ?? 0

    );



    atualizarElemento(

        "totalAnalises",

        dados.analisesIA ?? 0

    );



    atualizarElemento(

        "totalValueBets",

        dados.valueBets ?? 0

    );



    atualizarElemento(

        "modeloIA",

        dados.modelo ?? "Probabilidade + Estatística"

    );



    atualizarElemento(

        "ultimaAtualizacao",

        formatarData(

            dados.ultimaAtualizacao

        )

    );



}






// ==========================================
// ATUALIZA ELEMENTOS HTML COM SEGURANÇA
// ==========================================


function atualizarElemento(id, valor) {


    const elemento = document.getElementById(id);



    if (elemento) {


        elemento.textContent = valor;


    }


}





// ==========================================
// STATUS DO SISTEMA
// ==========================================


function atualizarStatusSistema(conectado) {


    estadoSistema.conectado = conectado;



    const status = document.getElementById(

        "statusSistema"

    );



    if (!status) return;



    if (conectado) {


        status.textContent =

            "🟢 Sistema conectado";



        status.className =

            "status conectado";


    } else {


        status.textContent =

            "🔴 Sem conexão";



        status.className =

            "status desconectado";


    }


}





// ==========================================
// FORMATA DATA
// ==========================================


function formatarData(data) {


    if (!data) {


        return "-";


    }



    try {


        return new Date(data)

            .toLocaleString(

                "pt-BR"

            );


    } catch {


        return data;


    }


}





// ==========================================
// CARREGAR CAMPEONATOS
// ==========================================


async function carregarCampeonatos() {


    const dados = await apiRequest(

        "/api/campeonatos"

    );



    if (!dados) return;



    estadoSistema.campeonatos =

        Array.isArray(dados)

            ? dados

            : dados.campeonatos || [];



    renderizarCampeonatos();


}





function renderizarCampeonatos() {


    const tabela = document.getElementById(

        "listaCampeonatos"

    );



    if (!tabela) return;



    tabela.innerHTML = "";



    estadoSistema.campeonatos.forEach(

        campeonato => {



            const linha = document.createElement(

                "tr"

            );



            linha.innerHTML = `

                <td>${campeonato.nome ?? "-"}</td>

                <td>${campeonato.pais ?? "-"}</td>

                <td>${campeonato.temporada ?? "-"}</td>

            `;



            tabela.appendChild(

                linha

            );



        }

    );


}
// ==========================================
// PARTE 2/4
// Jogos, Análises IA e Value Bets
// ==========================================



// ==========================================
// CARREGAR JOGOS
// ==========================================


async function carregarJogos() {


    const dados = await apiRequest(

        "/api/jogos"

    );



    if (!dados) {


        return;


    }



    estadoSistema.jogos =

        Array.isArray(dados)

            ? dados

            : dados.jogos || [];



    renderizarJogos();


}





// ==========================================
// RENDER JOGOS
// ==========================================


function renderizarJogos() {


    const container = document.getElementById(

        "listaJogos"

    );



    if (!container) return;



    container.innerHTML = "";



    if (estadoSistema.jogos.length === 0) {


        container.innerHTML = `

            <div class="empty-state">

                Nenhum jogo encontrado

            </div>

        `;


        return;


    }




    estadoSistema.jogos.forEach(jogo => {



        const card = document.createElement(

            "div"

        );



        card.className =

            "jogo-card";



        card.innerHTML = `

            <div class="jogo-times">

                <strong>

                    ${jogo.casa ?? jogo.timeCasa ?? "-"}

                </strong>

                <span>

                    x

                </span>

                <strong>

                    ${jogo.fora ?? jogo.timeFora ?? "-"}

                </strong>

            </div>


            <div class="jogo-info">

                Campeonato:

                ${jogo.campeonato ?? "-"}

            </div>


            <div class="jogo-data">

                ${formatarData(jogo.data)}

            </div>

        `;



        container.appendChild(

            card

        );



    });


}






// ==========================================
// CARREGAR ANÁLISES IA
// ==========================================


async function carregarAnalises() {


    const dados = await apiRequest(

        "/api/analises"

    );



    if (!dados) return;



    estadoSistema.analises =

        Array.isArray(dados)

            ? dados

            : dados.analises || [];



    renderizarAnalises();


}





// ==========================================
// RENDER ANÁLISES IA
// ==========================================


function renderizarAnalises() {


    const container = document.getElementById(

        "listaAnalises"

    );



    if (!container) return;



    container.innerHTML = "";



    if (

        estadoSistema.analises.length === 0

    ) {


        container.innerHTML = `

            <div class="empty-state">

                Nenhuma análise disponível

            </div>

        `;


        return;


    }




    estadoSistema.analises.forEach(

        analise => {



            const card = document.createElement(

                "div"

            );



            card.className =

                "analise-card";



            card.innerHTML = `


                <h3>

                    ${analise.jogo ?? "Jogo"}

                </h3>


                <p>

                    Probabilidade:

                    <strong>

                        ${analise.probabilidade ?? 0}%

                    </strong>

                </p>


                <p>

                    Prognóstico:

                    ${analise.previsao ?? analise.palpite ?? "-"}

                </p>


                <p>

                    Confiança:

                    ${analise.confianca ?? "-"}

                </p>


            `;



            container.appendChild(

                card

            );


        }

    );


}






// ==========================================
// CARREGAR VALUE BETS
// ==========================================


async function carregarValueBets() {


    const dados = await apiRequest(

        "/api/valuebets"

    );



    if (!dados) return;



    estadoSistema.valuebets =


        Array.isArray(dados)

            ? dados

            : dados.valuebets || [];



    renderizarValueBets();


}





// ==========================================
// RENDER VALUE BETS
// ==========================================


function renderizarValueBets() {


    const container = document.getElementById(

        "listaValueBets"

    );



    if (!container) return;



    container.innerHTML = "";



    if (

        estadoSistema.valuebets.length === 0

    ) {


        container.innerHTML = `

            <div class="empty-state">

                Nenhuma Value Bet encontrada

            </div>

        `;


        return;


    }





    estadoSistema.valuebets.forEach(

        aposta => {



            const card = document.createElement(

                "div"

            );



            card.className =

                "valuebet-card";



            card.innerHTML = `


                <h3>

                    ${aposta.jogo ?? "-"}

                </h3>


                <p>

                    Mercado:

                    ${aposta.mercado ?? "-"}

                </p>


                <p>

                    Odd:

                    <strong>

                        ${aposta.odd ?? "-"}

                    </strong>

                </p>


                <p>

                    Probabilidade:

                    ${aposta.probabilidade ?? 0}%

                </p>


                <p class="valor">

                    Valor esperado:

                    ${aposta.valorEsperado ?? "-"}

                </p>


            `;



            container.appendChild(

                card

            );


        }

    );


}






// ==========================================
// BUSCAR DADOS COMPLETOS
// ==========================================


async function atualizarTudo() {


    await Promise.all([


        carregarDashboard(),


        carregarCampeonatos(),


        carregarJogos(),


        carregarAnalises(),


        carregarValueBets()


    ]);



}




// ==========================================
// BOTÃO DE ATUALIZAÇÃO MANUAL
// ==========================================


document.addEventListener(

    "click",

    evento => {



        const botao = evento.target.closest(

            "#btnAtualizar"

        );



        if (!botao) return;



        botao.disabled = true;



        atualizarTudo()

            .finally(() => {


                botao.disabled = false;


            });



    }

);
// ==========================================
// PARTE 3/4
// WebSocket + Tempo Real + Reconexão
// ==========================================




// ==========================================
// INICIAR WEBSOCKET
// ==========================================


function iniciarWebSocket() {


    console.log(

        "🔌 Iniciando conexão WebSocket..."

    );



    try {


        const socket = new WebSocket(

            CONFIG.websocket

        );



        estadoSistema.websocket = socket;



        socket.onopen = () => {



            console.log(

                "🟢 WebSocket conectado"

            );



            atualizarStatusSistema(

                true

            );



            atualizarIndicadorWebSocket(

                true

            );


        };





        socket.onmessage = evento => {



            processarMensagemWebSocket(

                evento.data

            );


        };





        socket.onerror = erro => {



            console.error(

                "Erro WebSocket:",

                erro

            );



            atualizarIndicadorWebSocket(

                false

            );


        };





        socket.onclose = () => {



            console.warn(

                "🔴 WebSocket desconectado"

            );



            atualizarIndicadorWebSocket(

                false

            );



            setTimeout(

                iniciarWebSocket,

                CONFIG.reconnectDelay

            );


        };





    } catch (erro) {



        console.error(

            "Falha ao iniciar WebSocket:",

            erro

        );



        setTimeout(

            iniciarWebSocket,

            CONFIG.reconnectDelay

        );


    }


}





// ==========================================
// PROCESSAR MENSAGEM WEBSOCKET
// ==========================================


function processarMensagemWebSocket(

    mensagem

) {



    try {



        const dados = JSON.parse(

            mensagem

        );



        console.log(

            "📡 Dados recebidos:",

            dados

        );





        if (

            dados.tipo === "dashboard"

        ) {



            estadoSistema.dashboard = dados;



            renderizarDashboard(

                dados

            );


        }






        if (

            dados.tipo === "jogo"

        ) {



            atualizarJogoTempoReal(

                dados

            );


        }






        if (

            dados.tipo === "analise"

        ) {



            estadoSistema.analises.unshift(

                dados

            );



            renderizarAnalises();


        }






        if (

            dados.tipo === "valuebet"

        ) {



            estadoSistema.valuebets.unshift(

                dados

            );



            renderizarValueBets();


        }





        atualizarUltimaComunicao();


    } catch (erro) {



        console.error(

            "Mensagem WebSocket inválida:",

            erro

        );


    }


}






// ==========================================
// ATUALIZA JOGO EM TEMPO REAL
// ==========================================


function atualizarJogoTempoReal(

    jogo

) {



    const index =

        estadoSistema.jogos.findIndex(

            item =>

                item.id === jogo.id

        );



    if (

        index >= 0

    ) {



        estadoSistema.jogos[index] = jogo;



    } else {



        estadoSistema.jogos.push(

            jogo

        );


    }



    renderizarJogos();


}







// ==========================================
// INDICADOR WEBSOCKET
// ==========================================


function atualizarIndicadorWebSocket(

    conectado

) {



    const elemento = document.getElementById(

        "websocketStatus"

    );



    if (!elemento) return;





    if (conectado) {



        elemento.textContent =

            "🟢 Tempo real ativo";



        elemento.className =

            "ws-online";



    } else {



        elemento.textContent =

            "🔴 Tempo real offline";



        elemento.className =

            "ws-offline";


    }


}






// ==========================================
// ÚLTIMA COMUNICAÇÃO
// ==========================================


function atualizarUltimaComunicao() {



    estadoSistema.ultimoUpdate =

        new Date();




    atualizarElemento(

        "ultimaAtualizacao",

        formatarData(

            estadoSistema.ultimoUpdate

        )

    );


}






// ==========================================
// ENVIO PELO WEBSOCKET
// ==========================================


function enviarWebSocket(

    dados

) {



    if (

        !estadoSistema.websocket

    ) {


        return false;


    }




    if (

        estadoSistema.websocket.readyState !== WebSocket.OPEN

    ) {


        return false;


    }





    estadoSistema.websocket.send(

        JSON.stringify(

            dados

        )

    );



    return true;


}






// ==========================================
// RECONEXÃO MANUAL
// ==========================================


function reconectarSistema() {



    if (

        estadoSistema.websocket

    ) {



        estadoSistema.websocket.close();



    } else {



        iniciarWebSocket();


    }


}






// ==========================================
// VERIFICA STATUS DO SERVIDOR
// ==========================================


async function verificarServidor() {



    const resposta = await apiRequest(

        "/api/ping"

    );



    if (

        resposta

    ) {



        atualizarStatusSistema(

            true

        );


    } else {



        atualizarStatusSistema(

            false

        );


    }


}






// ==========================================
// MONITORAMENTO AUTOMÁTICO
// ==========================================


setInterval(

    () => {



        verificarServidor();



    },

    60000

);


// ==========================================
// PARTE 4/4
// Funções auxiliares finais
// Inicialização complementar
// ==========================================




// ==========================================
// FILTRO DE CAMPEONATOS
// ==========================================


function filtrarCampeonatos(

    termo

) {


    const busca = termo

        .toLowerCase()

        .trim();



    const lista =

        estadoSistema.campeonatos.filter(

            campeonato => {



                const texto =

                    `${campeonato.nome ?? ""}

                    ${campeonato.pais ?? ""}`

                    .toLowerCase();



                return texto.includes(

                    busca

                );

            }

        );



    const tabela = document.getElementById(

        "listaCampeonatos"

    );



    if (!tabela) return;



    tabela.innerHTML = "";



    lista.forEach(

        campeonato => {



            const linha = document.createElement(

                "tr"

            );



            linha.innerHTML = `

                <td>${campeonato.nome ?? "-"}</td>

                <td>${campeonato.pais ?? "-"}</td>

                <td>${campeonato.temporada ?? "-"}</td>

            `;



            tabela.appendChild(

                linha

            );


        }

    );


}







// ==========================================
// FILTRO DE VALUE BETS
// ==========================================


function filtrarValueBets(

    valorMinimo = 0

) {



    const lista =

        estadoSistema.valuebets.filter(

            aposta => {



                const valor =

                    Number(

                        aposta.valorEsperado ?? 0

                    );



                return valor >= valorMinimo;


            }

        );



    const container = document.getElementById(

        "listaValueBets"

    );



    if (!container) return;



    container.innerHTML = "";



    lista.forEach(

        aposta => {



            const card = document.createElement(

                "div"

            );



            card.className =

                "valuebet-card";



            card.innerHTML = `

                <h3>

                    ${aposta.jogo ?? "-"}

                </h3>


                <p>

                    Mercado:

                    ${aposta.mercado ?? "-"}

                </p>


                <p>

                    Odd:

                    ${aposta.odd ?? "-"}

                </p>


                <p>

                    Probabilidade:

                    ${aposta.probabilidade ?? 0}%

                </p>


            `;



            container.appendChild(

                card

            );



        }

    );



}







// ==========================================
// EVENTOS DE INPUT
// ==========================================


document.addEventListener(

    "input",

    evento => {



        const campo = evento.target;



        if (

            campo.id === "buscarCampeonato"

        ) {



            filtrarCampeonatos(

                campo.value

            );


        }





        if (

            campo.id === "filtroValueBet"

        ) {



            filtrarValueBets(

                campo.value

            );


        }



    }

);







// ==========================================
// LIMPAR CACHE VISUAL
// ==========================================


function limparInterface() {



    const elementos = [

        "listaJogos",

        "listaAnalises",

        "listaValueBets",

        "listaCampeonatos"

    ];



    elementos.forEach(

        id => {



            const elemento =

                document.getElementById(

                    id

                );



            if (elemento) {



                elemento.innerHTML = "";


            }



        }

    );


}







// ==========================================
// EXPORTAÇÃO GLOBAL
// Permite uso pelos HTMLs
// ==========================================


window.BetVisionAI = {


    carregarDashboard,

    carregarCampeonatos,

    carregarJogos,

    carregarAnalises,

    carregarValueBets,

    atualizarTudo,

    iniciarWebSocket,

    reconectarSistema,

    filtrarCampeonatos,

    filtrarValueBets,

    limparInterface



};






// ==========================================
// FINAL DO APP.JS
// ==========================================


console.log(

    "✅ BetVision AI Frontend carregado"

);
