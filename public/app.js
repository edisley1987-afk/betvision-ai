// ==========================================
// BetVision AI
// public/app.js
// Versão Consolidada Dashboard IA
// PARTE 1/4
// ==========================================

"use strict";


// ==========================================
// CONFIGURAÇÃO GLOBAL
// ==========================================

const CONFIG = {

    apiBase: "",

    endpoints: {

        dashboard:
            "/api/dashboard",

        jogos:
            "/api/jogos",

        valuebets:
            "/api/valuebets",

        analises:
            "/api/analises",

        odds:
            "/api/odds"

    },


    websocket:

        window.location.protocol === "https:"
            ?
            `wss://${window.location.host}`
            :
            `ws://${window.location.host}`

};



// ==========================================
// ESTADO GLOBAL
// ==========================================

const APP = {


    jogos: [],

    valuebets: [],

    analises: [],

    odds: [],


    charts:{},


    conectado:false,


    ultimaAtualizacao:null


};



// ==========================================
// UTILIDADES
// ==========================================


function $(id){

    return document.getElementById(id);

}



function formatarNumero(valor){

    const numero =
        Number(valor);


    if(!Number.isFinite(numero)){

        return 0;

    }


    return numero;

}




function formatarData(data){


    if(!data){

        return "--";

    }


    try{


        return new Date(data)
        .toLocaleString(
            "pt-BR"
        );


    }
    catch{


        return "--";

    }


}





function adicionarLog(texto){


    const box =
        $("logsSistema");


    if(!box){

        return;

    }



    const div =
        document.createElement(
            "div"
        );


    div.innerHTML = `

        <span>
        ${new Date()
        .toLocaleTimeString()}
        </span>

        -

        ${texto}

    `;


    box.prepend(div);



    while(box.children.length > 20){

        box.removeChild(
            box.lastChild
        );

    }


}





// ==========================================
// TOAST
// ==========================================


function mostrarToast(
    mensagem
){


    const toast =
        $("toast");


    const texto =
        $("toastTexto");



    if(!toast || !texto){

        return;

    }



    texto.innerHTML =
        mensagem;



    toast.classList.add(
        "ativo"
    );



    setTimeout(()=>{


        toast.classList.remove(
            "ativo"
        );


    },3000);



}





// ==========================================
// FETCH PADRÃO API
// ==========================================


async function apiGET(
    endpoint
){


    try{


        const resposta =
            await fetch(
                CONFIG.apiBase +
                endpoint
            );



        if(!resposta.ok){


            throw new Error(

                `HTTP ${resposta.status}`

            );


        }



        return await resposta.json();



    }
    catch(error){


        console.error(
            "Erro API:",
            endpoint,
            error.message
        );



        adicionarLog(

            `❌ Falha API ${endpoint}`

        );



        return null;


    }


}





// ==========================================
// CARREGAR DASHBOARD
// ==========================================


async function carregarDashboard(){


    console.log(
        "📊 Carregando dashboard..."
    );



    const dados =
        await apiGET(
            CONFIG.endpoints.dashboard
        );



    if(!dados){


        atualizarStatusServidor(
            false
        );


        return;


    }





    const sistema =
        dados;



    const jogos =
        sistema.jogosHoje ??
        sistema.totalJogos ??
        0;



    const campeonatos =
        sistema.campeonatos ??
        0;



    const analises =
        sistema.analisesIA ??
        sistema.analises ??
        0;



    const valuebets =
        sistema.valueBets ??
        sistema.valuebets ??
        0;



    const roi =
        sistema.roi ??
        0;



    const precisao =
        sistema.precisao ??
        0;





    preencherTexto(
        "jogosHoje",
        jogos
    );



    preencherTexto(
        "campeonatos",
        campeonatos
    );



    preencherTexto(
        "analisesIA",
        analises
    );



    preencherTexto(
        "valueBets",
        valuebets
    );



    preencherTexto(
        "roi",
        `${roi}%`
    );



    preencherTexto(
        "precisao",
        `${precisao}%`
    );



    preencherTexto(
        "modeloIA",
        sistema.modelo ||
        "Prediction Engine v2.0"
    );



    preencherTexto(
        "modeloRodape",
        sistema.modelo ||
        "BetVision Statistical AI v2.0"
    );



    preencherTexto(
        "precisaoRodape",
        `${precisao}%`
    );




    preencherTexto(

        "ultimaAtualizacaoCompleta",

        formatarData(
            sistema.ultimaAtualizacao
        )

    );



    preencherTexto(

        "ultimaAtualizacao",

        "Atualizado em " +

        formatarData(
            sistema.ultimaAtualizacao
        )

    );



    atualizarStatusServidor(
        true
    );



    APP.ultimaAtualizacao =
        sistema.ultimaAtualizacao;



    adicionarLog(
        "📊 Dashboard atualizado"
    );



}





