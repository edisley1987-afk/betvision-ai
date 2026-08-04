// ======================================================
// BetVision AI
// Frontend Production v5.0
// public/app.js
// Arquivo único consolidado
// PARTE 1/4
// ======================================================


"use strict";



// ======================================================
// CONFIGURAÇÃO GLOBAL
// ======================================================


const CONFIG = {


    app:

        "BetVision AI",


    version:

        "5.0.0",


    apiBase:

        "",


    websocket:

        null,


    timeout:

        15000,


    refresh:

        60000,


    ambiente:

        location.hostname === "localhost"

            ?

            "development"

            :

            "production"


};





// ======================================================
// ESTADO GLOBAL
// ======================================================


const STATE = {


    jogos: [],


    valueBets: [],


    analises: [],


    dashboard: {},


    carregando:false,


    ultimaAtualizacao:null,


    erro:null


};





// ======================================================
// USUÁRIO
// ======================================================


const USUARIO = {


    logado:false,


    token:null,


    dados:{


        nome:"Visitante",


        plano:"free"


    }


};





// ======================================================
// BANCA
// ======================================================


const BANCA = {


    saldo:0,


    lucro:0,


    roi:0,


    apostas:[]


};





// ======================================================
// HISTÓRICO
// ======================================================


const HISTORICO = {


    apostas:[],


    resultados:[]


};





// ======================================================
// FAVORITOS
// ======================================================


const FAVORITOS = {


    jogos:[],


    times:[]


};





// ======================================================
// NOTIFICAÇÕES
// ======================================================


const NOTIFICACOES = {


    lista:[],


    naoLidas:0


};





// ======================================================
// UTILIDADES
// ======================================================


function formatarNumero(valor){


    return Number(valor || 0)

        .toFixed(2);


}




function percentual(valor){


    return `${Number(valor || 0).toFixed(0)}%`;


}




function sanitizarTexto(texto){


    if(!texto)

        return "";


    return String(texto)

        .replace(/[<>]/g,"");

}



// ======================================================
// CLIENTE API
// ======================================================


async function requisicaoAPI(

    rota,

    opcoes={}

){


    try{


        const controller =

            new AbortController();



        const timeout = setTimeout(()=>{


            controller.abort();


        }, CONFIG.timeout);





        const resposta = await fetch(


            CONFIG.apiBase + rota,


            {


                method:

                    opcoes.method || "GET",



                headers:{


                    "Content-Type":

                        "application/json",



                    ...(USUARIO.token && {


                        Authorization:

                            `Bearer ${USUARIO.token}`


                    })

                },



                body:

                    opcoes.body

                        ?

                        JSON.stringify(opcoes.body)

                        :

                        undefined,



                signal:

                    controller.signal


            }


        );





        clearTimeout(timeout);





        const dados = await resposta.json()

            .catch(()=>({}));





        if(!resposta.ok){


            throw new Error(

                dados.erro ||

                "Erro API"

            );


        }





        return dados;



    }

    catch(erro){



        console.error(

            "Erro API:",

            erro.message

        );



        STATE.erro = erro.message;



        return null;



    }


}





// ======================================================
// ENDPOINTS PRINCIPAIS
// ======================================================


async function buscarDashboard(){


    const dados = await requisicaoAPI(

        "/api/dashboard"

    );


    if(dados){


        STATE.dashboard = dados;


        STATE.ultimaAtualizacao =

            new Date();


    }


    return dados;


}





async function buscarJogos(){


    const dados = await requisicaoAPI(

        "/api/jogos"

    );


    if(dados){


        STATE.jogos =

            processarJogosAPI(dados);


    }


    return STATE.jogos;


}





async function buscarValueBets(){


    const dados = await requisicaoAPI(

        "/api/valuebets"

    );


    if(dados){


        STATE.valueBets =

            processarValueBetsAPI(dados);


    }


    return STATE.valueBets;


}





async function buscarAnalises(){


    const dados = await requisicaoAPI(

        "/api/analises"

    );


    if(dados){


        STATE.analises =

            processarAnalisesAPI(dados);


    }


    return STATE.analises;


}






