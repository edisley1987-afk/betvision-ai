// ==================================================
// BETVISION AI
// ai/analiseJogo.js
//
// MOTOR ESTATÍSTICO v6.0
//
// Objetivos:
//
// - Eliminar Math.random()
// - Probabilidades determinísticas
// - Gols esperados
// - Distribuição de Poisson
// - Previsão de placares
// - Probabilidade Casa / Empate / Fora
// - Detecção de Value Bet
// - Cálculo de confiança
// - Preparado para estatísticas reais
//
// IMPORTANTE:
// Este arquivo NÃO inventa dados.
// Quando estatísticas não forem fornecidas,
// utiliza apenas parâmetros neutros.
// ==================================================


// ==================================================
// CONFIGURAÇÕES DO MODELO
// ==================================================

const CONFIG = {

    // Peso do mando de campo
    vantagemCasa: 1.10,

    // Número máximo de gols utilizado
    // na matriz de Poisson
    maxGols: 8,

    // Margem mínima para considerar Value Bet
    margemValueBet: 0.05,

    // Odd mínima aceitável
    oddMinima: 1.01,

    // Médias neutras utilizadas somente
    // quando não existem dados suficientes
    mediaCasaNeutra: 1.35,
    mediaForaNeutra: 1.10,

    // Peso dos últimos jogos
    pesoForma: 0.60,

    // Peso da média geral
    pesoMedia: 0.40

};


// ==================================================
// FUNÇÃO PRINCIPAL
// ==================================================

export function analisarJogo(jogo = {}) {

    // --------------------------------------------------
    // Normalizar dados recebidos
    // --------------------------------------------------

    const dados = normalizarJogo(jogo);


    // --------------------------------------------------
    // Estatísticas das equipes
    // --------------------------------------------------

    const casa =
        normalizarEquipe(
            dados.casa
        );


    const fora =
        normalizarEquipe(
            dados.fora
        );


    // --------------------------------------------------
    // GOLS ESPERADOS
    // --------------------------------------------------

    const golsCasa =
        calcularGolsEsperadosCasa(
            casa,
            fora
        );


    const golsFora =
        calcularGolsEsperadosFora(
            casa,
            fora
        );


    const golsTotais =
        arredondar(
            golsCasa + golsFora
        );


    // --------------------------------------------------
    // MATRIZ DE PROBABILIDADES
    // --------------------------------------------------

    const matriz =
        gerarMatrizPoisson(
            golsCasa,
            golsFora,
            CONFIG.maxGols
        );


    // --------------------------------------------------
    // PROBABILIDADES 1X2
    // --------------------------------------------------

    const probabilidades =
        calcularProbabilidadesResultado(
            matriz
        );


    // --------------------------------------------------
    // PLACAR MAIS PROVÁVEL
    // --------------------------------------------------

    const placar =
        encontrarPlacarMaisProvavel(
            matriz
        );


    // --------------------------------------------------
    // TOP PLACARES
    // --------------------------------------------------

    const placaresProvaveis =
        encontrarPrincipaisPlacares(
            matriz,
            5
        );


    // --------------------------------------------------
    // FAVORITO
    // --------------------------------------------------

    const favorito =
        determinarFavorito(
            probabilidades
        );


    // --------------------------------------------------
    // ODDS
    // --------------------------------------------------

    const odds =
        normalizarOdds(
            dados.odds
        );


    // --------------------------------------------------
    // VALUE BET
    // --------------------------------------------------

    const valueBet =
        detectarValueBet(
            probabilidades,
            odds
        );


    // --------------------------------------------------
    // CONFIANÇA
    // --------------------------------------------------

    const confianca =
        calcularConfianca(
            casa,
            fora,
            probabilidades
        );


    // --------------------------------------------------
    // FORMA
    // --------------------------------------------------

    const formaCasa =
        calcularForma(
            casa
        );


    const formaFora =
        calcularForma(
            fora
        );


    // --------------------------------------------------
    // RETORNO
    // --------------------------------------------------

    return {

        sucesso: true,

        versao:
            "BetVision Statistical AI v6.0",


        jogo: {

            id:
                dados.id ?? null,

            casa:
                dados.nomeCasa,

            fora:
                dados.nomeFora

        },


        probabilidades: {

            casa:
                percentual(
                    probabilidades.casa
                ),

            empate:
                percentual(
                    probabilidades.empate
                ),

            fora:
                percentual(
                    probabilidades.fora
                )

        },


        golsEsperados: {

            casa:
                arredondar(
                    golsCasa
                ),

            fora:
                arredondar(
                    golsFora
                ),

            total:
                golsTotais

        },


        placarPrevisto:
            placar.texto,


        probabilidadePlacar:
            percentual(
                placar.probabilidade
            ),


        principaisPlacares:
            placaresProvaveis.map(
                item => ({

                    placar:
                        item.texto,

                    probabilidade:
                        percentual(
                            item.probabilidade
                        )

                })
            ),


        favorito: {

            resultado:
                favorito.nome,

            probabilidade:
                percentual(
                    favorito.probabilidade
                )

        },


        forma: {

            casa:
                percentual(
                    formaCasa
                ),

            fora:
                percentual(
                    formaFora
                )

        },


        valueBet,


        confianca,


        algoritmo:
            "Poisson + Forma + Ataque + Defesa + Mando de Campo",


        dadosUtilizados: {

            estatisticasCasa:
                possuiDados(
                    casa
                ),

            estatisticasFora:
                possuiDados(
                    fora
                ),

            odds:
                Object.keys(odds).length > 0

        }

    };

}


