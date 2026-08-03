// ==========================================
// BetVision AI
// services/predictionService.js
// Inteligência Artificial de Previsão
// PARTE 1/4
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
// NORMALIZAR VALOR
// ==========================================

function limitar(valor, min, max) {

    return Math.max(min, Math.min(max, valor));

}

// ==========================================
// MÉDIA
// ==========================================

function media(lista) {

    if (!Array.isArray(lista) || lista.length === 0) {

        return 0;

    }

    return lista.reduce((soma, valor) => soma + valor, 0) / lista.length;

}

// ==========================================
// ÚLTIMOS JOGOS
// ==========================================

function ultimosJogos(jogos, quantidade = 5) {

    if (!Array.isArray(jogos)) {

        return [];

    }

    return jogos
        .slice()
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, quantidade);

}

// ==========================================
// CALCULAR FORMA
// Vitória = 3
// Empate = 1
// Derrota = 0
// ==========================================

function calcularForma(jogos, nomeTime) {

    if (!Array.isArray(jogos) || jogos.length === 0) {

        return 0;

    }

    let pontos = 0;

    jogos.forEach(jogo => {

        const emCasa = jogo.casa === nomeTime;

        const golsTime = emCasa
            ? jogo.placar.casa
            : jogo.placar.fora;

        const golsAdversario = emCasa
            ? jogo.placar.fora
            : jogo.placar.casa;

        if (golsTime > golsAdversario) {

            pontos += 3;

        }

        else if (golsTime === golsAdversario) {

            pontos += 1;

        }

    });

    return pontos / (jogos.length * 3);

}

// ==========================================
// MÉDIA DE GOLS MARCADOS
// ==========================================

function mediaGolsMarcados(jogos, nomeTime) {

    if (!jogos.length) {

        return 0;

    }

    const gols = jogos.map(jogo => {

        return jogo.casa === nomeTime

            ? jogo.placar.casa

            : jogo.placar.fora;

    });

    return media(gols);

}

// ==========================================
// MÉDIA DE GOLS SOFRIDOS
// ==========================================

function mediaGolsSofridos(jogos, nomeTime) {

    if (!jogos.length) {

        return 0;

    }

    const gols = jogos.map(jogo => {

        return jogo.casa === nomeTime

            ? jogo.placar.fora

            : jogo.placar.casa;

    });

    return media(gols);

}

// ==========================================
// FORÇA DE ATAQUE
// ==========================================

function calcularAtaque(jogos, nomeTime) {

    return limitar(

        mediaGolsMarcados(jogos, nomeTime) / 3,

        0,

        1

    );

}

// ==========================================
// FORÇA DEFENSIVA
// Quanto menos sofre gols,
// maior será a força.
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

function calcularIndiceEquipe(jogos, nomeTime, casa = false) {

    const forma = calcularForma(

        jogos,

        nomeTime

    );

    const ataque = calcularAtaque(

        jogos,

        nomeTime

    );

    const defesa = calcularDefesa(

        jogos,

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

    return limitar(indice, 0, 1);

}
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 2/4
// Cálculo das probabilidades
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

    const diferenca = 100 - (pCasa + pEmpate + pFora);

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
// GOLS ESPERADOS
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

        (ataqueCasa * 2.4)

        -

        ((1 - defesaFora) * 0.9)

        +

        0.35,

        0.2,

        MAX_GOLS

    );

    const golsFora = limitar(

        (ataqueFora * 2.1)

        -

        ((1 - defesaCasa) * 0.8),

        0.2,

        MAX_GOLS

    );

    return {

        casa: Number(golsCasa.toFixed(2)),

        fora: Number(golsFora.toFixed(2))

    };

}

// ==========================================
// PREVER PLACAR
// ==========================================

function preverPlacar(gols) {

    return {

        casa: Math.round(gols.casa),

        fora: Math.round(gols.fora),

        texto:

            `${Math.round(gols.casa)} x ${Math.round(gols.fora)}`

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

    if (maior >= 70) {

        return {

            percentual: maior,

            nivel: "Muito Alta"

        };

    }

    if (maior >= 60) {

        return {

            percentual: maior,

            nivel: "Alta"

        };

    }

    if (maior >= 50) {

        return {

            percentual: maior,

            nivel: "Média"

        };

    }

    return {

        percentual: maior,

        nivel: "Baixa"

    };

}
// ==========================================
// BetVision AI
// services/predictionService.js
// PARTE 3/4
// Geração da previsão
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

    const probabilidades = calcularProbabilidades(

        historicoCasa,

        historicoFora,

        jogo.casa,

        jogo.fora

    );

    const golsEsperados = calcularGolsEsperados(

        historicoCasa,

        historicoFora,

        jogo.casa,

        jogo.fora

    );

    const placar = preverPlacar(

        golsEsperados

    );

    const confianca = calcularConfianca(

        probabilidades

    );

    return {

        jogoId: jogo.id,

        jogo: `${jogo.casa} x ${jogo.fora}`,

        campeonato: jogo.campeonato,

        pais: jogo.pais,

        data: jogo.horario,

        casa: jogo.casa,

        fora: jogo.fora,

        probabilidadeCasa: probabilidades.casa,

        probabilidadeEmpate: probabilidades.empate,

        probabilidadeFora: probabilidades.fora,

        golsEsperadosCasa: golsEsperados.casa,

        golsEsperadosFora: golsEsperados.fora,

        golsEsperados:

            Number(

                (

                    golsEsperados.casa +

                    golsEsperados.fora

                ).toFixed(2)

            ),

        placarPrevisto: placar.texto,

        confianca: confianca.percentual,

        nivelConfianca: confianca.nivel,

        algoritmo: "Modelo Estatístico v1.0",

        geradoEm: new Date().toISOString()

    };

}

// ==========================================
// PREVER LISTA DE JOGOS
// ==========================================

export function preverListaJogos(

    jogos,

    historicos = {}

) {

    if (!Array.isArray(jogos)) {

        return [];

    }

    return jogos.map(jogo => {

        const historicoCasa =

            historicos[jogo.casa] || [];

        const historicoFora =

            historicos[jogo.fora] || [];

        return preverPartida({

            jogo,

            historicoCasa,

            historicoFora

        });

    });

}

// ==========================================
// RANQUEAR ANÁLISES
// ==========================================

export function ranquearAnalises(

    analises

) {

    return analises

        .slice()

        .sort((a, b) => {

            if (

                b.confianca !==

                a.confianca

            ) {

                return (

                    b.confianca -

                    a.confianca

                );

            }

            return (

                b.golsEsperados -

                a.golsEsperados

            );

        });

}

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

}// ==========================================
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

    if (!jogo.casa || !jogo.fora) {

        return false;

    }

    if (!jogo.id) {

        return false;

    }

    return true;

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

    previsaoRapida,

    validarJogo,

    melhorPalpite,

    resumoAnalises,

    ranquearAnalises,

    MODELO

};