// ======================================================
// LOGIN
// ======================================================


async function loginUsuario(

    email,

    senha

){


    const resposta = await requisicaoAPI(

        "/auth/login",

        {


            method:"POST",


            body:{


                email,


                senha


            }


        }

    );





    if(resposta?.token){



        USUARIO.logado=true;


        USUARIO.token=

            resposta.token;



        USUARIO.dados=

            resposta.usuario || {};



    }



    return resposta;


}





// ======================================================
// SESSÃO
// ======================================================


function usuarioLogado(){


    return USUARIO.logado;


}





// ======================================================
// BACKUP LOCAL
// ======================================================


function salvarLocal(){


    localStorage.setItem(

        "betvision_state",

        JSON.stringify({

            usuario:USUARIO,

            banca:BANCA,

            favoritos:FAVORITOS,

            historico:HISTORICO

        })

    );


}





function carregarLocal(){


    const dados =

        localStorage.getItem(

            "betvision_state"

        );



    if(!dados)

        return;



    try{


        const backup =

            JSON.parse(dados);



        Object.assign(

            USUARIO,

            backup.usuario || {}

        );


        Object.assign(

            BANCA,

            backup.banca || {}

        );



        Object.assign(

            FAVORITOS,

            backup.favoritos || {}

        );



        Object.assign(

            HISTORICO,

            backup.historico || {}

        );


    }

    catch(e){


        console.warn(

            "Backup inválido"

        );


    }


}





// ======================================================
// EXPORTAÇÃO PARCIAL
// ======================================================


window.CONFIG = CONFIG;

window.STATE = STATE;

window.USUARIO = USUARIO;

window.BANCA = BANCA;

window.HISTORICO = HISTORICO;

window.FAVORITOS = FAVORITOS;

window.NOTIFICACOES = NOTIFICACOES;


window.requisicaoAPI = requisicaoAPI;

window.buscarDashboard = buscarDashboard;

window.buscarJogos = buscarJogos;

window.buscarValueBets = buscarValueBets;

window.buscarAnalises = buscarAnalises;

window.loginUsuario = loginUsuario;

window.usuarioLogado = usuarioLogado;

window.sanitizarTexto = sanitizarTexto;



// ======================================================
// FIM PARTE 1/4
// ======================================================
// ======================================================
// BetVision AI
// Frontend Production v5.0
// public/app.js
// Arquivo único consolidado
// PARTE 2/4
// ======================================================


"use strict";



// ======================================================
// NORMALIZADOR DE JOGOS
// Compatível com múltiplos formatos do backend
// ======================================================


function normalizarJogo(jogo){


    if(!jogo)

        return null;



    return {


        id:

            jogo.id ||

            jogo.idEvent ||

            jogo.event_id ||

            Date.now(),



        campeonato:

            jogo.campeonato ||

            jogo.league ||

            jogo.strLeague ||

            "Futebol",



        casa:

            jogo.casa ||

            jogo.home ||

            jogo.homeTeam ||

            jogo.home_team ||

            jogo.strHomeTeam ||

            "Time Casa",



        fora:

            jogo.fora ||

            jogo.away ||

            jogo.awayTeam ||

            jogo.away_team ||

            jogo.strAwayTeam ||

            "Time Visitante",



        horario:

            jogo.horario ||

            jogo.time ||

            jogo.dateEvent ||

            null,



        status:

            jogo.status ||

            "Agendado"



    };


}





// ======================================================
// PROCESSADOR DE JOGOS
// ======================================================


function processarJogosAPI(resposta){


    const lista =


        resposta.jogos ||

        resposta.data ||

        resposta.eventos ||

        resposta;



    if(!Array.isArray(lista))

        return [];



    return lista

        .map(normalizarJogo)

        .filter(Boolean);


}





// ======================================================
// NORMALIZAR ODDS
// ======================================================


function extrairOdd(dados){


    return Number(


        dados.odd ||

        dados.odds ||

        dados.valorOdd ||

        dados.odd_home ||

        dados.homeOdd ||

        dados.home_odds ||

        0


    );


}