// ==================================================
// NORMALIZAR JOGO
// ==================================================

function normalizarJogo(jogo) {

    // Aceita diferentes formatos de nomes
    // para facilitar integração com APIs.

    const nomeCasa =
        primeiroValor(
            jogo.casa,
            jogo.timeCasa,
            jogo.time_casa,
            jogo.homeTeam,
            jogo.home,
            "Casa"
        );


    const nomeFora =
        primeiroValor(
            jogo.fora,
            jogo.timeFora,
            jogo.time_fora,
            jogo.awayTeam,
            jogo.away,
            "Fora"
        );


    return {

        id:
            jogo.id ??
            jogo.jogo_id ??
            null,

        nomeCasa,

        nomeFora,


        casa:
            jogo.estatisticasCasa ??
            jogo.casaStats ??
            jogo.homeStats ??
            jogo.home ??
            jogo.casaDados ??
            {},


        fora:
            jogo.estatisticasFora ??
            jogo.foraStats ??
            jogo.awayStats ??
            jogo.away ??
            jogo.foraDados ??
            {},


        odds:
            jogo.odds ??
            jogo.odd ??
            {}

    };

}


// ==================================================
// NORMALIZAR EQUIPE
// ==================================================

function normalizarEquipe(equipe = {}) {

    const golsMarcados =
        numeroValido(
            equipe.golsMarcados ??
            equipe.gols_marcados ??
            equipe.goalsFor ??
            equipe.mediaGolsMarcados
        );


    const golsSofridos =
        numeroValido(
            equipe.golsSofridos ??
            equipe.gols_sofridos ??
            equipe.goalsAgainst ??
            equipe.mediaGolsSofridos
        );


    const mediaGolsMarcados =
        numeroValido(
            equipe.mediaGolsMarcados ??
            equipe.media_gols_marcados ??
            equipe.avgGoalsFor ??
            equipe.golsPorJogo
        );


    const mediaGolsSofridos =
        numeroValido(
            equipe.mediaGolsSofridos ??
            equipe.media_gols_sofridos ??
            equipe.avgGoalsAgainst ??
            equipe.golsSofridosPorJogo
        );


    const jogos =
        numeroValido(
            equipe.jogos ??
            equipe.partidas ??
            equipe.matches
        );


    const ultimosJogos =
        Array.isArray(
            equipe.ultimosJogos
        )
            ? equipe.ultimosJogos
            : Array.isArray(
                equipe.ultimos_jogos
            )
                ? equipe.ultimos_jogos
                : [];


    return {

        golsMarcados,

        golsSofridos,

        mediaGolsMarcados,

        mediaGolsSofridos,

        jogos,

        ultimosJogos,

        casa:
            equipe.casa === true ||
            equipe.mando === "casa",

        fora:
            equipe.fora === true ||
            equipe.mando === "fora"

    };

}


