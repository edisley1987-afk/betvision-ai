async function carregarDashboard() {

    const resposta = await fetch("/api/dashboard");

    const dados = await resposta.json();

    document.getElementById("jogos").innerHTML = dados.jogosHoje;

    document.getElementById("valuebets").innerHTML = dados.valueBets;

    document.getElementById("roi").innerHTML = dados.roi + "%";

    document.getElementById("assertividade").innerHTML = dados.assertividade + "%";

}

async function carregarJogos() {

    const resposta = await fetch("/api/jogos");

    const jogos = await resposta.json();

    const lista = document.getElementById("lista");

    lista.innerHTML = "";

    jogos.forEach(jogo => {

        lista.innerHTML += `
        <div class="jogo">
            <strong>${jogo.mandante}</strong>
            x
            <strong>${jogo.visitante}</strong>

            <br>

            ${jogo.campeonato}

            <br>

            ${jogo.data} - ${jogo.hora}
        </div>
        `;

    });

}

async function iniciar() {

    await carregarDashboard();

    await carregarJogos();

}

iniciar();

setInterval(iniciar,5000);
