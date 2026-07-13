// ======================================================
// BetVision AI - Dashboard Frontend
// app.js
// ======================================================

"use strict";


// ======================================================
// CONFIGURAÇÃO
// ======================================================

const CONFIG = {

    API_DASHBOARD: "/api/dashboard",

    UPDATE_INTERVAL: 30000 // 30 segundos

};


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {


    console.log("🤖 BetVision AI iniciado");


    carregarDashboard();


    setInterval(() => {

        carregarDashboard();

    }, CONFIG.UPDATE_INTERVAL);



});




// ======================================================
// BUSCAR DADOS DA IA
// ======================================================

async function carregarDashboard(){


    try {


        const resposta = await fetch(CONFIG.API_DASHBOARD);



        if(!resposta.ok){

            throw new Error(
                "API retornou erro: " + resposta.status
            );

        }



        const dados = await resposta.json();



        atualizarDashboard(dados);



        atualizarStatusSistema(true);



    } catch(error){



        console.error(
            "Erro carregando dashboard:",
            error
        );



        atualizarStatusSistema(false);



    }



}




// ======================================================
// ATUALIZA DASHBOARD
// ======================================================

function atualizarDashboard(dados){



    atualizarKPIs(dados);



    atualizarJogos(dados);



    atualizarValueBets(dados);



    atualizarModeloIA(dados);



    atualizarUltimaAtualizacao();



}





// ======================================================
// KPIs PRINCIPAIS
// ======================================================

function atualizarKPIs(dados){



    const jogos =
        dados.jogosHoje ??
        dados.totalJogos ??
        0;



    const campeonatos =
        dados.campeonatos ??
        0;



    const analises =
        dados.analisesIA ??
        dados.analises ??
        0;



    const valueBets =
        dados.valueBets ??
        0;



    alterarTexto(
        "totalJogos",
        jogos
    );



    alterarTexto(
        "totalCampeonatos",
        campeonatos
    );



    alterarTexto(
        "totalAnalises",
        analises
    );



    alterarTexto(
        "totalValueBets",
        valueBets
    );



}




// ======================================================
// LISTA DE JOGOS
// ======================================================

function atualizarJogos(dados){



    const container =
        document.getElementById(
            "listaJogos"
        );



    if(!container){

        return;

    }



    const jogos =
        dados.jogos ||
        [];



    if(jogos.length === 0){


        container.innerHTML = `

        <div class="empty">

            Nenhum jogo analisado hoje

        </div>

        `;


        return;

    }




    container.innerHTML = "";




    jogos.forEach(jogo => {



        const card =
        document.createElement(
            "div"
        );



        card.className =
        "card-jogo";



        card.innerHTML = `


        <h3>

        ${jogo.timeCasa ?? "-"}
        x
        ${jogo.timeFora ?? "-"}

        </h3>



        <p>

        Campeonato:
        ${jogo.campeonato ?? "-"}

        </p>



        <p>

        Probabilidade:

        ${jogo.probabilidade ?? 0}%

        </p>



        <p>

        Placar previsto:

        ${jogo.placar ?? "-"}

        </p>


        `;



        container.appendChild(card);



    });




}





// ======================================================
// VALUE BETS
// ======================================================

function atualizarValueBets(dados){



    const container =
    document.getElementById(
        "listaValueBets"
    );



    if(!container){

        return;

    }



    const bets =
    dados.valueBetsLista ||
    dados.valueBetsDados ||
    [];



    if(bets.length === 0){



        container.innerHTML = `

        <div class="empty">

        Nenhuma oportunidade encontrada

        </div>

        `;


        return;


    }





    container.innerHTML = "";




    bets.forEach(bet => {



        const item =
        document.createElement(
            "div"
        );



        item.className =
        "value-bet";



        item.innerHTML = `


        <strong>

        ${bet.jogo ?? "Jogo"}

        </strong>



        <p>

        Mercado:
        ${bet.mercado ?? "-"}

        </p>



        <p>

        Odd:
        ${bet.odd ?? "-"}

        </p>



        <p>

        Valor estimado:

        ${bet.valor ?? "-"}%

        </p>



        `;



        container.appendChild(item);



    });



}





// ======================================================
// MODELO IA
// ======================================================

function atualizarModeloIA(dados){



    const modelo =
    dados.modelo ||
    "Probabilidade + Estatística";



    alterarTexto(
        "modeloIA",
        modelo
    );



}






// ======================================================
// STATUS SISTEMA
// ======================================================

function atualizarStatusSistema(online){



    const elemento =
    document.getElementById(
        "statusSistema"
    );



    if(!elemento){

        return;

    }




    if(online){


        elemento.innerHTML =
        "🟢 IA Online";


        elemento.className =
        "online";



    }else{


        elemento.innerHTML =
        "🔴 API Offline";


        elemento.className =
        "offline";


    }



}





// ======================================================
// DATA/HORA
// ======================================================

function atualizarUltimaAtualizacao(){



    const elemento =
    document.getElementById(
        "ultimaAtualizacao"
    );



    if(!elemento){

        return;

    }



    elemento.innerHTML =
    "Atualizado: "
    +
    new Date()
    .toLocaleString(
        "pt-BR"
    );



}





// ======================================================
// FUNÇÃO AUXILIAR
// ======================================================

function alterarTexto(id, valor){



    const elemento =
    document.getElementById(id);



    if(elemento){

        elemento.innerText =
        valor;

    }



}



// ======================================================
// EXPORTAÇÃO GLOBAL
// ======================================================

window.BetVisionAI = {


    atualizarDashboard,

    carregarDashboard


};