// ==========================================
// PREENCHER ELEMENTOS
// ==========================================


function preencherTexto(
    id,
    valor
){


    const elemento =
        $(id);



    if(elemento){

        elemento.innerHTML =
            valor;

    }


}





// ==========================================
// STATUS SERVIDOR
// ==========================================


function atualizarStatusServidor(
    online=true
){


    const status =
        $("statusServidor");



    if(!status){

        return;

    }



    if(online){


        status.className =
            "status online";


        status.innerHTML =
            "🟢 Online";


    }
    else{


        status.className =
            "status offline";


        status.innerHTML =
            "🔴 Offline";


    }


}





// ==========================================
// INICIALIZAÇÃO
// ==========================================


async function iniciarAplicacao(){


    console.log(
        "🚀 BetVision AI iniciado"
    );



    mostrarToast(
        "Sistema iniciado"
    );



    await carregarDashboard();



    adicionarLog(
        "Sistema operacional"
    );


}



// continua PARTE 2/4
// ==========================================
// BetVision AI
// public/app.js
// PARTE 2/4
// Jogos + Renderização
// ==========================================



// ==========================================
// CARREGAR JOGOS
// ==========================================


async function carregarJogos(){


    console.log(
        "⚽ Buscando jogos..."
    );


    const resposta =

        await apiGET(

            CONFIG.endpoints.jogos

        );



    if(!resposta){


        return;


    }





    const jogos =


        Array.isArray(resposta)

        ?

        resposta

        :

        resposta.jogos || [];





    APP.jogos = jogos;





    renderizarJogos();




    preencherTexto(

        "jogosHojeTexto",

        `${jogos.length} jogos disponíveis`

    );



    adicionarLog(

        `⚽ ${jogos.length} jogos carregados`

    );



}







// ==========================================
// RENDER JOGOS
// ==========================================


function renderizarJogos(){



    const container =

        $("listaJogos");



    if(!container){

        return;

    }



    container.innerHTML = "";




    if(!APP.jogos.length){



        container.innerHTML = `


            <div class="card-jogo">


                Nenhum jogo encontrado.


            </div>


        `;



        return;


    }







    APP.jogos.forEach(jogo=>{


        const card =

            criarCardJogo(
                jogo
            );



        container.appendChild(
            card
        );



    });



}









// ==========================================
// CRIAR CARD JOGO
// ==========================================


function criarCardJogo(
    jogo
){



    const template =

        $("templateJogo");



    if(!template){

        return document.createElement(
            "div"
        );

    }






    const clone =

        template.content
        .cloneNode(true);





    const titulo =

        clone.querySelector(
            ".titulo-jogo"
        );



    const campeonato =

        clone.querySelector(
            ".campeonato"
        );



    const horario =

        clone.querySelector(
            ".horario"
        );





    if(titulo){


        titulo.innerHTML =

            `${jogo.casa || "Casa"} 
            x 
            ${jogo.fora || "Fora"}`;


    }







    if(campeonato){


        campeonato.innerHTML =

            jogo.campeonato ||

            "Futebol";


    }








    if(horario){


        horario.innerHTML =

            formatarData(

                jogo.horario

            );


    }








    const prob =

        gerarProbabilidades(
            jogo
        );







    const casa =

        clone.querySelector(
            ".probCasa"
        );



    const empate =

        clone.querySelector(
            ".probEmpate"
        );



    const fora =

        clone.querySelector(
            ".probFora"
        );








    if(casa){


        casa.innerHTML =

            `${prob.casa}%`;

    }



    if(empate){


        empate.innerHTML =

            `${prob.empate}%`;

    }



    if(fora){


        fora.innerHTML =

            `${prob.fora}%`;

    }









    const placar =

        clone.querySelector(
            ".placar"
        );



    if(placar){


        placar.innerHTML =

            preverPlacar(
                prob
            );


    }







    const favorito =

        clone.querySelector(
            ".favorito"
        );



    if(favorito){


        favorito.innerHTML =

            encontrarFavorito(
                jogo,
                prob
            );


    }







    const confianca =

        clone.querySelector(
            ".confianca"
        );



    if(confianca){


        confianca.innerHTML =

            gerarEstrelas(
                prob
            );


    }







    const botao =

        clone.querySelector(
            ".btnDetalhes"
        );



    if(botao){


        botao.onclick = ()=>{


            abrirAnaliseJogo(
                jogo
            );


        };


    }






    return clone;


}