function normalizarOdds(dados){


    return {


        casa:

            Number(

                dados.oddCasa ||

                dados.odd_home ||

                dados.homeOdd ||

                dados.odd1 ||

                dados.odd ||

                0

            ),



        empate:

            Number(

                dados.oddEmpate ||

                dados.odd_draw ||

                dados.drawOdd ||

                0

            ),



        fora:

            Number(

                dados.oddFora ||

                dados.odd_away ||

                dados.awayOdd ||

                dados.odd2 ||

                0

            )


    };


}





// ======================================================
// NORMALIZADOR VALUE BET
// CORREÇÃO DEFINITIVA
// undefined x undefined
// ======================================================


function normalizarValueBet(item){


    if(!item)

        return null;



    const jogo = normalizarJogo(item);



    const odds = normalizarOdds(item);



    return {


        id:

            item.id ||

            jogo.id,



        casa:

            jogo.casa,



        fora:

            jogo.fora,



        campeonato:

            jogo.campeonato,



        mercado:

            item.mercado ||

            item.market ||

            item.tipo ||

            "Vitória Casa",



        odd:

            extrairOdd(item) ||

            odds.casa,



        probabilidade:

            Number(

                item.probabilidade ||

                item.probability ||

                item.chance ||

                item.confidence ||

                item.percentual ||

                0

            ),



        valor:

            Number(

                item.valor ||

                item.value ||

                item.edge ||

                0

            ),



        status:

            "VALUE BET"



    };


}





// ======================================================
// PROCESSAR VALUE BETS
// ======================================================


function processarValueBetsAPI(resposta){


    const lista =


        resposta.valuebets ||

        resposta.valueBets ||

        resposta.data ||

        resposta;



    if(!Array.isArray(lista))

        return [];



    return lista

        .map(normalizarValueBet)

        .filter(Boolean);


}





// ======================================================
// NORMALIZADOR ANÁLISE IA
// ======================================================


function normalizarAnalise(item){


    if(!item)

        return null;



    const jogo = normalizarJogo(item);



    return {


        id:

            item.id ||

            jogo.id,



        casa:

            jogo.casa,



        fora:

            jogo.fora,



        previsao:

            item.previsao ||

            item.prediction ||

            item.predicao ||

            "Análise pendente",



        confianca:

            Number(

                item.confianca ||

                item.confidence ||

                item.precisao ||

                0

            ),



        modelo:

            item.modelo ||

            "IA Estatística"


    };


}





function processarAnalisesAPI(resposta){


    const lista =


        resposta.analises ||

        resposta.data ||

        resposta;



    if(!Array.isArray(lista))

        return [];



    return lista

        .map(normalizarAnalise)

        .filter(Boolean);


}





// ======================================================
// CÁLCULO VALUE BET
// ======================================================


function calcularValueBet(

    odd,

    probabilidade

){


    const prob =

        Number(probabilidade) / 100;



    const valorJusto =

        prob > 0

        ?

        1 / prob

        :

        0;



    const edge =


        (

            odd /

            valorJusto

        )

        -

        1;



    return {


        odd,

        probabilidade,

        valor:

            Number(

                edge * 100

            .toFixed(2)

            )


    };


}





// ======================================================
// VALIDAÇÃO VALUE BET
// ======================================================


function validarValueBet(item){


    return Boolean(


        item &&


        item.casa &&


        item.fora &&


        item.odd > 1 &&


        item.probabilidade > 0


    );


}





// ======================================================
// PREPARAR CARD VALUE BET
// ======================================================


function prepararCardValueBet(item){


    return {


        casa:

            item.casa ||

            "Time Casa",



        fora:

            item.fora ||

            "Time Visitante",



        mercado:

            item.mercado ||

            "Mercado",



        odd:

            formatarNumero(

                item.odd

            ),



        probabilidade:

            percentual(

                item.probabilidade

            ),



        valor:

            percentual(

                item.valor

            ),



        status:

            item.status || "VALUE BET"


    };


}





// ======================================================
// RENDERIZAÇÃO VALUE BETS
// ======================================================


