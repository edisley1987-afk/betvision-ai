// ==========================================
// BetVision AI Frontend v4
// app.js
// PARTE 1
// Inicialização + Dashboard + API
// ==========================================

"use strict";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const CONFIG = {

    apiBase: "",

    websocket:

        window.location.protocol === "https:"
            ? `wss://${window.location.host}`
            : `ws://${window.location.host}`,

    refreshInterval: 30000,

    reconnectDelay: 5000

};


// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================

const estado = {

    websocket: null,

    conectado: false,

    dashboard: {},

    jogos: [],

    campeonatos: [],

    analises: [],

    valuebets: [],

    ultimaAtualizacao: null

};


// ==========================================
// API
// ==========================================

async function api(endpoint, options = {}) {

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

                `HTTP ${resposta.status}`

            );

        }

        return await resposta.json();

    }

    catch (erro) {

        console.error(

            "Erro API",

            endpoint,

            erro

        );

        return null;

    }

}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        console.log(

            "🚀 BetVision AI v4 iniciado"

        );

        mostrarLoader(true);

        await atualizarTudo();

        iniciarWebSocket();

        mostrarLoader(false);

        setInterval(

            atualizarTudo,

            CONFIG.refreshInterval

        );

    }

);


// ==========================================
// ATUALIZA TUDO
// ==========================================

async function atualizarTudo() {

    await Promise.all([

        carregarDashboard(),

        carregarJogos(),

        carregarAnalises(),

        carregarValueBets(),

        carregarCampeonatos()

    ]);

}


// ==========================================
// DASHBOARD
// ==========================================

async function carregarDashboard() {

    const dados = await api(

        "/api/dashboard"

    );

    if (!dados) return;

    estado.dashboard = dados;

    renderDashboard();

}


// ==========================================
// RENDER DASHBOARD
// ==========================================

function renderDashboard() {

    const d = estado.dashboard;

    atualizarTexto(

        "jogosHoje",

        d.jogosHoje ?? 0

    );

    atualizarTexto(

        "campeonatos",

        d.campeonatos ?? 0

    );

    atualizarTexto(

        "analisesIA",

        d.analisesIA ?? 0

    );

    atualizarTexto(

        "valueBets",

        d.valueBets ?? 0

    );

    atualizarTexto(

        "roiPrevisto",

        `${d.roi ?? 0}%`

    );

    atualizarTexto(

        "precisaoIA",

        `${d.precisao ?? 0}%`

    );

    atualizarTexto(

        "nomeSistema",

        d.sistema

    );

    atualizarTexto(

        "modeloIA",

        d.modelo

    );

    atualizarTexto(

        "modeloRodape",

        d.modelo

    );

    atualizarTexto(

        "ultimaAtualizacao",

        formatarData(

            d.ultimaAtualizacao

        )

    );

    atualizarTexto(

        "ultimaAtualizacaoCompleta",

        formatarData(

            d.ultimaAtualizacao

        )

    );

    atualizarStatus(

        d.status

    );

}


// ==========================================
// STATUS
// ==========================================

function atualizarStatus(status) {

    const el = document.getElementById(

        "statusSistema"

    );

    if (!el) return;

    if (status === "operacional") {

        el.innerHTML =

            "🟢 Sistema conectado";

        el.className =

            "status online";

    }

    else {

        el.innerHTML =

            "🔴 Offline";

        el.className =

            "status offline";

    }

}


// ==========================================
// UTILIDADES
// ==========================================

function atualizarTexto(id, texto) {

    const el = document.getElementById(id);

    if (el) {

        el.textContent = texto;

    }

}

function formatarData(data) {

    if (!data) return "-";

    return new Date(data)

        .toLocaleString(

            "pt-BR"

        );

}

function formatarHora(data) {

    if (!data) return "-";

    return new Date(data)

        .toLocaleTimeString(

            "pt-BR",

            {

                hour: "2-digit",

                minute: "2-digit"

            }

        );

}


// ==========================================
// LOADER
// ==========================================

function mostrarLoader(visivel) {

    const loader = document.getElementById(

        "loader"

    );

    if (!loader) return;

    loader.classList.toggle(

        "oculto",

        !visivel

    );

}


// ==========================================
// LOGS
// ==========================================

function adicionarLog(texto) {

    const logs = document.getElementById(

        "logsSistema"

    );

    if (!logs) return;

    const item = document.createElement(

        "div"

    );

    item.textContent =

        `${new Date().toLocaleTimeString()} - ${texto}`;

    logs.prepend(item);

}