// ==========================================
// PROBABILIDADE SIMULADA IA
// ==========================================


function gerarProbabilidades(
    jogo
){



    const base =

        Math.random();



    let casa =

        Math.floor(
            45 +
            base * 20
        );



    let empate =

        Math.floor(
            20 +
            base * 10
        );



    let fora =

        100 -
        casa -
        empate;




    if(fora < 10){


        fora = 10;


        casa =

            100 -
            empate -
            fora;


    }




    return {


        casa,

        empate,

        fora


    };


}








// ==========================================
// FAVORITO
// ==========================================


function encontrarFavorito(
    jogo,
    prob
){


    if(
        prob.casa >=
        prob.fora
    ){

        return jogo.casa;


    }


    return jogo.fora;


}








// ==========================================
// PLACAR IA
// ==========================================


function preverPlacar(
    prob
){


    if(prob.casa > prob.fora){


        return "2 x 1";


    }



    return "1 x 2";


}








// ==========================================
// ESTRELAS
// ==========================================


function gerarEstrelas(
    prob
){


    const maior =

        Math.max(

            prob.casa,

            prob.empate,

            prob.fora

        );



    if(maior >=70){

        return "⭐⭐⭐⭐⭐";

    }


    if(maior >=60){

        return "⭐⭐⭐⭐";

    }


    return "⭐⭐⭐";


}
// ==========================================
// BetVision AI
// public/app.js
// PARTE 3/4
// Value Bets + Análises
// ==========================================


// ==========================================
// CARREGAR VALUE BETS
// ==========================================


async function carregarValueBets(){


    console.log(
        "💎 Buscando Value Bets..."
    );



    const resposta =

        await apiGET(

            CONFIG.endpoints.valuebets

        );



    if(!resposta){


        return;


    }



    const lista =


        Array.isArray(resposta)

        ?

        resposta

        :

        resposta.valuebets ||

        resposta.jogos ||

        [];





    APP.valuebets = lista;




    renderizarValueBets();




    preencherTexto(

        "valueBets",

        lista.length

    );



    adicionarLog(

        `💎 ${lista.length} Value Bets carregadas`

    );


}









// ==========================================
// RENDER VALUE BETS
// ==========================================


function renderizarValueBets(){



    const container =

        $("listaValueBets");



    if(!container){

        return;

    }




    container.innerHTML = "";






    if(!APP.valuebets.length){



        container.innerHTML = `


        <div class="card-value">


            Nenhuma Value Bet encontrada.


        </div>


        `;



        return;


    }








    APP.valuebets.forEach(item=>{


        const card =

            criarCardValue(
                item
            );



        container.appendChild(
            card
        );



    });




}









// ==========================================
// CRIAR CARD VALUE
// ==========================================


function criarCardValue(
    item
){



    const template =

        $("templateValue");



    if(!template){


        return document.createElement(
            "div"
        );


    }




    const clone =

        template.content
        .cloneNode(true);







    preencherClone(

        clone,

        ".jogo",

        item.jogo ||

        `${item.casa || ""} x ${item.fora || ""}`

    );





    preencherClone(

        clone,

        ".mercado",

        item.mercado ||

        "Vitória Casa"

    );





    preencherClone(

        clone,

        ".odd",

        item.odd ??

        0

    );





    preencherClone(

        clone,

        ".oddJusta",

        item.oddJusta ??

        calcularOddJustaLocal(

            item.probabilidade ||

            item.probabilidadeIA ||

            0

        )

    );







    preencherClone(

        clone,

        ".edge",

        `${item.edge ?? 0}%`

    );







    preencherClone(

        clone,

        ".roi",

        `${item.roi ?? item.ROI ?? 0}%`

    );







    preencherClone(

        clone,

        ".kelly",

        `${item.kelly ?? 0}%`

    );







    const classificacao =

        clone.querySelector(

            ".classificacao"

        );



    if(classificacao){



        classificacao.innerHTML =

            item.classificacao ||

            classificarLocal(

                item.edge

            );


    }







    return clone;


}









