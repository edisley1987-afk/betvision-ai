// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 1A
// Engine de Previsão
// ==========================================

"use strict";

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const FATOR_CASA = 1.15;

const PESO_FORMA = 0.40;

const PESO_ATAQUE = 0.30;

const PESO_DEFESA = 0.30;

const MAX_GOLS = 5;


// ==========================================
// LIMITAR VALORES
// ==========================================

function limitar(valor, minimo, maximo) {

    return Math.max(

        minimo,

        Math.min(maximo, valor)

    );

}


// ==========================================
// MÉDIA
// ==========================================

function media(lista = []) {

    if (!Array.isArray(lista) || lista.length === 0) {

        return 0;

    }

    const soma = lista.reduce(

        (total, valor) => total + Number(valor || 0),

        0

    );

    return soma / lista.length;

}


// ==========================================
// ÚLTIMOS JOGOS
// ==========================================

function ultimosJogos(

    jogos = [],

    quantidade = 5

) {

    if (!Array.isArray(jogos)) {

        return [];

    }

    return jogos

        .slice()

        .sort(

            (a, b) =>

                new Date(b.data)

                -

                new Date(a.data)

        )

        .slice(0, quantidade);

}


// ==========================================
// CALCULAR FORMA
// Vitória = 3
// Empate = 1
// Derrota = 0
// ==========================================

function calcularForma(

    jogos,

    nomeTime

) {

    if (!Array.isArray(jogos) || jogos.length === 0) {

        return 0;

    }

    let pontos = 0;

    jogos.forEach(jogo => {

        const emCasa =

            jogo.casa === nomeTime;

        const golsTime = emCasa

            ? Number(jogo.placar?.casa || 0)

            : Number(jogo.placar?.fora || 0);

        const golsAdversario = emCasa

            ? Number(jogo.placar?.fora || 0)

            : Number(jogo.placar?.casa || 0);

        if (golsTime > golsAdversario) {

            pontos += 3;

        }

        else if (golsTime === golsAdversario) {

            pontos += 1;

        }

    });

    return Number(

        (

            pontos /

            (jogos.length * 3)

        ).toFixed(3)

    );

}


// ==========================================
// MÉDIA GOLS MARCADOS
// ==========================================

function mediaGolsMarcados(

    jogos,

    nomeTime

) {

    if (!Array.isArray(jogos) || jogos.length === 0) {

        return 0;

    }

    const gols = jogos.map(jogo => {

        return jogo.casa === nomeTime

            ? Number(jogo.placar?.casa || 0)

            : Number(jogo.placar?.fora || 0);

    });

    return media(gols);

}


// ==========================================
// MÉDIA GOLS SOFRIDOS
// ==========================================

function mediaGolsSofridos(

    jogos,

    nomeTime

) {

    if (!Array.isArray(jogos) || jogos.length === 0) {

        return 0;

    }

    const gols = jogos.map(jogo => {

        return jogo.casa === nomeTime

            ? Number(jogo.placar?.fora || 0)

            : Number(jogo.placar?.casa || 0);

    });

    return media(gols);

}

console.log("✅ predictionService Parte 1A carregada");
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 1B
// Ataque, Defesa e Índice da Equipe
// ==========================================

// ==========================================
// FORÇA DE ATAQUE
// ==========================================

function calcularAtaque(jogos, nomeTime) {

    const mediaMarcados = mediaGolsMarcados(

        jogos,

        nomeTime

    );

    return limitar(

        mediaMarcados / 3,

        0,

        1

    );

}

// ==========================================
// FORÇA DEFENSIVA
// Quanto menos gols sofre,
// maior será a nota.
// ==========================================

function calcularDefesa(jogos, nomeTime) {

    const mediaSofridos = mediaGolsSofridos(

        jogos,

        nomeTime

    );

    return limitar(

        1 - (mediaSofridos / 3),

        0,

        1

    );

}

// ==========================================
// ÍNDICE GERAL DA EQUIPE
// ==========================================

