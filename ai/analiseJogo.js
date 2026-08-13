// ==================================================
// BETVISION AI
// ai/analiseJogo.js
//
// Motor Estatístico de Análise de Jogos
// Versão 2.0
//
// Probabilidade
// Gols esperados
// Placar provável
// Value Bet
// Confiança
//
// IMPORTANTE:
// Não utiliza Math.random().
//
// Quando estatísticas reais são fornecidas,
// elas influenciam a análise.
//
// Quando não são fornecidas,
// utiliza parâmetros neutros,
// sem inventar resultados aleatórios.
// ==================================================

// ==================================================
// FUNÇÃO PRINCIPAL
// ==================================================

export function analisarJogo(jogo = {}) {

    // ==================================================
    // NORMALIZAÇÃO
    // ==================================================

    const dados =
        jogo?.dados ||
        jogo ||
        {};

    const casa =
        Number(
            dados.probabilidadeCasa ??
            dados.casa ??
            50
        );

    const empateBase =
        Number(
            dados.probabilidadeEmpate ??
            dados.empate ??
            25
        );

    // ==================================================
    // PROBABILIDADES
    // ==================================================

    const probabilidades =
        calcularProbabilidades(
            casa,
            empateBase
        );

    const probabilidadeCasa =
        probabilidades.casa;

    const probabilidadeEmpate =
        probabilidades.empate;

    const probabilidadeFora =
        probabilidades.fora;

    // ==================================================
    // GOLS ESPERADOS
    // ==================================================

    const golsEsperados =
        calcularGols(
            dados
        );

    // ==================================================
    // PLACAR
    // ==================================================

    const placar =
        preverPlacar(
            golsEsperados,
            probabilidadeCasa,
            probabilidadeEmpate,
            probabilidadeFora
        );

    // ==================================================
    // VALUE BET
    // ==================================================

    const valueBet =
        detectarValor(
            probabilidadeCasa,
            probabilidadeEmpate,
            probabilidadeFora,
            dados
        );

    // ==================================================
    // CONFIANÇA
    // ==================================================

    const confianca =
        calcularConfianca(
            probabilidadeCasa,
            probabilidadeEmpate,
            probabilidadeFora
        );

    // ==================================================
    // NOME DO JOGO
    // ==================================================

    const nomeCasa =
        obterNomeCasa(jogo);

    const nomeFora =
        obterNomeFora(jogo);

    // ==================================================
    // RETORNO
    // ==================================================

    return {

        jogo:
            `${nomeCasa} x ${nomeFora}`,

        probabilidadeCasa,

        probabilidadeEmpate,

        probabilidadeFora,

        golsEsperados,

        placarPrevisto:
            placar,

        valueBet,

        confianca,

        algoritmo:
            "Probabilidade + Estatística",

        aleatorio:
            false

    };

}

// ==================================================
// PROBABILIDADES
// ==================================================

function calcularProbabilidades(
    casa,
    empate
) {

    // --------------------------------------------------
    // Limites
    // --------------------------------------------------

    let probCasa =
        limitar(
            casa,
            20,
            75
        );

    let probEmpate =
        limitar(
            empate,
            15,
            35
        );

    // --------------------------------------------------
    // Garantir que a soma não ultrapasse 100
    // --------------------------------------------------

    const soma =
        probCasa +
        probEmpate;

    if (soma >= 95) {

        const fator =
            94 / soma;

        probCasa *= fator;

        probEmpate *= fator;

    }

    // --------------------------------------------------
    // Fora
    // --------------------------------------------------

    let probFora =
        100 -
        probCasa -
        probEmpate;

    // --------------------------------------------------
    // Arredondamento
    // --------------------------------------------------

    probCasa =
        arredondar(
            probCasa
        );

    probEmpate =
        arredondar(
            probEmpate
        );

    probFora =
        arredondar(
            100 -
            probCasa -
            probEmpate
        );

    return {

        casa:
            probCasa,

        empate:
            probEmpate,

        fora:
            probFora

    };

}

// ==================================================
// GOLS ESPERADOS
// ==================================================

function calcularGols(dados = {}) {

    // --------------------------------------------------
    // Se já existir uma previsão calculada
    // --------------------------------------------------

    if (
        Number.isFinite(
            Number(
                dados.golsEsperados
            )
        )
    ) {

        return Number(
            Number(
                dados.golsEsperados
            ).toFixed(2)
        );

    }

    // --------------------------------------------------
    // Usar gols médios das equipes
    // --------------------------------------------------

    const golsCasa =
        Number(
            dados.golsCasa ??
            dados.mediaGolsCasa ??
            dados.golsMarcadosCasa ??
            1.35
        );

    const golsFora =
        Number(
            dados.golsFora ??
            dados.mediaGolsFora ??
            dados.golsMarcadosFora ??
            1.05
        );

    const total =
        golsCasa +
        golsFora;

    return Number(
        limitar(
            total,
            0.5,
            5
        ).toFixed(2)
    );

}

