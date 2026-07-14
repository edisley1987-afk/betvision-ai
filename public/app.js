// ==========================================
// BetVision AI - Frontend
// public/app.js
// ==========================================


document.addEventListener("DOMContentLoaded", () => {

    carregarDashboard();
    carregarValueBets();
    conectarWebSocket();

});



// ==========================================
// DASHBOARD
// ==========================================


async function carregarDashboard(){

try{


const resposta = await fetch("/api/dashboard");


if(!resposta.ok){

throw new Error("Dashboard indisponível");

}


const dados = await resposta.json();



atualizarKPIs(dados);


carregarCampeonatos();



}catch(erro){


console.error(
"Erro dashboard:",
erro
);


mostrarMensagem(
"oportunidades",
"Servidor indisponível"
);


}

}





// ==========================================
// KPIs
// ==========================================


function atualizarKPIs(dados){


atualizarElemento(
"jogosHoje",
dados.jogosHoje ?? 0
);


atualizarElemento(
"valueBets",
dados.valueBets ?? 0
);


atualizarElemento(
"analisesIA",
dados.analisesIA ?? 0
);



atualizarElemento(
"roiPrevisto",
(dados.roi ?? 0)+"%"
);



atualizarElemento(
"precisaoIA",
(dados.precisao ?? 0)+"%"
);



}







// ==========================================
// CAMPEONATOS
// ==========================================


async function carregarCampeonatos(){


try{


const resposta =
await fetch("/api/campeonatos");



if(!resposta.ok){

throw new Error();

}



const dados =
await resposta.json();



mostrarMensagem(

"analises",

`Base carregada com ${dados.total ?? dados.length ?? 0} campeonatos.`

);



}catch(erro){


mostrarMensagem(

"analises",

"Erro carregando campeonatos."

);


}


}







// ==========================================
// VALUE BETS
// ==========================================


async function carregarValueBets(){


try{


const resposta =
await fetch("/api/valuebets");



if(!resposta.ok){

return;

}



const dados =
await resposta.json();



mostrarMensagem(

"oportunidades",

`${dados.length ?? 0} oportunidades encontradas.`

);



}catch(erro){


console.error(
"Erro value bets",
erro
);


}


}







// ==========================================
// WEBSOCKET
// ==========================================


let socket;



function conectarWebSocket(){



const protocolo =
location.protocol === "https:"
?
"wss"
:
"ws";



socket =
new WebSocket(

`${protocolo}://${location.host}`

);



socket.onopen = ()=>{


console.log(
"BetVision AI WebSocket conectado"
);


};





socket.onmessage=(evento)=>{


try{


const dados =
JSON.parse(evento.data);



console.log(
"Atualização IA:",
dados
);



if(dados.dashboard){

atualizarKPIs(
dados.dashboard
);

}



if(dados.tipo==="valuebet"){

carregarValueBets();

}



}catch(erro){


console.error(
"Mensagem inválida WS",
erro
);


}


};





socket.onerror=()=>{


console.log(
"Erro WebSocket"
);


};





socket.onclose=()=>{


console.log(
"Reconectando WebSocket..."
);



setTimeout(

conectarWebSocket,

5000

);


};



}







// ==========================================
// UTILITÁRIOS
// ==========================================


function atualizarElemento(id,valor){


const elemento =
document.getElementById(id);



if(elemento){

elemento.textContent = valor;

}


}





function mostrarMensagem(id,texto){


const elemento =
document.getElementById(id);



if(elemento){

elemento.innerHTML = texto;

}


}