function renderizarMelhoresValueBets(){


    const area =


        document.getElementById(

            "listaValueBets"

        );



    if(!area)

        return;



    if(

        STATE.valueBets.length === 0

    ){


        area.innerHTML =

            `

            <div class="empty">

            Nenhuma Value Bet encontrada

            </div>

            `;


        return;


    }



    area.innerHTML =


        STATE.valueBets

        .filter(validarValueBet)

        .map(item=>{


            const card =

                prepararCardValueBet(item);



            return `

            <div class="value-card">


                <h3>

                ${card.casa}

                x

                ${card.fora}

                </h3>


                <p>

                Mercado:

                ${card.mercado}

                </p>


                <p>

                Odd:

                ${card.odd}

                </p>


                <p>

                Probabilidade:

                ${card.probabilidade}

                </p>


                <strong>

                ${card.status}

                </strong>


            </div>

            `;


        })

        .join("");


}





// ======================================================
// IA - GERAÇÃO DE RESUMO
// ======================================================


function gerarAnaliseIA(jogo){


    return {


        jogo:

            `${jogo.casa} x ${jogo.fora}`,



        confianca:

            jogo.probabilidade || 0,



        resumo:

            "Análise baseada em probabilidade estatística."


    };


}





// ======================================================
// EXPORTAÇÃO PARTE 2
// ======================================================


window.normalizarJogo = normalizarJogo;

window.processarJogosAPI = processarJogosAPI;

window.normalizarValueBet = normalizarValueBet;

window.processarValueBetsAPI = processarValueBetsAPI;

window.normalizarAnalise = normalizarAnalise;

window.processarAnalisesAPI = processarAnalisesAPI;

window.calcularValueBet = calcularValueBet;

window.validarValueBet = validarValueBet;

window.renderizarMelhoresValueBets = renderizarMelhoresValueBets;

window.gerarAnaliseIA = gerarAnaliseIA;



// ======================================================
// FIM PARTE 2/4
// ======================================================
// ======================================================
// BetVision AI
// Frontend Production v5.0
// public/app.js
// Arquivo único consolidado
// PARTE 3/4
// ======================================================


"use strict";



// ======================================================
// DASHBOARD
// ======================================================


function atualizarDashboardCompleto(){


    const jogos =

        document.getElementById(

            "totalJogos"

        );



    const valuebets =

        document.getElementById(

            "totalValueBets"

        );



    const analises =

        document.getElementById(

            "totalAnalises"

        );



    const saldo =

        document.getElementById(

            "saldoBanca"

        );





    if(jogos)

        jogos.innerHTML =

            STATE.jogos.length;



    if(valuebets)

        valuebets.innerHTML =

            STATE.valueBets.length;



    if(analises)

        analises.innerHTML =

            STATE.analises.length;



    if(saldo)

        saldo.innerHTML =


            `R$ ${formatarNumero(BANCA.saldo)}`;



}









// ======================================================
// SINCRONIZAÇÃO DO SISTEMA
// ======================================================


async function sincronizarSistema(){


    try{


        STATE.carregando = true;



        await Promise.all([


            buscarDashboard(),


            buscarJogos(),


            buscarValueBets(),


            buscarAnalises()


        ]);





        atualizarDashboardCompleto();



        renderizarMelhoresValueBets();



        salvarLocal();



        STATE.ultimaAtualizacao =

            new Date();



    }

    catch(erro){


        STATE.erro =

            erro.message;


    }

    finally{


        STATE.carregando = false;


    }


}









// ======================================================
// WEBSOCKET REALTIME
// ======================================================


let WS_CLIENT = null;





function conectarWebSocket(){


    try{


        const protocolo =

            location.protocol === "https:"

            ?

            "wss"

            :

            "ws";





        WS_CLIENT = new WebSocket(


            `${protocolo}://${location.host}`


        );





        WS_CLIENT.onopen = ()=>{


            console.log(

                "WebSocket conectado"

            );


        };





        WS_CLIENT.onmessage = evento=>{


            try{


                const dados =


                    JSON.parse(

                        evento.data

                    );





                processarAlertaRealtime(

                    dados

                );


            }

            catch(e){}



        };





        WS_CLIENT.onerror = ()=>{


            console.warn(

                "Erro WebSocket"

            );


        };





        WS_CLIENT.onclose = ()=>{


            setTimeout(

                conectarWebSocket,

                5000

            );


        };


    }

    catch(e){



        console.warn(

            "WebSocket indisponível"

        );


    }


}