// ==========================================
// AUXILIARES VALUE BET
// ==========================================


function calcularOddJustaLocal(
    prob
){


    prob =
        Number(prob);



    if(!prob){

        return 0;

    }



    return Number(

        (
            100 /
            prob

        )
        .toFixed(2)

    );


}







function classificarLocal(
    edge
){



    edge =
        Number(edge);



    if(edge >=25)

        return "⭐⭐⭐⭐⭐ Excelente";



    if(edge >=15)

        return "⭐⭐⭐⭐ Muito Boa";



    if(edge >=10)

        return "⭐⭐⭐ Boa";



    if(edge >=5)

        return "⭐⭐ Moderada";



    return "Sem Valor";


}








function preencherClone(
    clone,
    seletor,
    valor
){



    const elemento =

        clone.querySelector(
            seletor
        );



    if(elemento){


        elemento.innerHTML =

            valor ?? "-";


    }


}









// ==========================================
// CARREGAR ANÁLISES IA
// ==========================================


async function carregarAnalises(){



    const resposta =

        await apiGET(

            CONFIG.endpoints.analises

        );




    if(!resposta){


        return;


    }






    const lista =


        Array.isArray(resposta)

        ?

        resposta

        :

        resposta.analises ||

        [];





    APP.analises = lista;



    renderizarAnalises();





    preencherTexto(

        "analisesIA",

        lista.length

    );



}









// ==========================================
// RENDER ANALISES
// ==========================================


function renderizarAnalises(){


    const container =

        $("listaAnalises");



    if(!container){

        return;

    }





    container.innerHTML="";





    if(!APP.analises.length){



        container.innerHTML = `


        <div class="card-analise">

            Nenhuma análise IA disponível.

        </div>


        `;



        return;


    }






    APP.analises.forEach(item=>{


        const card =

            criarCardAnalise(
                item
            );



        container.appendChild(
            card
        );


    });


}








// ==========================================
// CARD ANALISE IA
// ==========================================


function criarCardAnalise(
    item
){


    const template =

        $("templateAnalise");



    if(!template){


        return document.createElement(
            "div"
        );


    }




    const clone =

        template.content
        .cloneNode(true);






    preencherClone(

        clone,

        ".titulo",

        item.jogo ||

        "Jogo analisado"

    );



    preencherClone(

        clone,

        ".favorito",

        item.favorito ||

        "-"

    );



    preencherClone(

        clone,

        ".probabilidade",

        `${item.probabilidade ?? 0}%`

    );



    preencherClone(

        clone,

        ".placar",

        item.placar ||

        "2 x 1"

    );



    preencherClone(

        clone,

        ".gols",

        item.gols ||

        "2.5"

    );



    preencherClone(

        clone,

        ".over",

        item.over ||

        "SIM"

    );



    preencherClone(

        clone,

        ".confianca",

        item.confianca ||

        "Alta"

    );



    return clone;


}






// ==========================================
// ABRIR ANALISE MODAL
// ==========================================


function abrirAnaliseJogo(
    jogo
){


    const modal =

        $("modalIA");



    const conteudo =

        $("conteudoModal");



    if(!modal || !conteudo){

        return;

    }




    conteudo.innerHTML = `


    <div class="analise-completa">


        <h3>

        ${jogo.casa}

        x

        ${jogo.fora}

        </h3>


        <p>

        🤖 A IA está processando estatísticas da partida.

        </p>


        <p>

        Modelo:
        BetVision Statistical AI

        </p>


    </div>


    `;




    modal.classList.add(
        "ativo"
    );



}
// ==========================================
// BetVision AI
// public/app.js
// PARTE 4/4
// Finalização Dashboard
// ==========================================


