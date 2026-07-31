// ==========================================
// BetVision AI
// services/oddsService.js
// Football-Data.org Compatible
// Versão 6.0
// ==========================================

/**
 * Gera odds simuladas.
 * Pode ser substituído futuramente por uma API de odds.
 */

function gerarOdd(min, max) {
    return Number((Math.random() * (max - min) + min).toFixed(2));
}

// ==========================================
// BUSCAR ODDS
// ==========================================

export async function buscarOdds(idJogo = null) {

    return {

        jogo: idJogo,

        atualizadoEm: new Date().toISOString(),

        mercado: {

            vencedor: {

                casa: gerarOdd(1.60, 3.00),

                empate: gerarOdd(2.80, 4.00),

                fora: gerarOdd(2.20, 4.50)

            },

            gols: {

                over25: gerarOdd(1.60, 2.20),

                under25: gerarOdd(1.60, 2.20)

            }

        }

    };

}

// ==========================================
// BUSCAR ODDS DE VÁRIOS JOGOS
// ==========================================

export async function buscarOddsJogos(listaJogos = []) {

    if (!Array.isArray(listaJogos)) {
        return [];
    }

    const resultado = [];

    for (const jogo of listaJogos) {

        const odds = await buscarOdds(jogo.id);

        resultado.push({

            ...jogo,

            odds

        });

    }

    return resultado;

}

// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    buscarOdds,
    buscarOddsJogos

};
