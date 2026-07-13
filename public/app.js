```javascript
// =======================================
// BetVision AI - Dashboard Frontend
// =======================================


document.addEventListener("DOMContentLoaded", () => {

    carregarDashboard();

});




// =======================================
// Buscar dados da IA
// =======================================

async function carregarDashboard(){

try{


const resposta = await fetch("/api/dashboard");



if(!resposta.ok){

throw new Error("API indisponível");

}



const dados = await resposta.json();





// KPIs

document.getElementById("totalJogos").innerText =
dados.jogos ?? 0;



document.getElementById("valueBets").innerText =
dados.valueBets ?? 0;



document.getElementById("roi").innerText =
(dados.roi ?? 0) + "%";



document.getElementById("precisao").innerText =
(dados.precisao ?? 0) + "%";





// Jogos

mostrarJogos(dados.partidas || []);




}catch(error){


console.error("Erro dashboard:",error);


// fallback caso API não exista

mostrarJogos([

{
competicao:"Brasileirão",
mandante:"Flamengo",
visitante:"Palmeiras",
probabilidade:"58%",
aposta:"Vitória Flamengo"
}


]);


}


}





// =======================================
// Montar cards de jogos
// =======================================


function mostrarJogos(jogos){


const area =
document.getElementById("games");



area.innerHTML="";



if(jogos.length===0){


area.innerHTML=`

<div class="card">

<p>
Nenhuma análise disponível.
</p>

</div>

`;


return;

}




jogos.forEach(jogo=>{


area.innerHTML += `


<div class="game card">


<h3>

${jogo.mandante}

⚔️

${jogo.visitante}

</h3>



<p>

🏆 ${jogo.competicao}

</p>



<p>

🤖 Probabilidade:
<strong>${jogo.probabilidade}</strong>

</p>



<p>

💰 Sugestão:
<strong>${jogo.aposta || "Analisando..."}</strong>

</p>


</div>



`;



});



}
```