// ==========================================
// GRÁFICOS
// ==========================================


function criarGraficos(){


    if(
        typeof Chart === "undefined"
    ){

        console.warn(
            "Chart.js não carregado"
        );

        return;

    }




    const graficoAnalises =

        document.getElementById(
            "graficoAnalises"
        );



    const graficoValue =

        document.getElementById(
            "graficoValue"
        );







    if(graficoAnalises){



        APP.charts.analises =

            new Chart(

                graficoAnalises,

                {


                    type:"doughnut",


                    data:{


                        labels:[

                            "Análises IA",

                            "Pendentes"

                        ],



                        datasets:[{

                            data:[

                                APP.analises.length,

                                Math.max(
                                    0,
                                    100 -
                                    APP.analises.length
                                )

                            ]

                        }]


                    },



                    options:{


                        responsive:true


                    }



                }

            );



    }









    if(graficoValue){



        APP.charts.value =

            new Chart(

                graficoValue,

                {



                    type:"bar",



                    data:{


                        labels:[

                            "Value Bets"

                        ],



                        datasets:[{


                            label:

                            "Oportunidades",



                            data:[

                                APP.valuebets.length

                            ]



                        }]


                    },



                    options:{


                        responsive:true


                    }



                }

            );


    }



}









// ==========================================
// ATUALIZAR GRÁFICOS
// ==========================================


function atualizarGraficos(){



    if(APP.charts.analises){



        APP.charts.analises.data.datasets[0].data = [


            APP.analises.length,


            Math.max(

                0,

                100 -
                APP.analises.length

            )


        ];



        APP.charts.analises.update();



    }






    if(APP.charts.value){



        APP.charts.value.data.datasets[0].data = [


            APP.valuebets.length


        ];



        APP.charts.value.update();


    }



}









// ==========================================
// WEBSOCKET
// ==========================================


function conectarWebSocket(){



    try{



        const ws =

            new WebSocket(

                CONFIG.websocket

            );




        ws.onopen = ()=>{


            APP.conectado =
                true;



            preencherTexto(

                "wsStatus",

                "Conectado"

            );



            adicionarLog(

                "🔌 WebSocket conectado"

            );


        };







        ws.onmessage = evento=>{


            try{


                const dados =

                    JSON.parse(

                        evento.data

                    );



                console.log(

                    "WS",

                    dados

                );



                carregarDashboard();



            }

            catch(error){


                console.log(
                    evento.data
                );


            }


        };







        ws.onerror = ()=>{


            preencherTexto(

                "wsStatus",

                "Erro"

            );


        };







        ws.onclose = ()=>{


            APP.conectado =
                false;



            preencherTexto(

                "wsStatus",

                "Desconectado"

            );



            setTimeout(

                conectarWebSocket,

                10000

            );


        };





    }

    catch(error){


        preencherTexto(

            "wsStatus",

            "Indisponível"

        );


    }



}









// ==========================================
// BOTÃO ATUALIZAR
// ==========================================


function configurarBotoes(){



    const btn =

        $("btnAtualizar");



    if(btn){



        btn.onclick = async ()=>{



            mostrarToast(

                "Atualizando dados..."

            );



            await carregarDashboard();



            await carregarJogos();



            await carregarValueBets();



            await carregarAnalises();



            atualizarGraficos();



            mostrarToast(

                "Atualização concluída"

            );



        };


    }







    const fechar =

        $("fecharModal");



    if(fechar){



        fechar.onclick = ()=>{


            const modal =

                $("modalIA");



            if(modal){


                modal.classList.remove(

                    "ativo"

                );


            }


        };


    }



}









// ==========================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==========================================


function iniciarAtualizacaoAutomatica(){



    setInterval(async ()=>{



        await carregarDashboard();



    },60000);



}









// ==========================================
// INICIAR SISTEMA
// ==========================================


document.addEventListener(

"DOMContentLoaded",

async ()=>{



    console.log(

        "🚀 Inicializando BetVision AI"

    );



    await iniciarAplicacao();



    await carregarJogos();



    await carregarValueBets();



    await carregarAnalises();




    criarGraficos();



    configurarBotoes();



    conectarWebSocket();



    iniciarAtualizacaoAutomatica();



    atualizarGraficos();



}

);
