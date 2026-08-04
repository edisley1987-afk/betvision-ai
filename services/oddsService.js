// ==========================================
// BetVision AI
// services/oddsService.js
// The Odds API v4
// ==========================================

import { obterOdds } from "./oddsApi.js";

// ==========================================
// BUSCAR ODDS DE UM JOGO
// ==========================================

export async function buscarOdds(idJogo = null) {

    try {

        const jogos = await obterOdds();

        if (!jogos.length) {

            return null;

        }

        if (!idJogo) {

            return jogos[0];

        }

        const jogo = jogos.find(j => String(j.id) === String(idJogo));

        return jogo || null;

    }

    catch (erro) {

        console.error("Erro buscarOdds:", erro.message);

        return null;

    }

}

// ==========================================
// BUSCAR ODDS DE TODOS OS JOGOS
// ==========================================

export async function buscarOddsJogos(listaJogos = []) {

    try {

        const oddsAPI = await obterOdds();

        if (!Array.isArray(listaJogos)) {

            return [];

        }

        return listaJogos.map(jogo => {

            const odds = oddsAPI.find(o =>

                o.casa === jogo.casa &&
                o.fora === jogo.fora

            );

            return {

                ...jogo,

                odds: odds || null

            };

        });

    }

    catch (erro) {

        console.error("Erro buscarOddsJogos:", erro.message);

        return [];

    }

}

export default {

    buscarOdds,

    buscarOddsJogos

};