function calcularIndiceEquipe(

    jogos,

    nomeTime,

    casa = false

) {

    const jogosRecentes = ultimosJogos(

        jogos,

        5

    );

    const forma = calcularForma(

        jogosRecentes,

        nomeTime

    );

    const ataque = calcularAtaque(

        jogosRecentes,

        nomeTime

    );

    const defesa = calcularDefesa(

        jogosRecentes,

        nomeTime

    );

    let indice =

        (forma * PESO_FORMA)

        +

        (ataque * PESO_ATAQUE)

        +

        (defesa * PESO_DEFESA);

    if (casa) {

        indice *= FATOR_CASA;

    }

    return limitar(

        indice,

        0,

        1

    );

}

// ==========================================
// FORÇA RELATIVA
// ==========================================

function calcularForcaRelativa(

    indiceCasa,

    indiceFora

) {

    const total = indiceCasa + indiceFora;

    if (total <= 0) {

        return {

            casa: 0.5,

            fora: 0.5

        };

    }

    return {

        casa: indiceCasa / total,

        fora: indiceFora / total

    };

}

// ==========================================
// DIFERENÇA DE FORÇA
// ==========================================

function diferencaForca(

    indiceCasa,

    indiceFora

) {

    return Math.abs(

        indiceCasa - indiceFora

    );

}

// ==========================================
// VANTAGEM DE MANDO
// ==========================================

function vantagemCasa() {

    return FATOR_CASA;

}

// ==========================================
// EXPORTS INTERNOS
// ==========================================

export {

    calcularAtaque,

    calcularDefesa,

    calcularIndiceEquipe,

    calcularForcaRelativa,

    diferencaForca,

    vantagemCasa

};

console.log("✅ predictionService Parte 1B carregada"); 
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 2A
// Probabilidades + Gols Esperados
// ==========================================

// ==========================================
// NORMALIZAR PROBABILIDADES
// ==========================================

function normalizarProbabilidades(casa, empate, fora) {

    const soma = casa + empate + fora;

    if (soma <= 0) {

        return {

            casa: 33,
            empate: 34,
            fora: 33

        };

    }

    let pCasa = Math.round((casa / soma) * 100);

    let pEmpate = Math.round((empate / soma) * 100);

    let pFora = Math.round((fora / soma) * 100);

    const diferenca =

        100 - (pCasa + pEmpate + pFora);

    pCasa += diferenca;

    return {

        casa: limitar(pCasa, 0, 100),

        empate: limitar(pEmpate, 0, 100),

        fora: limitar(pFora, 0, 100)

    };

}

// ==========================================
// CALCULAR PROBABILIDADES
// ==========================================

function calcularProbabilidades(

    jogosCasa,

    jogosFora,

    timeCasa,

    timeFora

) {

    const indiceCasa = calcularIndiceEquipe(

        jogosCasa,

        timeCasa,

        true

    );

    const indiceFora = calcularIndiceEquipe(

        jogosFora,

        timeFora,

        false

    );

    let casa = indiceCasa;

    let fora = indiceFora;

    let empate =

        0.25 +

        (1 - Math.abs(casa - fora)) * 0.25;

    return normalizarProbabilidades(

        casa,

        empate,

        fora

    );

}

// ==========================================
// CALCULAR GOLS ESPERADOS
// ==========================================

function calcularGolsEsperados(

    jogosCasa,

    jogosFora,

    timeCasa,

    timeFora

) {

    const ataqueCasa = calcularAtaque(

        jogosCasa,

        timeCasa

    );

    const defesaCasa = calcularDefesa(

        jogosCasa,

        timeCasa

    );

    const ataqueFora = calcularAtaque(

        jogosFora,

        timeFora

    );

    const defesaFora = calcularDefesa(

        jogosFora,

        timeFora

    );

    const golsCasa = limitar(

        (ataqueCasa * 2.40)

        -

        ((1 - defesaFora) * 0.90)

        +

        0.35,

        0.20,

        MAX_GOLS

    );

    const golsFora = limitar(

        (ataqueFora * 2.10)

        -

        ((1 - defesaCasa) * 0.80),

        0.20,

        MAX_GOLS

    );

    return {

        casa: Number(golsCasa.toFixed(2)),

        fora: Number(golsFora.toFixed(2))

    };

}