// ==========================================
// PLACEHOLDERS
// (implementados nas próximas partes)
// ==========================================

async function carregarJogos(){}

async function carregarCampeonatos(){}

async function carregarAnalises(){}

async function carregarValueBets(){}

function iniciarWebSocket(){}

console.log("✅ Parte 1 carregada");
// ==========================================
// PARTE 2A
// Jogos Profissionais
// ==========================================


// ==========================================
// CARREGAR JOGOS
// ==========================================

async function carregarJogos() {

    try {

        const resposta = await api("/api/jogos");

        console.log("⚽ Jogos:", resposta);

        if (!resposta) {

            estado.jogos = [];

            renderJogos();

            return;

        }

        estado.jogos =

            Array.isArray(resposta)

                ? resposta

                : resposta.jogos || [];

        renderJogos();

    }

    catch (erro) {

        console.error(

            "Erro jogos",

            erro

        );

        estado.jogos = [];

        renderJogos();

    }

}



// ==========================================
// RENDER JOGOS
// ==========================================

function renderJogos() {

    const lista = document.getElementById(

        "listaJogos"

    );

    if (!lista) return;

    lista.innerHTML = "";

    if (estado.jogos.length === 0) {

        lista.innerHTML =

        `<div class="empty-state">

            Nenhum jogo encontrado

        </div>`;

        return;

    }

    estado.jogos.forEach(

        jogo => {

            lista.appendChild(

                criarCardJogo(jogo)

            );

        }

    );

}



// ==========================================
// CRIA CARD
// ==========================================

function criarCardJogo(jogo) {

    const card = document.createElement(

        "div"

    );

    card.className = "jogo-card";

    card.innerHTML = `

<div class="jogo-topo">

    <span class="liga">

        🏆 ${jogo.campeonato || "-"}

    </span>

    <span class="pais">

        🌍 ${jogo.pais || "-"}

    </span>

</div>


<div class="jogo-times">

    <div class="time">

        ${
            jogo.escudos?.casa
            ? `<img
                    class="escudo"
                    src="${jogo.escudos.casa}"
               >`
            : ""
        }

        <strong>

            ${jogo.casa}

        </strong>

    </div>

    <div class="versus">

        X

    </div>

    <div class="time">

        ${
            jogo.escudos?.fora
            ? `<img
                    class="escudo"
                    src="${jogo.escudos.fora}"
               >`
            : ""
        }

        <strong>

            ${jogo.fora}

        </strong>

    </div>

</div>


<div class="jogo-info">

    <div>

        📅

        ${formatarData(

            jogo.horario

        )}

    </div>

    <div>

        🕒

        ${formatarHora(

            jogo.horario

        )}

    </div>

</div>


<div class="jogo-info">

    <div>

        📍

        ${jogo.estadio || "-"}

    </div>

</div>


<div class="jogo-info">

    <div>

        🥇 Rodada

        ${jogo.rodada ?? "-"}

    </div>

</div>


<div class="status-linha">

    ${statusHTML(

        jogo.status

    )}

</div>


<div class="acoes-jogo">

<button
class="btnIA"
data-id="${jogo.id}">

🤖 IA

</button>

<button
class="btnOdds"
data-id="${jogo.id}">

💰 Odds

</button>

<button
class="btnStats"
data-id="${jogo.id}">

📊 Estatísticas

</button>

</div>

`;

    return card;

}



// ==========================================
// STATUS COLORIDO
// ==========================================

function statusHTML(status) {

    switch (status) {

        case "LIVE":

            return `

            <span class="status live">

            🟢 AO VIVO

            </span>

            `;

        case "FINISHED":

            return `

            <span class="status finished">

            ⚪ ENCERRADO

            </span>

            `;

        case "PAUSED":

            return `

            <span class="status paused">

            🟡 INTERVALO

            </span>

            `;

        case "POSTPONED":

            return `

            <span class="status postponed">

            🔴 ADIADO

            </span>

            `;

        default:

            return `

            <span class="status scheduled">

            🔵 AGENDADO

            </span>

            `;

    }

}