// ==================================================
// PREVISÃO DE PLACAR
// ==================================================

function preverPlacar(
    gols,
    casa,
    empate,
    fora
) {

    // --------------------------------------------------
    // Forte favorito da casa
    // --------------------------------------------------

    if (
        casa >= 55 &&
        gols >= 2.5
    ) {

        return "2x1";

    }

    if (
        casa >= 55 &&
        gols < 2.5
    ) {

        return "1x0";

    }

    // --------------------------------------------------
    // Forte favorito visitante
    // --------------------------------------------------

    if (
        fora >= 55 &&
        gols >= 2.5
    ) {

        return "1x2";

    }

    if (
        fora >= 55 &&
        gols < 2.5
    ) {

        return "0x1";

    }

    // --------------------------------------------------
    // Empate forte
    // --------------------------------------------------

    if (
        empate >= 30
    ) {

        if (gols < 1.8) {

            return "0x0";

        }

        if (gols < 2.6) {

            return "1x1";

        }

        return "2x2";

    }

    // --------------------------------------------------
    // Cenário neutro
    // --------------------------------------------------

    if (gols < 1.5) {

        return "1x0";

    }

    if (gols < 2.5) {

        return "1x1";

    }

    return "2x1";

}

// ==================================================
// VALUE BET
// ==================================================

function detectarValor(
    casa,
    empate,
    fora,
    dados = {}
) {

    // --------------------------------------------------
    // Odd disponível?
    // --------------------------------------------------

    const oddCasa =
        Number(
            dados.oddCasa ??
            dados.odd_1 ??
            dados.oddHome ??
            0
        );

    const oddEmpate =
        Number(
            dados.oddEmpate ??
            dados.odd_X ??
            dados.oddDraw ??
            0
        );

    const oddFora =
        Number(
            dados.oddFora ??
            dados.odd_2 ??
            dados.oddAway ??
            0
        );

    // --------------------------------------------------
    // Sem odds não existe Value Bet real
    // --------------------------------------------------

    if (
        oddCasa <= 1 &&
        oddEmpate <= 1 &&
        oddFora <= 1
    ) {

        return false;

    }

    // --------------------------------------------------
    // Valor esperado simplificado
    //
    // EV = probabilidade * odd - 1
    // --------------------------------------------------

    const evCasa =
        oddCasa > 1
            ? (casa / 100) *
              oddCasa - 1
            : -Infinity;

    const evEmpate =
        oddEmpate > 1
            ? (empate / 100) *
              oddEmpate - 1
            : -Infinity;

    const evFora =
        oddFora > 1
            ? (fora / 100) *
              oddFora - 1
            : -Infinity;

    return (
        evCasa > 0 ||
        evEmpate > 0 ||
        evFora > 0
    );

}

// ==================================================
// CONFIANÇA
// ==================================================

function calcularConfianca(
    casa,
    empate,
    fora
) {

    const maior =
        Math.max(
            casa,
            empate,
            fora
        );

    const segundo =
        obterSegundoMaior(
            casa,
            empate,
            fora
        );

    const diferenca =
        maior - segundo;

    // --------------------------------------------------
    // Alta
    // --------------------------------------------------

    if (
        maior >= 60 &&
        diferenca >= 20
    ) {

        return "Alta";

    }

    // --------------------------------------------------
    // Média
    // --------------------------------------------------

    if (
        maior >= 45 &&
        diferenca >= 10
    ) {

        return "Média";

    }

    // --------------------------------------------------
    // Baixa
    // --------------------------------------------------

    return "Baixa";

}

// ==================================================
// SEGUNDO MAIOR
// ==================================================

function obterSegundoMaior(
    a,
    b,
    c
) {

    const valores =
        [a, b, c]
            .sort(
                (x, y) => y - x
            );

    return valores[1];

}

// ==================================================
// NOME CASA
// ==================================================

function obterNomeCasa(jogo) {

    return (
        jogo?.casa ||
        jogo?.time_casa ||
        jogo?.timeCasa ||
        jogo?.homeTeam ||
        jogo?.home ||
        "Casa"
    );

}

// ==================================================
// NOME FORA
// ==================================================

function obterNomeFora(jogo) {

    return (
        jogo?.fora ||
        jogo?.time_fora ||
        jogo?.timeFora ||
        jogo?.awayTeam ||
        jogo?.away ||
        "Fora"
    );

}

// ==================================================
// LIMITAR
// ==================================================

function limitar(
    valor,
    minimo,
    maximo
) {

    const numero =
        Number(valor);

    if (
        !Number.isFinite(
            numero
        )
    ) {

        return minimo;

    }

    return Math.min(
        Math.max(
            numero,
            minimo
        ),
        maximo
    );

}

// ==================================================
// ARREDONDAR
// ==================================================

function arredondar(valor) {

    return Number(
        Number(valor).toFixed(2)
    );

}