console.log("✅ predictionService Parte 2A carregada");
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 2B
// Placar Previsto + Confiança
// ==========================================

// ==========================================
// PREVER PLACAR
// ==========================================

function preverPlacar(golsEsperados) {

    const golsCasa = Math.round(golsEsperados.casa);

    const golsFora = Math.round(golsEsperados.fora);

    return {

        casa: golsCasa,

        fora: golsFora,

        texto: `${golsCasa} x ${golsFora}`

    };

}

// ==========================================
// CALCULAR CONFIANÇA
// ==========================================

function calcularConfianca(probabilidades) {

    const maior = Math.max(

        probabilidades.casa,

        probabilidades.empate,

        probabilidades.fora

    );

    let nivel = "Baixa";

    if (maior >= 70) {

        nivel = "Muito Alta";

    }

    else if (maior >= 60) {

        nivel = "Alta";

    }

    else if (maior >= 50) {

        nivel = "Média";

    }

    return {

        percentual: maior,

        nivel

    };

}

// ==========================================
// DEFINIR FAVORITO
// ==========================================

function definirFavorito(probabilidades, jogo) {

    if (

        probabilidades.casa >= probabilidades.empate &&

        probabilidades.casa >= probabilidades.fora

    ) {

        return {

            equipe: jogo.casa,

            mercado: "Vitória Casa",

            probabilidade: probabilidades.casa

        };

    }

    if (

        probabilidades.fora >= probabilidades.casa &&

        probabilidades.fora >= probabilidades.empate

    ) {

        return {

            equipe: jogo.fora,

            mercado: "Vitória Visitante",

            probabilidade: probabilidades.fora

        };

    }

    return {

        equipe: "Empate",

        mercado: "Empate",

        probabilidade: probabilidades.empate

    };

}

// ==========================================
// ESTIMAR TOTAL DE GOLS
// ==========================================

function estimarTotalGols(golsEsperados) {

    return Number(

        (

            golsEsperados.casa +

            golsEsperados.fora

        ).toFixed(2)

    );

}

// ==========================================
// OVER / UNDER 2.5
// ==========================================

function preverMercadoGols(totalGols) {

    return {

        over25: totalGols >= 2.5,

        under25: totalGols < 2.5

    };

}

console.log("✅ predictionService Parte 2B carregada");
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 3A
// Previsão Completa da Partida
// ==========================================

// ==========================================
// PREVER PARTIDA
// ==========================================

export function preverPartida({

    jogo,

    historicoCasa = [],

    historicoFora = []

}) {

    if (!jogo) {

        throw new Error("Jogo não informado.");

    }

    if (!jogo.casa || !jogo.fora) {

        throw new Error("Times inválidos.");

    }

    // ==========================
    // PROBABILIDADES
    // ==========================

    const probabilidades = calcularProbabilidades(

        historicoCasa,

        historicoFora,

        jogo.casa,

        jogo.fora

    );

    // ==========================
    // GOLS ESPERADOS
    // ==========================

    const golsEsperados = calcularGolsEsperados(

        historicoCasa,

        historicoFora,

        jogo.casa,

        jogo.fora

    );

    // ==========================
    // PLACAR PREVISTO
    // ==========================

    const placar = preverPlacar(

        golsEsperados

    );

    // ==========================
    // CONFIANÇA
    // ==========================

    const confianca = calcularConfianca(

        probabilidades

    );

    // ==========================
    // FAVORITO
    // ==========================

    const favorito = definirFavorito(

        probabilidades,

        jogo

    );

    // ==========================
    // TOTAL DE GOLS
    // ==========================

    const totalGols = estimarTotalGols(

        golsEsperados

    );

    // ==========================
    // OVER / UNDER
    // ==========================

    const mercadoGols = preverMercadoGols(

        totalGols

    );

    // ==========================
    // RETORNO
    // ==========================

    return {

        jogoId: jogo.id,

        jogo: `${jogo.casa} x ${jogo.fora}`,

        campeonato: jogo.campeonato,

        pais: jogo.pais,

        data: jogo.horario,

        casa: jogo.casa,

        fora: jogo.fora,

        probabilidadeCasa:

            probabilidades.casa,

        probabilidadeEmpate:

            probabilidades.empate,

        probabilidadeFora:

            probabilidades.fora,

        golsEsperadosCasa:

            golsEsperados.casa,

        golsEsperadosFora:

            golsEsperados.fora,

        golsEsperados:

            totalGols,

        placarPrevisto:

            placar.texto,

        favorito:

            favorito.equipe,

        mercadoFavorito:

            favorito.mercado,

        probabilidadeFavorito:

            favorito.probabilidade,

        over25:

            mercadoGols.over25,

        under25:

            mercadoGols.under25,

        confianca:

            confianca.percentual,

        nivelConfianca:

            confianca.nivel,

        algoritmo:

            "BetVision Statistical AI v2.0",

        geradoEm:

            new Date().toISOString()

    };

}