function processarAlertaRealtime(dados){


    if(!dados)

        return;



    criarNotificacao(


        dados.mensagem ||

        "Atualização recebida"



    );



    sincronizarSistema();



}









// ======================================================
// GESTÃO DE BANCA
// ======================================================


function calcularStake(

    banca,

    risco

){


    const percentualRisco =


        Number(risco || 1) / 100;



    return Number(

        banca *

        percentualRisco

    .toFixed(2));


}





function registrarAposta(aposta){


    if(!aposta)

        return;



    BANCA.apostas.push(

        aposta

    );



    HISTORICO.apostas.push(

        aposta

    );



    salvarLocal();



}





function calcularROI(){


    if(

        BANCA.apostas.length === 0

    )

        return 0;



    const total =


        BANCA.apostas.reduce(

            (s,a)=>

                s + Number(a.valor || 0),

            0

        );





    const lucro =


        BANCA.apostas.reduce(

            (s,a)=>

                s + Number(a.lucro || 0),

            0

        );





    return Number(

        (

            lucro /

            total

        )

        *

        100

    .toFixed(2));


}









// ======================================================
// FAVORITOS
// ======================================================


function adicionarFavorito(item){


    if(!item)

        return;



    if(

        !FAVORITOS.jogos.some(

            j=>j.id===item.id

        )

    ){



        FAVORITOS.jogos.push(

            item

        );


    }



    salvarLocal();


}









function removerFavorito(id){


    FAVORITOS.jogos =


        FAVORITOS.jogos.filter(

            item=>

                item.id !== id

        );



    salvarLocal();


}









function listarFavoritos(){


    return FAVORITOS.jogos;


}









// ======================================================
// HISTÓRICO
// ======================================================


function adicionarHistorico(item){


    if(!item)

        return;



    HISTORICO.resultados.push(

        item

    );



    salvarLocal();


}









function obterHistorico(){


    return HISTORICO;


}









// ======================================================
// NOTIFICAÇÕES
// ======================================================


function criarNotificacao(

    mensagem

){


    const notificacao = {


        id:

            Date.now(),



        mensagem:

            sanitizarTexto(

                mensagem

            ),



        data:

            new Date()

            .toISOString(),



        lida:false


    };





    NOTIFICACOES.lista.unshift(

        notificacao

    );



    NOTIFICACOES.naoLidas++;



    salvarLocal();



    return notificacao;


}









function limparNotificacoes(){


    NOTIFICACOES.lista=[];



    NOTIFICACOES.naoLidas=0;



    salvarLocal();


}









// ======================================================
// CARREGAMENTO AUTOMÁTICO
// ======================================================


function iniciarAtualizacaoAutomatica(){


    setInterval(


        ()=>{


            sincronizarSistema();



        },


        CONFIG.refresh


    );


}









// ======================================================
// EXPORTAÇÃO PARTE 3
// ======================================================


window.atualizarDashboardCompleto =

    atualizarDashboardCompleto;



window.sincronizarSistema =

    sincronizarSistema;



window.conectarWebSocket =

    conectarWebSocket;



window.processarAlertaRealtime =

    processarAlertaRealtime;



window.calcularStake =

    calcularStake;



window.registrarAposta =

    registrarAposta;



window.calcularROI =

    calcularROI;



window.adicionarFavorito =

    adicionarFavorito;



window.removerFavorito =

    removerFavorito;



window.listarFavoritos =

    listarFavoritos;



window.adicionarHistorico =

    adicionarHistorico;



window.obterHistorico =

    obterHistorico;



window.criarNotificacao =

    criarNotificacao;



window.limparNotificacoes =

    limparNotificacoes;



window.iniciarAtualizacaoAutomatica =

    iniciarAtualizacaoAutomatica;



