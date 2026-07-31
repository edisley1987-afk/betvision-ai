// ==========================================
// BetVision AI
// services/oddsService.js
// Versão 5.0
// ==========================================


// ==========================================
// BUSCAR ODDS
// (Simulação inteligente)
// ==========================================

export async function buscarOdds(idJogo) {

    // Futuramente poderá ser substituído
    // por uma API real de odds.

    const oddCasa = Number((1.60 + Math.random() * 1.40).toFixed(2));

    const oddEmpate = Number((2.80 + Math.random() * 1.20).toFixed(2));

    const oddFora = Number((2.20 + Math.random() * 2.30).toFixed(2));

    const over25 = Number((1.60 + Math.random() * 0.60).toFixed(2));

    const under25 = Number((1.60 + Math.random() * 0.60).toFixed(2));

    return {

        jogo: idJogo,

        atualizadoEm: new Date().toISOString(),

        mercado: {

            vencedor: {

                casa: oddCasa,

                empate: oddEmpate,

                fora: oddFora

            },

            gols: {

                over25: over25,

                under25: under25

            }

        }

    };

}


// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    buscarOdds

};