// ==================================================
// GOLS ESPERADOS CASA
// ==================================================

function calcularGolsEsperadosCasa(
    casa,
    fora
) {

    const ataqueCasa =
        obterForcaAtaque(
            casa,
            CONFIG.mediaCasaNeutra
        );


    const defesaFora =
        obterForcaDefesa(
            fora,
            CONFIG.mediaForaNeutra
        );


    const formaCasa =
        calcularForma(
            casa
        );


    const formaFora =
        calcularForma(
            fora
        );


    let esperado =
        (
            ataqueCasa +
            defesaFora
        ) / 2;


    // Ajuste de forma
    const ajusteForma =
        (
            formaCasa -
            formaFora
        ) * 0.25;


    esperado +=
        ajusteForma;


    // Mando de campo
    esperado *=
        CONFIG.vantagemCasa;


    return limitar(
        esperado,
        0.20,
        4.50
    );

}


// ==================================================
// GOLS ESPERADOS FORA
// ==================================================

function calcularGolsEsperadosFora(
    casa,
    fora
) {

    const ataqueFora =
        obterForcaAtaque(
            fora,
            CONFIG.mediaForaNeutra
        );


    const defesaCasa =
        obterForcaDefesa(
            casa,
            CONFIG.mediaCasaNeutra
        );


    const formaCasa =
        calcularForma(
            casa
        );


    const formaFora =
        calcularForma(
            fora
        );


    let esperado =
        (
            ataqueFora +
            defesaCasa
        ) / 2;


    const ajusteForma =
        (
            formaFora -
            formaCasa
        ) * 0.20;


    esperado +=
        ajusteForma;


    // Fora recebe pequeno desconto
    esperado *= 0.92;


    return limitar(
        esperado,
        0.15,
        4.00
    );

}


// ==================================================
// FORÇA DE ATAQUE
// ==================================================

function obterForcaAtaque(
    equipe,
    neutro
) {

    const media =
        equipe.mediaGolsMarcados;


    const total =
        equipe.golsMarcados;


    const jogos =
        equipe.jogos;


    if (
        media !== null &&
        media !== undefined &&
        media > 0
    ) {

        return limitar(
            media,
            0.20,
            4.00
        );

    }


    if (
        total !== null &&
        jogos !== null &&
        jogos > 0
    ) {

        return limitar(
            total / jogos,
            0.20,
            4.00
        );

    }


    return neutro;

}


// ==================================================
// FORÇA DE DEFESA
// ==================================================

function obterForcaDefesa(
    equipe,
    neutro
) {

    const media =
        equipe.mediaGolsSofridos;


    const total =
        equipe.golsSofridos;


    const jogos =
        equipe.jogos;


    if (
        media !== null &&
        media !== undefined &&
        media > 0
    ) {

        return limitar(
            media,
            0.20,
            4.00
        );

    }


    if (
        total !== null &&
        jogos !== null &&
        jogos > 0
    ) {

        return limitar(
            total / jogos,
            0.20,
            4.00
        );

    }


    return neutro;

}


// ==================================================
// FORMA RECENTE
//
// Retorna valor entre 0 e 1.
//
// Vitória = 1
// Empate = 0.5
// Derrota = 0
// ==================================================