console.log("✅ Parte 2A carregada");
// ==========================================
// PARTE 2B
// Eventos + Modal + Filtros dos Jogos
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

    const jogo = estado.jogos.find(j => String(j.id) === String(id));

    if (!jogo) return;

    const modal = document.getElementById("modalIA");

    const conteudo = document.getElementById("conteudoModal");

    if (!modal || !conteudo) return;

    conteudo.innerHTML = `

<h2>

${jogo.casa}

<span style="color:#00bfff;">x</span>

${jogo.fora}

</h2>

<hr>

<p>

🏆 <strong>Campeonato:</strong>

${jogo.campeonato}

</p>

<p>

🌍 <strong>País:</strong>

${jogo.pais}

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

<p>

Probabilidade será calculada automaticamente.

</p>

<p>

Modelo:

Random Forest + Estatística

</p>

`;

    modal.classList.add("ativo");

}


// ==========================================
// FECHAR MODAL
// ==========================================

document
.getElementById("fecharModal")
?.addEventListener("click", () => {

    document
        .getElementById("modalIA")
        ?.classList.remove("ativo");

});


// ==========================================
// ODDS
// ==========================================

function abrirOdds(id){

    console.log("Abrir Odds", id);

    adicionarLog("Abrindo Odds do jogo " + id);

}


// ==========================================
// ESTATÍSTICAS
// ==========================================

function abrirEstatisticas(id){

    console.log("Abrir Estatísticas", id);

    adicionarLog("Abrindo estatísticas do jogo " + id);

}


// ==========================================
// FILTRO POR CAMPEONATO
// ==========================================