console.log("✅ predictionService Parte 3A carregada");
// ==========================================
// BUSCAR MELHOR APOSTA
// ==========================================

export function melhorPalpite(

    analise

) {

    const casa =

        analise.probabilidadeCasa;

    const empate =

        analise.probabilidadeEmpate;

    const fora =

        analise.probabilidadeFora;

    if (

        casa >= empate &&

        casa >= fora

    ) {

        return {

            mercado: "Vitória Casa",

            probabilidade: casa

        };

    }

    if (

        fora >= casa &&

        fora >= empate

    ) {

        return {

            mercado: "Vitória Visitante",

            probabilidade: fora

        };

    }

    return {

        mercado: "Empate",

        probabilidade: empate

    };

}

// ==========================================
// ESTATÍSTICAS DAS PREVISÕES
// ==========================================

export function resumoAnalises(

    analises

) {

    if (!analises.length) {

        return {

            total: 0,

            mediaConfianca: 0,

            mediaGols: 0

        };

    }

    const mediaConfianca = media(

        analises.map(

            a => a.confianca

        )

    );

    const mediaGols = media(

        analises.map(

            a => a.golsEsperados

        )

    );

    return {

        total: analises.length,

        mediaConfianca:

            Number(

                mediaConfianca.toFixed(1)

            ),

        mediaGols:

            Number(

                mediaGols.toFixed(2)

            )

    };

}
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 4/4
// Exportações
// ==========================================

// ==========================================
// PREVER (COMPATIBILIDADE)
// ==========================================

export function prever(dados = {}) {

    return preverPartida(dados);

}

// ==========================================
// PREVISÃO RÁPIDA
// ==========================================

export function previsaoRapida(jogo) {

    return preverPartida({

        jogo,

        historicoCasa: [],

        historicoFora: []

    });

}

// ==========================================
// VALIDAÇÃO
// ==========================================

export function validarJogo(jogo) {

    if (!jogo) {

        return false;

    }

    if (!jogo.id) {

        return false;

    }

    if (!jogo.casa) {

        return false;

    }

    if (!jogo.fora) {

        return false;

    }

    return true;

}

// ==========================================
// PREVISÃO EM LOTE
// ==========================================

export function preverJogos(jogos = []) {

    if (!Array.isArray(jogos)) {

        return [];

    }

    return jogos

        .filter(validarJogo)

        .map(jogo =>

            previsaoRapida(jogo)

        );

}

// ==========================================
// VERSÃO DO MODELO
// ==========================================

export const MODELO = {

    nome: "BetVision Prediction Engine",

    versao: "1.0.0",

    algoritmo: "Modelo Estatístico",

    autor: "BetVision AI"

};

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    prever,

    preverPartida,

    preverListaJogos,

    preverJogos,

    previsaoRapida,

    validarJogo,

    melhorPalpite,

    resumoAnalises,

    ranquearAnalises,

    MODELO

};