function calcularForma(
    equipe
) {

    const jogos =
        equipe.ultimosJogos;


    if (
        !Array.isArray(jogos) ||
        jogos.length === 0
    ) {

        return 0.5;

    }


    let soma =
        0;


    let quantidade =
        0;


    // Considera no máximo os últimos 5
    const recentes =
        jogos.slice(
            -5
        );


    recentes.forEach(
        jogo => {

            const resultado =
                obterResultado(
                    jogo
                );


            if (
                resultado === "V"
            ) {

                soma += 1;

                quantidade++;

            }

            else if (
                resultado === "E"
            ) {

                soma += 0.5;

                quantidade++;

            }

            else if (
                resultado === "D"
            ) {

                soma += 0;

                quantidade++;

            }

        }
    );


    if (
        quantidade === 0
    ) {

        return 0.5;

    }


    return soma /
        quantidade;

}


// ==================================================
// IDENTIFICAR RESULTADO
// ==================================================

function obterResultado(
    jogo
) {

    if (
        typeof jogo === "string"
    ) {

        const valor =
            jogo
                .trim()
                .toUpperCase();

        if (
            ["V", "W", "WIN", "VITORIA", "VITÓRIA"]
                .includes(valor)
        ) {

            return "V";

        }

        if (
            ["E", "D", "DRAW", "EMPATE"]
                .includes(valor)
        ) {

            return "E";

        }

        if (
            ["L", "LOSS", "DERROTA", "D"]
                .includes(valor)
        ) {

            return "D";

        }

    }


    if (
        !jogo ||
        typeof jogo !== "object"
    ) {

        return null;

    }


    const resultado =
        String(
            jogo.resultado ??
            jogo.result ??
            jogo.statusResultado ??
            ""
        )
            .trim()
            .toUpperCase();


    if (
        ["V", "W", "WIN", "VITORIA", "VITÓRIA"]
            .includes(resultado)
    ) {

        return "V";

    }


    if (
        ["E", "DRAW", "EMPATE"]
            .includes(resultado)
    ) {

        return "E";

    }


    if (
        ["L", "LOSS", "DERROTA"]
            .includes(resultado)
    ) {

        return "D";

    }


    return null;

}


// ==================================================
// MATRIZ DE POISSON
// ==================================================

function gerarMatrizPoisson(
    lambdaCasa,
    lambdaFora,
    maxGols
) {

    const matriz = [];


    for (
        let golsCasa = 0;
        golsCasa <= maxGols;
        golsCasa++
    ) {

        const linha = [];


        for (
            let golsFora = 0;
            golsFora <= maxGols;
            golsFora++
        ) {

            const probCasa =
                poisson(
                    golsCasa,
                    lambdaCasa
                );


            const probFora =
                poisson(
                    golsFora,
                    lambdaFora
                );


            linha.push({

                golsCasa,

                golsFora,

                probabilidade:
                    probCasa *
                    probFora

            });

        }


        matriz.push(
            linha
        );

    }


    return matriz;

}


// ==================================================
// POISSON
// ==================================================

function poisson(
    gols,
    lambda
) {

    if (
        lambda <= 0
    ) {

        return gols === 0
            ? 1
            : 0;

    }


    return (
        Math.exp(-lambda) *
        Math.pow(lambda, gols)
    ) /
    fatorial(gols);

}


// ==================================================
// FATORIAL
// ==================================================

function fatorial(
    numero
) {

    if (
        numero <= 1
    ) {

        return 1;

    }


    let resultado =
        1;


    for (
        let i = 2;
        i <= numero;
        i++
    ) {

        resultado *= i;

    }


    return resultado;

}


// ==================================================
// PROBABILIDADES 1X2
// ==================================================

function calcularProbabilidadesResultado(
    matriz
) {

    let casa =
        0;


    let empate =
        0;


    let fora =
        0;


    matriz.forEach(
        linha => {

            linha.forEach(
                item => {

                    if (
                        item.golsCasa >
                        item.golsFora
                    ) {

                        casa +=
                            item.probabilidade;

                    }

                    else if (
                        item.golsCasa ===
                        item.golsFora
                    ) {

                        empate +=
                            item.probabilidade;

                    }

                    else {

                        fora +=
                            item.probabilidade;

                    }

                }
            );

        }
    );


    // Normalização para garantir
    // soma exata de 100%.

    const total =
        casa +
        empate +
        fora;


    if (
        total <= 0
    ) {

        return {

            casa:
                1 / 3,

            empate:
                1 / 3,

            fora:
                1 / 3

        };

    }


    return {

        casa:
            casa / total,

        empate:
            empate / total,

        fora:
            fora / total

    };

}