// ======================================================
// FIM PARTE 3/4
// ======================================================
// ======================================================
// BetVision AI
// Frontend Production v5.0
// public/app.js
// Arquivo único consolidado
// PARTE 4/4
// ======================================================


"use strict";



// ======================================================
// AUDITORIA DO SISTEMA
// ======================================================


const AUDITORIA = {


    erros: [],


    avisos: [],


    sucesso: []

};









function registrarErro(

    mensagem

){


    AUDITORIA.erros.push(

        mensagem

    );


}





function registrarSucesso(

    mensagem

){


    AUDITORIA.sucesso.push(

        mensagem

    );


}









// ======================================================
// HEALTH CHECK
// ======================================================


function healthCheck(){


    const checks = {


        api:

            typeof requisicaoAPI ===

            "function",



        jogos:

            typeof buscarJogos ===

            "function",



        valuebets:

            typeof renderizarMelhoresValueBets ===

            "function",



        dashboard:

            typeof atualizarDashboardCompleto ===

            "function",



        websocket:

            typeof conectarWebSocket ===

            "function",



        usuario:

            typeof loginUsuario ===

            "function"


    };





    Object.entries(checks)

    .forEach(([nome,status])=>{


        if(status){


            registrarSucesso(

                nome + " OK"

            );


        }

        else{


            registrarErro(

                nome + " indisponível"

            );


        }


    });





    return {


        status:

            AUDITORIA.erros.length === 0

            ?

            "ONLINE"

            :

            "ATENÇÃO",



        sucesso:

            AUDITORIA.sucesso.length,



        erros:

            AUDITORIA.erros.length



    };


}









// ======================================================
// DIAGNÓSTICO
// ======================================================


function diagnosticoSistema(){


    return {


        sistema:

            CONFIG.app,



        versao:

            CONFIG.version,



        ambiente:

            CONFIG.ambiente,



        jogos:

            STATE.jogos.length,



        valueBets:

            STATE.valueBets.length,



        analises:

            STATE.analises.length,



        usuario:

            USUARIO.dados.nome,



        ultimaAtualizacao:

            STATE.ultimaAtualizacao

    };


}









// ======================================================
// LIMPEZA DE MEMÓRIA
// ======================================================


function otimizarMemoria(){


    if(

        STATE.jogos.length > 500

    ){


        STATE.jogos =

            STATE.jogos.slice(

                0,

                500

            );


    }





    if(

        STATE.valueBets.length > 200

    ){


        STATE.valueBets =

            STATE.valueBets.slice(

                0,

                200

            );


    }





    if(

        HISTORICO.apostas.length > 500

    ){


        HISTORICO.apostas =

            HISTORICO.apostas.slice(

                0,

                500

            );


    }


}









// ======================================================
// BOOT PRINCIPAL
// ======================================================


async function iniciarBetVision(){



    if(

        window.BETVISION_INICIADO

    ){


        return;


    }





    window.BETVISION_INICIADO = true;





    console.log(

        "================================"

    );





    console.log(

        "🚀 Inicializando BetVision AI"

    );





    console.log(

        "Versão:",

        CONFIG.version

    );





    carregarLocal();





    conectarWebSocket();





    await sincronizarSistema();





    iniciarAtualizacaoAutomatica();





    otimizarMemoria();





    console.log(

        healthCheck()

    );





    console.log(

        diagnosticoSistema()

    );





    console.log(

        "✅ BetVision AI ONLINE"

    );





    console.log(

        "================================"

    );


}









// ======================================================
// EVENTO DE INICIALIZAÇÃO
// ======================================================


window.addEventListener(

    "DOMContentLoaded",

    ()=>{


        iniciarBetVision();


    }

);









// ======================================================
// EXPORTAÇÃO FINAL GLOBAL
// ======================================================


window.AUDITORIA =

    AUDITORIA;



window.healthCheck =

    healthCheck;



window.diagnosticoSistema =

    diagnosticoSistema;



window.otimizarMemoria =

    otimizarMemoria;



window.iniciarBetVision =

    iniciarBetVision;



window.BETVISION_VERSION =

    CONFIG.version;



// ======================================================
// FIM APP.JS CONSOLIDADO v5.0
// ======================================================
