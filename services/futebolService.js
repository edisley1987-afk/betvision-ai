// ==========================================
// BetVision AI
// services/futebolService.js
// Football-Data.org v4
// ==========================================

import axios from "axios";

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const API_KEY =
    process.env.FOOTBALL_DATA_KEY ||
    process.env.API_FOOTBALL_KEY;

const BASE_URL =
    process.env.FOOTBALL_DATA_URL ||
    "https://api.football-data.org/v4";

// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {
    return data.toISOString().split("T")[0];
}

// ==========================================
// FORMATAR JOGO
// ==========================================

function converterPartida(match) {

    return {

        id: match.id,

        campeonato: match.competition?.name || "-",

        pais: match.area?.name || "-",

        casa: match.homeTeam?.name || "-",

        fora: match.awayTeam?.name || "-",

        horario: match.utcDate,

        status: match.status,

        rodada: match.matchday || null,

        estadio: match.venue || "-",

        escudos: {

            casa: match.homeTeam?.crest || "",

            fora: match.awayTeam?.crest || ""

        }

    };

}

// ==========================================
// BUSCAR JOGOS
// ==========================================

export async function buscarJogos() {

    try {

        console.log("====================================");
        console.log("⚽ BETVISION AI - FOOTBALL DATA");
        console.log("====================================");

        if (!API_KEY) {

            console.error("❌ API KEY não configurada.");

            return [];

        }

        console.log("✅ API KEY carregada");

        const hoje = new Date();

        const fim = new Date();
        fim.setDate(fim.getDate() + 7);

        const dataInicial = formatarData(hoje);
        const dataFinal = formatarData(fim);

        console.log("📅 Período:", dataInicial, "até", dataFinal);

        const resposta = await axios.get(

            `${BASE_URL}/matches`,

            {

                headers: {

                    "X-Auth-Token": API_KEY

                },

                params: {

                    dateFrom: dataInicial,

                    dateTo: dataFinal

                },

                timeout: 30000

            }

        );

        const partidas = resposta.data.matches || [];

        console.log(`📦 API retornou ${partidas.length} partidas.`);

        // =====================================
        // STATUS VÁLIDOS
        // =====================================

        const STATUS_VALIDOS = [

            "SCHEDULED",
            "TIMED",
            "LIVE",
            "IN_PLAY",
            "PAUSED"

        ];

        let jogos = partidas.filter(partida =>
            STATUS_VALIDOS.includes(partida.status)
        );

        console.log(`✅ Jogos válidos: ${jogos.length}`);

        // =====================================
        // ORDENAR
        // =====================================

        jogos.sort((a, b) =>
            new Date(a.utcDate) - new Date(b.utcDate)
        );

        // =====================================
        // FILTRAR APENAS HOJE
        // =====================================

        const hojeString = formatarData(new Date());

        let jogosHoje = jogos.filter(jogo =>

            jogo.utcDate.startsWith(hojeString)

        );

        // =====================================
        // SE NÃO TIVER HOJE
        // RETORNA O PRÓXIMO DIA DISPONÍVEL
        // =====================================

        if (jogosHoje.length === 0 && jogos.length > 0) {

            const primeiraData = jogos[0].utcDate.substring(0, 10);

            jogosHoje = jogos.filter(jogo =>

                jogo.utcDate.startsWith(primeiraData)

            );

            console.log(
                "ℹ Não há jogos hoje. Retornando jogos de",
                primeiraData
            );

        }

        const resultado = jogosHoje.map(converterPartida);

        console.log(`⚽ Jogos enviados: ${resultado.length}`);

        return resultado;

    }
    catch (erro) {

        console.error("====================================");
        console.error("❌ ERRO FOOTBALL DATA");
        console.error("====================================");

        if (erro.response) {

            console.error("Status:", erro.response.status);
            console.error("Resposta:", erro.response.data);

        } else {

            console.error(erro.message);

        }

        return [];

    }

}

export default {

    buscarJogos

};
