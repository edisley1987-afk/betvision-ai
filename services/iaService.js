// ==========================================
// BetVision AI
// services/iaService.js
// Motor IA v5.0
// ==========================================


// ==========================================
// GERAR ANÁLISE IA
// ==========================================

export async function gerarAnalise(jogo) {

    const casa = jogo.casa;
    const fora = jogo.fora;

    // -----------------------------
    // Probabilidade base
    // -----------------------------

    let probCasa = 45;
    let probEmpate = 28;
    let probFora = 27;

    // -----------------------------
    // Ajuste simples
    // -----------------------------

    if (casa && fora) {

        if (casa.length > fora.length) {

            probCasa += 5;
            probFora -= 5;

        }

        if (fora.length > casa.length + 5) {

            probCasa -= 5;
            probFora += 5;

        }

    }

    // Garantir soma = 100

    const soma = probCasa + probEmpate + probFora;

    probCasa = Number((probCasa * 100 / soma).toFixed(1));
    probEmpate = Number((probEmpate * 100 / soma).toFixed(1));
    probFora = Number((100 - probCasa - probEmpate).toFixed(1));

    // -----------------------------
    // Placar previsto
    // -----------------------------

    let placar = "1x1";

    if (probCasa >= 60)
        placar = "2x1";

    else if (probCasa >= 70)
        placar = "3x1";

    else if (probFora >= 50)
        placar = "1x2";

    // -----------------------------
    // Confiança
    // -----------------------------

    let confianca = "Baixa";

    if (probCasa >= 55)
        confianca = "Média";

    if (probCasa >= 65)
        confianca = "Alta";

    // -----------------------------
    // Value Bet estimado
    // -----------------------------

    const valueBet = probCasa >= 58;

    return {

        jogo: `${casa} x ${fora}`,

        probabilidadeCasa: probCasa,

        probabilidadeEmpate: probEmpate,

        probabilidadeFora: probFora,

        probabilidadeVitoriaCasa: probCasa,

        golsEsperados: 2.6,

        placarPrevisto: placar,

        valueBet: valueBet,

        confianca: confianca,

        algoritmo: "BetVision AI v5.0"

    };

}


// ==========================================
// EXPORTAÇÃO
// ==========================================

export default {

    gerarAnalise

};