// ==================================================
// PLACAR MAIS PROVÁVEL
// ==================================================

function encontrarPlacarMaisProvavel(
    matriz
) {

    let melhor =
        null;


    matriz.forEach(
        linha => {

            linha.forEach(
                item => {

                    if (
                        !melhor ||
                        item.probabilidade >
                        melhor.probabilidade
                    ) {

                        melhor =
                            item;

                    }

                }
            );

        }
    );


    return {

        texto:
            `${melhor.golsCasa}x${melhor.golsFora}`,

        probabilidade:
            melhor.probabilidade

    };

}


// ==================================================
// PRINCIPAIS PLACARES
// ==================================================

function encontrarPrincipaisPlacares(
    matriz,
    limite = 5
) {

    const todos = [];


    matriz.forEach(
        linha => {

            linha.forEach(
                item => {

                    todos.push({

                        texto:
                            `${item.golsCasa}x${item.golsFora}`,

                        probabilidade:
                            item.probabilidade

                    });

                }
            );

        }
    );


    todos.sort(
        (
            a,
            b
        ) =>
            b.probabilidade -
            a.probabilidade
    );


    return todos.slice(
        0,
        limite
    );

}


// ==================================================
// FAVORITO
// ==================================================

function determinarFavorito(
    probabilidades
) {

    const opcoes = [

        {
            nome:
                "Casa",

            probabilidade:
                probabilidades.casa

        },

        {
            nome:
                "Empate",

            probabilidade:
                probabilidades.empate

        },

        {
            nome:
                "Fora",

            probabilidade:
                probabilidades.fora

        }

    ];


    opcoes.sort(
        (
            a,
            b
        ) =>
            b.probabilidade -
            a.probabilidade
    );


    return opcoes[0];

}


// ==================================================
// ODDS
// ==================================================

function normalizarOdds(
    odds = {}
) {

    if (
        !odds ||
        typeof odds !== "object"
    ) {

        return {};

    }


    return {

        casa:
            numeroValido(
                odds.casa ??
                odds.home ??
                odds["1"]
            ),

        empate:
            numeroValido(
                odds.empate ??
                odds.draw ??
                odds["X"]
            ),

        fora:
            numeroValido(
                odds.fora ??
                odds.away ??
                odds["2"]
            )

    };

}


// ==================================================
// VALUE BET
// ==================================================

function detectarValueBet(
    probabilidades,
    odds
) {

    const mercados = [

        {
            mercado:
                "1X2",

            selecao:
                "Casa",

            probabilidade:
                probabilidades.casa,

            odd:
                odds.casa

        },

        {
            mercado:
                "1X2",

            selecao:
                "Empate",

            probabilidade:
                probabilidades.empate,

            odd:
                odds.empate

        },

        {
            mercado:
                "1X2",

            selecao:
                "Fora",

            probabilidade:
                probabilidades.fora,

            odd:
                odds.fora

        }

    ];


    const oportunidades =
        mercados
            .filter(
                item =>
                    item.odd !== null &&
                    item.odd !== undefined &&
                    item.odd >= CONFIG.oddMinima
            )
            .map(
                item => {

                    const probabilidadeImplicita =
                        1 /
                        item.odd;


                    const valorEsperado =
                        (
                            item.probabilidade *
                            item.odd
                        ) - 1;


                    const edge =
                        item.probabilidade -
                        probabilidadeImplicita;


                    return {

                        mercado:
                            item.mercado,

                        selecao:
                            item.selecao,

                        odd:
                            arredondar(
                                item.odd
                            ),

                        probabilidadeModelo:
                            percentual(
                                item.probabilidade
                            ),

                        probabilidadeImplicita:
                            percentual(
                                probabilidadeImplicita
                            ),

                        edge:
                            percentual(
                                edge
                            ),

                        valorEsperado:
                            percentual(
                                valorEsperado
                            ),

                        valor:
                            edge >=
                            CONFIG.margemValueBet

                    };

                }
            )
            .filter(
                item =>
                    item.valor
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.valorEsperado -
                    a.valorEsperado
            );


    if (
        oportunidades.length === 0
    ) {

        return {

            encontrada:
                false,

            melhor:
                null,

            oportunidades:
                []

        };

    }


    return {

        encontrada:
            true,

        melhor:
            oportunidades[0],

        oportunidades

    };

}


