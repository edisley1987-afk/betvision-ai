async function carregar(){

const resposta=await fetch("/api/dashboard");

const dados=await resposta.json();

document.getElementById("jogos").innerHTML=dados.jogosHoje;

document.getElementById("valuebets").innerHTML=dados.valueBets;

document.getElementById("roi").innerHTML=dados.roi+"%";

document.getElementById("assertividade").innerHTML=dados.assertividade+"%";

}

carregar();

setInterval(carregar,5000);