function filtrarJogos(texto){

    texto = texto.toLowerCase();

    const lista = estado.jogos.filter(j=>{

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

    const original = estado.jogos;

    estado.jogos = lista;

    renderJogos();

    estado.jogos = original;

}


// ==========================================
// ORDENAR POR HORÁRIO
// ==========================================

function ordenarJogos(){

    estado.jogos.sort(

        (a,b)=>

            new Date(a.horario)

            -

            new Date(b.horario)

    );

    renderJogos();

}


// ==========================================
// WEBSOCKET
// Atualizar somente um jogo
// ==========================================

function atualizarJogoTempoReal(jogo){

    const index = estado.jogos.findIndex(

        j=>j.id===jogo.id

    );

    if(index>=0){

        estado.jogos[index]={

            ...estado.jogos[index],

            ...jogo

        };

    }

    else{

        estado.jogos.push(jogo);

    }

    ordenarJogos();

}


// ==========================================
// EXPORTAÇÃO
// ==========================================

window.BetVisionJogos={

    renderJogos,

    carregarJogos,

    abrirModalIA,

    filtrarJogos,

    ordenarJogos,

    atualizarJogoTempoReal

};


console.log("✅ Parte 2B carregada");
// ==========================================
// PARTE 3
// Dashboard IA + Métricas + Value Bets
// ==========================================


// ==========================================
// DASHBOARD IA
// ==========================================

async function carregarDashboardIA(){

    try{

        const resposta = await fetch(
            `${CONFIG.apiBase}/api/dashboard`
        );


        if(!resposta.ok){

            throw new Error(
                "Erro dashboard IA"
            );

        }


        const dados = await resposta.json();


        estado.dashboard = dados;


        atualizarCardsIA(
            dados
        );


        adicionarLog(
            "Dashboard IA atualizado"
        );


    }

    catch(erro){

        console.error(
            "Dashboard IA:",
            erro
        );


        adicionarLog(
            "Falha ao carregar dashboard IA"
        );

    }

}



// ==========================================
// ATUALIZAR CARDS DO DASHBOARD
// ==========================================

function atualizarCardsIA(dados){


    const mapa = {


        jogosHoje:
        dados.jogosHoje ?? 0,


        campeonatos:
        dados.campeonatos ?? 0,


        analisesIA:
        dados.analisesIA ?? 0,


        valueBets:
        dados.valueBets ?? 0,


        roi:
        dados.roi ?? 0,


        precisao:
        dados.precisao ?? 0


    };



    Object.entries(mapa)

    .forEach(([campo,valor])=>{


        const elemento =
        document.querySelector(
            `[data-metrica="${campo}"]`
        );


        if(elemento){

            elemento.innerHTML =
            formatarNumero(valor);

        }


    });


}



// ==========================================
// FORMATAR MÉTRICAS
// ==========================================

function formatarNumero(valor){


    if(valor === null ||
       valor === undefined){

        return "0";

    }


    if(
        typeof valor === "number"
        &&
        valor % 1 !== 0
    ){

        return valor.toFixed(2);

    }


    return valor;

}



// ==========================================
// BUSCAR ANÁLISES IA
// ==========================================

async function carregarAnalisesIA(){


    try{


        const resposta =
        await fetch(
            `${CONFIG.apiBase}/api/analises`
        );


        if(!resposta.ok){

            throw new Error(
                "Erro análises"
            );

        }


        const dados =
        await resposta.json();



        estado.analises =
        dados.analises ||
        dados;



        renderAnalisesIA();



    }

    catch(erro){


        console.error(
            erro
        );


        adicionarLog(
            "Erro carregando análises IA"
        );


    }


}



// ==========================================
// RENDER DAS ANÁLISES
// ==========================================

function renderAnalisesIA(){


    const container =
    document.getElementById(
        "listaAnalises"
    );


    if(!container)
        return;



    if(
        !estado.analises ||
        estado.analises.length===0
    ){


        container.innerHTML = `

        <div class="vazio">

        Nenhuma análise disponível

        </div>

        `;


        return;

    }



    container.innerHTML =

    estado.analises

    .map(item=>{


        return `

        <div class="analise-card">


            <div class="titulo">

            ${item.casa || "-"}

            <span>
            x
            </span>

            ${item.fora || "-"}

            </div>


            <div>

            Probabilidade:

            <strong>

            ${item.probabilidade || 0}%

            </strong>

            </div>



            <div>

            Mercado:

            ${item.mercado || "-"}

            </div>



            <div>

            Confiança:

            ${item.confianca || 0}%

            </div>


        </div>

        `;


    })

    .join("");

}



// ==========================================
// VALUE BETS
// ==========================================

async function carregarValueBets(){


    try{


        const resposta =
        await fetch(

            `${CONFIG.apiBase}/api/valuebets`

        );



        if(!resposta.ok){

            throw new Error(
                "Erro value bets"
            );

        }



        const dados =
        await resposta.json();



        estado.valuebets =
        dados.valuebets ||
        dados;



        renderValueBets();



    }


    catch(erro){


        console.error(
            erro
        );


        adicionarLog(
            "Erro carregando Value Bets"
        );


    }


}



// ==========================================
// RENDER VALUE BETS
// ==========================================

function renderValueBets(){


    const container =
    document.getElementById(
        "listaValueBets"
    );



    if(!container)
        return;



    if(
        !estado.valuebets ||
        estado.valuebets.length===0
    ){


        container.innerHTML = `

        <div class="vazio">

        Nenhuma oportunidade encontrada

        </div>

        `;


        return;

    }



    container.innerHTML =

    estado.valuebets

    .map(v=>{


        const odd =
        Number(
            v.odd || 0
        );


        const prob =
        Number(
            v.probabilidade || 0
        );


        return `


        <div class="value-card">


            <h3>

            ${v.casa}

            x

            ${v.fora}

            </h3>



            <p>

            Mercado:

            <b>
            ${v.mercado}
            </b>

            </p>



            <p>

            Odd:

            <strong>

            ${odd}

            </strong>

            </p>



            <p>

            Probabilidade:

            ${prob}%

            </p>



            <span class="badge-value">

            VALUE BET

            </span>



        </div>


        `;


    })

    .join("");

}



// ==========================================
// ATUALIZAÇÃO COMPLETA DO SISTEMA
// ==========================================

async function atualizarSistemaIA(){


    await Promise.all([

        carregarDashboardIA(),

        carregarAnalisesIA(),

        carregarValueBets()

    ]);



    adicionarLog(
        "Sistema IA sincronizado"
    );


}



// ==========================================
// TIMER AUTOMÁTICO
// ==========================================

function iniciarAtualizacaoIA(){


    atualizarSistemaIA();



    setInterval(

        atualizarSistemaIA,

        CONFIG.intervaloAtualizacao || 60000

    );


}



// ==========================================
// WEBSOCKET IA
// ==========================================

function processarMensagemIA(msg){


    try{


        const dados =
        JSON.parse(msg);



        if(
            dados.tipo === "dashboard"
        ){

            atualizarCardsIA(
                dados
            );

        }



        if(
            dados.tipo === "analise"
        ){

            estado.analises.unshift(
                dados.jogo
            );

            renderAnalisesIA();

        }



        if(
            dados.tipo === "valuebet"
        ){

            estado.valuebets.unshift(
                dados.jogo
            );

            renderValueBets();

        }


    }

    catch(e){

        console.warn(
            "Mensagem IA inválida",
            e
        );

    }


}


console.log(
"✅ Parte 3 carregada"
);
// ==========================================
// PARTE 4
// Inicialização Geral do Sistema
// ==========================================



// ==========================================
// ESTADO INICIAL
// ==========================================

function inicializarEstado(){


    estado = {


        jogos: [],


        analises: [],


        valuebets: [],


        dashboard:{},


        conectado:false,


        ultimaAtualizacao:null,


        logs:[]


    };


}




// ==========================================
// LOADING GLOBAL
// ==========================================

function mostrarLoading(texto="Carregando..."){


    const loading =
    document.getElementById(
        "loading"
    );


    if(!loading)
        return;


    loading.innerHTML = texto;


    loading.classList.add(
        "ativo"
    );


}



function esconderLoading(){


    const loading =
    document.getElementById(
        "loading"
    );


    if(!loading)
        return;


    loading.classList.remove(
        "ativo"
    );


}





// ==========================================
// SISTEMA DE NOTIFICAÇÕES
// ==========================================

function notificar(
    mensagem,
    tipo="info"
){


    const area =
    document.getElementById(
        "notificacoes"
    );


    if(!area){

        console.log(
            mensagem
        );

        return;

    }



    const div =
    document.createElement(
        "div"
    );



    div.className =
    `notificacao ${tipo}`;



    div.innerHTML =
    mensagem;



    area.appendChild(
        div
    );



    setTimeout(()=>{


        div.remove();


    },4000);


}



// ==========================================
// WEBSOCKET PRINCIPAL
// ==========================================

function conectarWebSocket(){


    try{


        const protocolo =
        location.protocol === "https:"
        ?
        "wss://"
        :
        "ws://";



        const wsURL =
        protocolo +
        location.host;



        socket =
        new WebSocket(
            wsURL
        );



        socket.onopen = ()=>{


            estado.conectado =
            true;



            adicionarLog(
                "WebSocket conectado"
            );


            notificar(
                "🟢 Sistema online",
                "sucesso"
            );


        };




        socket.onmessage =
        (evento)=>{


            try{


                const dados =
                JSON.parse(
                    evento.data
                );



                processarMensagemWS(
                    dados
                );



            }

            catch(e){


                console.warn(
                    "WS inválido",
                    e
                );


            }


        };





        socket.onerror =
        ()=>{


            estado.conectado =
            false;


            adicionarLog(
                "Erro WebSocket"
            );


        };





        socket.onclose =
        ()=>{


            estado.conectado =
            false;



            adicionarLog(
                "WebSocket desconectado"
            );



            setTimeout(

                conectarWebSocket,

                5000

            );


        };


    }


    catch(e){


        console.error(
            "WS:",
            e
        );


    }


}




// ==========================================
// PROCESSAR EVENTOS WS
// ==========================================

function processarMensagemWS(dados){


    if(!dados)
        return;



    switch(
        dados.tipo
    ){



        case "jogo":


            atualizarJogoTempoReal(
                dados.jogo
            );


        break;



        case "dashboard":


            atualizarCardsIA(
                dados
            );


        break;



        case "analise":


            estado.analises.unshift(
                dados.jogo
            );


            renderAnalisesIA();


        break;




        case "valuebet":


            estado.valuebets.unshift(
                dados.jogo
            );


            renderValueBets();


        break;




        default:


            adicionarLog(
                "Evento recebido: "
                +
                dados.tipo
            );


    }


}





// ==========================================
// BUSCA INICIAL
// ==========================================

async function iniciarAplicacao(){


    try{


        mostrarLoading(
            "Inicializando BetVision AI..."
        );



        inicializarEstado();



        await carregarJogos();



        await atualizarSistemaIA();



        conectarWebSocket();



        iniciarAtualizacaoIA();



        esconderLoading();



        adicionarLog(
            "Aplicação iniciada"
        );



    }


    catch(e){


        console.error(
            e
        );



        notificar(
            "Erro ao iniciar sistema",
            "erro"
        );


        esconderLoading();


    }


}





// ==========================================
// BOTÃO ATUALIZAR
// ==========================================

document.addEventListener(
"click",
(e)=>{


    const botao =
    e.target.closest(
        "#btnAtualizar"
    );



    if(!botao)
        return;



    atualizarSistemaIA();



    carregarJogos();



});





// ==========================================
// ATALHOS
// ==========================================

window.BetVisionAI = {


    iniciarAplicacao,


    atualizarSistemaIA,


    carregarDashboardIA,


    carregarAnalisesIA,


    carregarValueBets,


    conectarWebSocket,


    estado



};





// ==========================================
// START AUTOMÁTICO
// ==========================================

document.addEventListener(
"DOMContentLoaded",
()=>{


    iniciarAplicacao();


});





console.log(
"🚀 BetVision AI Frontend v4 carregado"
);