// ==================================================
// CONFIANÇA
// ==================================================

function calcularConfianca(
    casa,
    fora,
    probabilidades
) {

    const diferenca =
        Math.abs(
            probabilidades.casa -
            probabilidades.fora
        );


    const dadosCasa =
        contarDados(
            casa
        );


    const dadosFora =
        contarDados(
            fora
        );


    const cobertura =
        Math.min(
            (
                dadosCasa +
                dadosFora
            ) / 10,
            1
        );


    const forca =
        diferenca *
        0.65 +
        cobertura *
        0.35;


    if (
        forca >= 0.35
    ) {

        return "Alta";

    }


    if (
        forca >= 0.20
    ) {

        return "Média";

    }


    return "Baixa";

}


// ==================================================
// CONTAR DADOS DISPONÍVEIS
// ==================================================

function contarDados(
    equipe
) {

    let total =
        0;


    if (
        equipe.golsMarcados !== null
    ) {

        total++;

    }


    if (
        equipe.golsSofridos !== null
    ) {

        total++;

    }


    if (
        equipe.mediaGolsMarcados !== null
    ) {

        total++;

    }


    if (
        equipe.mediaGolsSofridos !== null
    ) {

        total++;

    }


    if (
        equipe.jogos !== null &&
        equipe.jogos > 0
    ) {

        total++;

    }


    if (
        equipe.ultimosJogos.length > 0
    ) {

        total +=
            Math.min(
                equipe.ultimosJogos.length,
                5
            );

    }


    return total;

}


// ==================================================
// VERIFICAR SE EXISTEM DADOS
// ==================================================

function possuiDados(
    equipe
) {

    return (
        equipe.golsMarcados !== null ||
        equipe.golsSofridos !== null ||
        equipe.mediaGolsMarcados !== null ||
        equipe.mediaGolsSofridos !== null ||
        equipe.jogos !== null ||
        equipe.ultimosJogos.length > 0
    );

}


// ==================================================
// PRIMEIRO VALOR VÁLIDO
// ==================================================

function primeiroValor(
    ...valores
) {

    for (
        const valor of valores
    ) {

        if (
            valor !== undefined &&
            valor !== null &&
            String(valor).trim()
        ) {

            return valor;

        }

    }


    return null;

}


// ==================================================
// CONVERTER NÚMERO
// ==================================================

function numeroValido(
    valor
) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return null;

    }


    const numero =
        Number(
            String(valor)
                .replace(",", ".")
        );


    if (
        !Number.isFinite(numero)
    ) {

        return null;

    }


    return numero;

}


// ==================================================
// ARREDONDAR
// ==================================================

function arredondar(
    valor,
    casas = 2
) {

    return Number(
        Number(valor)
            .toFixed(casas)
    );

}


// ==================================================
// PERCENTUAL
// ==================================================

function percentual(
    valor
) {

    return Number(
        (
            Number(valor) *
            100
        ).toFixed(2)
    );

}


// ==================================================
// LIMITAR VALOR
// ==================================================

function limitar(
    valor,
    minimo,
    maximo
) {

    return Math.max(
        minimo,
        Math.min(
            maximo,
            Number(valor)
        )
    );

}


// ==================================================
// EXPORTAÇÕES AUXILIARES
//
// Úteis para testes do Motor v6.
// ==================================================

export {

    gerarMatrizPoisson,

    calcularProbabilidadesResultado,

    detectarValueBet,

    calcularForma

};
