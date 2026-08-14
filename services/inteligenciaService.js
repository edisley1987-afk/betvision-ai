// ==========================================================
// BETVISION AI
// services/inteligenciaService.js
//
// MOTOR ESTATÍSTICO v9.0
//
// CORREÇÕES v9:
//
// - histórico real PostgreSQL
// - H2H real PostgreSQL
// - normalização forte de nomes
// - suporta diferenças de acentos
// - suporta diferenças de pontuação
// - somente jogos anteriores ao jogo analisado
// - ignora o próprio jogo pelo api_id
// - somente jogos com placar válido
// - evita histórico fictício
// - 0 jogos = 0 estatísticas reais
// - fallback estatístico somente dentro do modelo
// - Poisson
// - 1X2
// - gols esperados
// - placar provável
// - over / under
// - ambas marcam
// - value bet
// - confiança ajustada pela qualidade dos dados
// - America/Sao_Paulo
// - gerarAnaliseIA mantida
// - gerarAnaliseInteligente mantida
//
// ==========================================================

import {
    query
} from "../database/database.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const TIMEZONE =
    "America/Sao_Paulo";

const MINIMO_JOGOS_HISTORICO =
    3;

const LIMITE_HISTORICO =
    10;

const LIMITE_H2H =
    10;

const MAX_GOLS_POISSON =
    10;


// ==========================================================
// UTILITÁRIOS
// ==========================================================

function numero(
    valor,
    padrao = 0
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return padrao;

    }

    const n =
        Number(valor);

    return Number.isFinite(n)
        ? n
        : padrao;

}


function limitar(
    valor,
    minimo,
    maximo
) {

    return Math.min(
        maximo,
        Math.max(
            minimo,
            numero(valor)
        )
    );

}


function arredondar(
    valor,
    casas = 2
) {

    const n =
        numero(valor);

    const fator =
        10 ** casas;

    return Math.round(
        n * fator
    ) / fator;

}


function texto(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }

    return String(valor)
        .trim();

}


// ==========================================================
// NORMALIZAR NOME DE EQUIPE
//
// Exemplo:
//
// "Sporting Clube de Portugal"
// "SPORTING CLUBE DE PORTUGAL"
// "Sporting Clube de Portugal "
//
// tornam-se comparáveis.
//
// Também remove acentos e caracteres especiais.
// ==========================================================

function normalizarNomeEquipe(
    valor
) {

    return texto(valor)
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        );

}


// ==========================================================
// EXPRESSÃO SQL PARA NORMALIZAR NOMES
//
// Não depende da extensão unaccent.
//
// ==========================================================

const SQL_NORMALIZAR_NOME = `

    regexp_replace(

        translate(

            lower(
                trim(%COLUNA%)
            ),

            'áàãâäéèêëíìîïóòõôöúùûüçñ',
            'aaaaaeeeeiiiiooooouuuucn'

        ),

        '[^a-z0-9]',
        '',
        'g'

    )

`;


// ==========================================================
// DATA BRASIL
// ==========================================================

function obterDataHojeBrasil() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                TIMEZONE,

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(
        new Date()
    );

}


// ==========================================================
// NORMALIZAR DATA PARA SQL
// ==========================================================

function normalizarDataJogo(
    jogo
) {

    const candidatos = [

        jogo?.data_jogo,
        jogo?.dataJogo,
        jogo?.jogo_data,

        jogo?.data,
        jogo?.inicio,
        jogo?.kickoff,

        jogo?.date,
        jogo?.datetime,

        jogo?.fixture?.date

    ];

    for (
        const valor
        of candidatos
    ) {

        if (!valor) {

            continue;

        }

        const data =
            new Date(valor);

        if (
            !Number.isNaN(
                data.getTime()
            )
        ) {

            return data;

        }

    }

    return null;

}


// ==========================================================
// EXTRAIR EQUIPES
// ==========================================================

function extrairEquipes(
    jogo
) {

    if (
        jogo &&
        typeof jogo === "object"
    ) {

        const casa =
            texto(
                jogo.time_casa ??
                jogo.casa ??
                jogo.home_team ??
                jogo.homeTeam ??
                jogo.home ??
                jogo.equipe_casa ??
                jogo.equipeCasa ??
                jogo.fixture?.teams?.home?.name
            );

        const fora =
            texto(
                jogo.time_fora ??
                jogo.fora ??
                jogo.away_team ??
                jogo.awayTeam ??
                jogo.away ??
                jogo.equipe_fora ??
                jogo.equipeFora ??
                jogo.fixture?.teams?.away?.name
            );

        if (
            casa &&
            fora
        ) {

            return {
                casa,
                fora
            };

        }

        const nome =
            texto(
                jogo.jogo ??
                jogo.nome ??
                jogo.name
            );

        if (nome) {

            return separarJogo(
                nome
            );

        }

    }


    return separarJogo(
        texto(jogo)
    );

}


// ==========================================================
// SEPARAR JOGO
// ==========================================================

function separarJogo(
    jogo
) {

    const valor =
        texto(jogo);

    if (!valor) {

        return {
            casa: "",
            fora: ""
        };

    }


    const separadores = [

        " x ",
        " X ",

        " vs ",
        " VS ",
        " Vs ",

        " v ",
        " V ",

        " - "

    ];


    for (
        const separador
        of separadores
    ) {

        if (
            valor.includes(
                separador
            )
        ) {

            const partes =
                valor.split(
                    separador
                );

            const casa =
                texto(
                    partes.shift()
                );

            const fora =
                texto(
                    partes.join(
                        separador
                    )
                );

            return {
                casa,
                fora
            };

        }

    }


    return {
        casa: valor,
        fora: ""
    };

}


// ==========================================================
// NOME DO JOGO
// ==========================================================

function montarNomeJogo(
    casa,
    fora
) {

    if (
        casa &&
        fora
    ) {

        return `${casa} x ${fora}`;

    }

    return (
        casa ||
        fora ||
        ""
    );

}


// ==========================================================
// POISSON
// ==========================================================

function fatorial(
    n
) {

    if (
        n <= 1
    ) {

        return 1;

    }

    let resultado =
        1;

    for (
        let i = 2;
        i <= n;
        i++
    ) {

        resultado *= i;

    }

    return resultado;

}


function poisson(
    gols,
    lambda
) {

    const k =
        Number(gols);

    const media =
        numero(lambda);

    if (
        !Number.isInteger(k) ||
        k < 0 ||
        media <= 0
    ) {

        return 0;

    }

    return (
        Math.exp(-media) *
        Math.pow(media, k)
    ) /
    fatorial(k);

}


// ==========================================================
// MÉDIA
// ==========================================================

function calcularMedia(
    valores
) {

    if (
        !Array.isArray(valores) ||
        valores.length === 0
    ) {

        return 0;

    }

    const lista =
        valores
            .map(
                valor =>
                    numero(valor)
            )
            .filter(
                valor =>
                    Number.isFinite(valor)
            );

    if (
        lista.length === 0
    ) {

        return 0;

    }

    return (
        lista.reduce(
            (
                total,
                valor
            ) =>
                total + valor,
            0
        )
        /
        lista.length
    );

}


// ==========================================================
// HISTÓRICO DA EQUIPE
//
// Somente partidas:
// - anteriores ao jogo
// - com data válida
// - com gols válidos
// - preferencialmente finalizadas
//
// Também exclui o próprio api_id.
// ==========================================================

async function buscarHistoricoEquipe(
    nomeEquipe,
    dataJogo = null,
    apiIdAtual = null
) {

    if (!nomeEquipe) {

        return [];

    }


    try {

        const expressaoCasa =
            SQL_NORMALIZAR_NOME
                .replace(
                    "%COLUNA%",
                    "time_casa"
                );

        const expressaoFora =
            SQL_NORMALIZAR_NOME
                .replace(
                    "%COLUNA%",
                    "time_fora"
                );


        const parametros = [
            nomeEquipe,
            LIMITE_HISTORICO
        ];


        let condicaoData = `
            data_jogo IS NOT NULL
        `;


        if (
            dataJogo
        ) {

            parametros.splice(
                1,
                0,
                dataJogo
            );

            condicaoData = `
                data_jogo IS NOT NULL
                AND data_jogo < $2
            `;

        }
        else {

            condicaoData = `
                data_jogo IS NOT NULL
                AND data_jogo < CURRENT_TIMESTAMP
            `;

        }


        let parametroLimite;

        if (
            dataJogo
        ) {

            parametroLimite =
                "$3";

        }
        else {

            parametroLimite =
                "$2";

        }


        const condicaoApiId =
            apiIdAtual
                ? `
                    AND (
                        api_id IS NULL
                        OR api_id <> $${parametros.length + 1}
                    )
                `
                : "";


        if (
            apiIdAtual
        ) {

            parametros.push(
                apiIdAtual
            );

        }


        const sql = `

            SELECT

                id,
                api_id,

                time_casa,
                time_fora,

                gols_casa,
                gols_fora,

                data_jogo,
                status

            FROM jogos

            WHERE

                (

                    ${expressaoCasa}
                    =
                    regexp_replace(

                        translate(

                            lower(
                                trim($1)
                            ),

                            'áàãâäéèêëíìîïóòõôöúùûüçñ',
                            'aaaaaeeeeiiiiooooouuuucn'

                        ),

                        '[^a-z0-9]',
                        '',
                        'g'

                    )

                    OR

                    ${expressaoFora}
                    =
                    regexp_replace(

                        translate(

                            lower(
                                trim($1)
                            ),

                            'áàãâäéèêëíìîïóòõôöúùûüçñ',
                            'aaaaaeeeeiiiiooooouuuucn'

                        ),

                        '[^a-z0-9]',
                        '',
                        'g'

                    )

                )

                AND

                ${condicaoData}

                ${condicaoApiId}

                AND gols_casa IS NOT NULL
                AND gols_fora IS NOT NULL

            ORDER BY
                data_jogo DESC

            LIMIT ${parametroLimite}

        `;


        const resultado =
            await query(
                sql,
                parametros
            );


        const linhas =
            resultado?.rows || [];


        console.log(
            `📚 Banco retornou ${linhas.length} ` +
            `registros para ${nomeEquipe}`
        );


        return linhas;

    }

    catch (erro) {

        console.error(
            `❌ Erro histórico ${nomeEquipe}:`,
            erro.message
        );

        return [];

    }

}


// ==========================================================
// VALIDAR HISTÓRICO
// ==========================================================

function jogoHistoricoValido(
    jogo
) {

    if (!jogo) {

        return false;

    }


    const golsCasa =
        Number(
            jogo.gols_casa
        );

    const golsFora =
        Number(
            jogo.gols_fora
        );


    if (
        !Number.isFinite(golsCasa) ||
        !Number.isFinite(golsFora)
    ) {

        return false;

    }


    if (
        golsCasa < 0 ||
        golsFora < 0
    ) {

        return false;

    }


    if (
        !jogo.data_jogo
    ) {

        return false;

    }


    return true;

}


// ==========================================================
// FILTRAR HISTÓRICO VÁLIDO
// ==========================================================

function filtrarHistoricoValido(
    historico
) {

    if (
        !Array.isArray(historico)
    ) {

        return [];

    }


    return historico.filter(
        jogo =>
            jogoHistoricoValido(
                jogo
            )
    );

}


// ==========================================================
// ESTATÍSTICAS DA EQUIPE
//
// IMPORTANTE:
//
// Se não houver histórico,
// não inventa 50% nem 1 gol.
//
// Retorna ZERO.
//
// ==========================================================

function calcularEstatisticasEquipe(
    historico,
    equipe
) {

    const jogos =
        filtrarHistoricoValido(
            historico
        );


    if (
        jogos.length === 0
    ) {

        return {

            jogos: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            aproveitamento: 0,

            forma: 0

        };

    }


    const golsMarcados = [];
    const golsSofridos = [];

    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;


    const nomeEquipe =
        normalizarNomeEquipe(
            equipe
        );


    for (
        const jogo
        of jogos
    ) {

        const casa =
            texto(
                jogo.time_casa
            );

        const fora =
            texto(
                jogo.time_fora
            );


        const golsCasa =
            numero(
                jogo.gols_casa
            );

        const golsFora =
            numero(
                jogo.gols_fora
            );


        const equipeEhCasa =
            normalizarNomeEquipe(
                casa
            )
            ===
            nomeEquipe;


        if (
            equipeEhCasa
        ) {

            golsMarcados.push(
                golsCasa
            );

            golsSofridos.push(
                golsFora
            );


            if (
                golsCasa > golsFora
            ) {

                vitorias++;

            }
            else if (
                golsCasa === golsFora
            ) {

                empates++;

            }
            else {

                derrotas++;

            }

        }
        else {

            golsMarcados.push(
                golsFora
            );

            golsSofridos.push(
                golsCasa
            );


            if (
                golsFora > golsCasa
            ) {

                vitorias++;

            }
            else if (
                golsFora === golsCasa
            ) {

                empates++;

            }
            else {

                derrotas++;

            }

        }

    }


    const totalJogos =
        jogos.length;


    const aproveitamento =
        (
            vitorias * 3 +
            empates
        )
        /
        (
            totalJogos * 3
        );


    const pontosForma = [];


    for (
        const jogo
        of jogos
    ) {

        const equipeEhCasa =
            normalizarNomeEquipe(
                jogo.time_casa
            )
            ===
            nomeEquipe;


        const gc =
            numero(
                jogo.gols_casa
            );

        const gf =
            numero(
                jogo.gols_fora
            );


        let pontos = 0;


        if (
            equipeEhCasa
        ) {

            if (
                gc > gf
            ) {

                pontos = 1;

            }
            else if (
                gc === gf
            ) {

                pontos = 0.5;

            }

        }
        else {

            if (
                gf > gc
            ) {

                pontos = 1;

            }
            else if (
                gf === gc
            ) {

                pontos = 0.5;

            }

        }


        pontosForma.push(
            pontos
        );

    }


    return {

        jogos:
            totalJogos,

        golsMarcados:
            arredondar(
                calcularMedia(
                    golsMarcados
                ),
                3
            ),

        golsSofridos:
            arredondar(
                calcularMedia(
                    golsSofridos
                ),
                3
            ),

        vitorias,

        empates,

        derrotas,

        aproveitamento:
            arredondar(
                aproveitamento,
                4
            ),

        forma:
            arredondar(
                calcularMedia(
                    pontosForma
                ),
                4
            )

    };

}


// ==========================================================
// H2H
//
// Agora usa nomes normalizados.
// ==========================================================

async function buscarH2H(
    casa,
    fora,
    dataJogo = null,
    apiIdAtual = null
) {

    if (
        !casa ||
        !fora
    ) {

        return [];

    }


    try {

        const expressaoCasa =
            SQL_NORMALIZAR_NOME
                .replace(
                    "%COLUNA%",
                    "time_casa"
                );

        const expressaoFora =
            SQL_NORMALIZAR_NOME
                .replace(
                    "%COLUNA%",
                    "time_fora"
                );


        let parametros = [
            casa,
            fora
        ];


        let condicaoData;


        if (
            dataJogo
        ) {

            parametros.push(
                dataJogo
            );

            condicaoData = `
                AND data_jogo IS NOT NULL
                AND data_jogo < $3
            `;

        }
        else {

            condicaoData = `
                AND data_jogo IS NOT NULL
                AND data_jogo < CURRENT_TIMESTAMP
            `;

        }


        let condicaoApiId =
            "";


        if (
            apiIdAtual
        ) {

            parametros.push(
                apiIdAtual
            );

            condicaoApiId = `
                AND (
                    api_id IS NULL
                    OR api_id <> $${parametros.length}
                )
            `;

        }


        const limiteParametro =
            parametros.length + 1;


        parametros.push(
            LIMITE_H2H
        );


        const sql = `

            SELECT

                id,
                api_id,

                time_casa,
                time_fora,

                gols_casa,
                gols_fora,

                data_jogo,
                status

            FROM jogos

            WHERE

                (

                    (

                        ${expressaoCasa}

                        =

                        regexp_replace(

                            translate(

                                lower(
                                    trim($1)
                                ),

                                'áàãâäéèêëíìîïóòõôöúùûüçñ',
                                'aaaaaeeeeiiiiooooouuuucn'

                            ),

                            '[^a-z0-9]',
                            '',
                            'g'

                        )

                        AND

                        ${expressaoFora}

                        =

                        regexp_replace(

                            translate(

                                lower(
                                    trim($2)
                                ),

                                'áàãâäéèêëíìîïóòõôöúùûüçñ',
                                'aaaaaeeeeiiiiooooouuuucn'

                            ),

                            '[^a-z0-9]',
                            '',
                            'g'

                        )

                    )

                    OR

                    (

                        ${expressaoCasa}

                        =

                        regexp_replace(

                            translate(

                                lower(
                                    trim($2)
                                ),

                                'áàãâäéèêëíìîïóòõôöúùûüçñ',
                                'aaaaaeeeeiiiiooooouuuucn'

                            ),

                            '[^a-z0-9]',
                            '',
                            'g'

                        )

                        AND

                        ${expressaoFora}

                        =

                        regexp_replace(

                            translate(

                                lower(
                                    trim($1)
                                ),

                                'áàãâäéèêëíìîïóòõôöúùûüçñ',
                                'aaaaaeeeeiiiiooooouuuucn'

                            ),

                            '[^a-z0-9]',
                            '',
                            'g'

                        )

                    )

                )

                ${condicaoData}

                ${condicaoApiId}

                AND gols_casa IS NOT NULL
                AND gols_fora IS NOT NULL

            ORDER BY
                data_jogo DESC

            LIMIT $${limiteParametro}

        `;


        const resultado =
            await query(
                sql,
                parametros
            );


        const linhas =
            resultado?.rows || [];


        console.log(
            `⚔️ H2H banco: ${linhas.length} ` +
            `registros encontrados`
        );


        return filtrarHistoricoValido(
            linhas
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro H2H:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// ESTATÍSTICAS H2H
// ==========================================================

function calcularEstatisticasH2H(
    historico,
    casa,
    fora
) {

    const jogos =
        filtrarHistoricoValido(
            historico
        );


    let vitoriasCasa = 0;
    let empates = 0;
    let vitoriasFora = 0;


    const golsCasa = [];
    const golsFora = [];


    const nomeCasaAtual =
        normalizarNomeEquipe(
            casa
        );


    for (
        const jogo
        of jogos
    ) {

        const nomeCasa =
            normalizarNomeEquipe(
                jogo.time_casa
            );


        const gc =
            numero(
                jogo.gols_casa
            );

        const gf =
            numero(
                jogo.gols_fora
            );


        const casaFoiMandante =
            nomeCasa
            ===
            nomeCasaAtual;


        if (
            casaFoiMandante
        ) {

            golsCasa.push(gc);
            golsFora.push(gf);


            if (
                gc > gf
            ) {

                vitoriasCasa++;

            }
            else if (
                gc === gf
            ) {

                empates++;

            }
            else {

                vitoriasFora++;

            }

        }
        else {

            golsCasa.push(gf);
            golsFora.push(gc);


            if (
                gf > gc
            ) {

                vitoriasCasa++;

            }
            else if (
                gf === gc
            ) {

                empates++;

            }
            else {

                vitoriasFora++;

            }

        }

    }


    return {

        jogos:
            jogos.length,

        casaVitorias:
            vitoriasCasa,

        empates,

        foraVitorias:
            vitoriasFora,

        golsCasa:
            arredondar(
                calcularMedia(
                    golsCasa
                ),
                3
            ),

        golsFora:
            arredondar(
                calcularMedia(
                    golsFora
                ),
                3
            )

    };

}


// ==========================================================
// FORÇA OFENSIVA
//
// O histórico continua sendo zero quando não existe.
//
// O fallback 1.0 é utilizado SOMENTE pelo modelo,
// nunca nas estatísticas apresentadas.
// ==========================================================

function calcularForcaOfensiva(
    estatisticas
) {

    if (
        !estatisticas ||
        estatisticas.jogos === 0
    ) {

        return 1;

    }


    return limitar(
        estatisticas.golsMarcados,
        0.25,
        4
    );

}


// ==========================================================
// FORÇA DEFENSIVA
// ==========================================================

function calcularForcaDefensiva(
    estatisticas
) {

    if (
        !estatisticas ||
        estatisticas.jogos === 0
    ) {

        return 1;

    }


    return limitar(
        estatisticas.golsSofridos,
        0.25,
        4
    );

}


// ==========================================================
// GOLS ESPERADOS
// ==========================================================

function calcularGolsEsperados(
    casa,
    fora,
    h2h = null
) {

    const ataqueCasa =
        calcularForcaOfensiva(
            casa
        );

    const defesaCasa =
        calcularForcaDefensiva(
            casa
        );

    const ataqueFora =
        calcularForcaOfensiva(
            fora
        );

    const defesaFora =
        calcularForcaDefensiva(
            fora
        );


    let lambdaCasa =
        (
            ataqueCasa +
            defesaFora
        )
        /
        2;


    let lambdaFora =
        (
            ataqueFora +
            defesaCasa
        )
        /
        2;


    // ======================================================
    // H2H
    // Somente se houver pelo menos 3 confrontos reais.
    // ======================================================

    if (
        h2h &&
        h2h.jogos >= 3
    ) {

        const mediaH2HCasa =
            numero(
                h2h.golsCasa
            );

        const mediaH2HFora =
            numero(
                h2h.golsFora
            );


        lambdaCasa =
            (
                lambdaCasa * 0.80
            )
            +
            (
                mediaH2HCasa * 0.20
            );


        lambdaFora =
            (
                lambdaFora * 0.80
            )
            +
            (
                mediaH2HFora * 0.20
            );

    }


    // ======================================================
    // MANDO DE CAMPO
    // ======================================================

    lambdaCasa *=
        1.10;

    lambdaFora *=
        0.95;


    lambdaCasa =
        limitar(
            lambdaCasa,
            0.20,
            4.50
        );

    lambdaFora =
        limitar(
            lambdaFora,
            0.20,
            4.50
        );


    return {

        casa:
            arredondar(
                lambdaCasa,
                2
            ),

        fora:
            arredondar(
                lambdaFora,
                2
            ),

        total:
            arredondar(
                lambdaCasa +
                lambdaFora,
                2
            )

    };

}


// ==========================================================
// PROBABILIDADE DE GOLS ATÉ
// ==========================================================

function probabilidadeGolsAte(
    limite,
    lambda
) {

    let probabilidade =
        0;


    for (
        let gols = 0;
        gols <= limite;
        gols++
    ) {

        probabilidade +=
            poisson(
                gols,
                lambda
            );

    }


    return limitar(
        probabilidade,
        0,
        1
    );

}


// ==========================================================
// OVER
// ==========================================================

function probabilidadeOver(
    linha,
    lambda
) {

    const limite =
        Math.floor(
            linha
        );


    return limitar(
        1 -
        probabilidadeGolsAte(
            limite,
            lambda
        ),
        0,
        1
    );

}


// ==========================================================
// UNDER
// ==========================================================

function probabilidadeUnder(
    linha,
    lambda
) {

    return limitar(
        1 -
        probabilidadeOver(
            linha,
            lambda
        ),
        0,
        1
    );

}


// ==========================================================
// 1X2
// ==========================================================

function calcularProbabilidadesResultado(
    golsCasa,
    golsFora
) {

    let casa = 0;
    let empate = 0;
    let fora = 0;


    for (
        let gc = 0;
        gc <= MAX_GOLS_POISSON;
        gc++
    ) {

        for (
            let gf = 0;
            gf <= MAX_GOLS_POISSON;
            gf++
        ) {

            const probCasa =
                poisson(
                    gc,
                    golsCasa
                );

            const probFora =
                poisson(
                    gf,
                    golsFora
                );


            const prob =
                probCasa *
                probFora;


            if (
                gc > gf
            ) {

                casa += prob;

            }
            else if (
                gc === gf
            ) {

                empate += prob;

            }
            else {

                fora += prob;

            }

        }

    }


    const total =
        casa +
        empate +
        fora;


    if (
        total <= 0
    ) {

        return {

            casa:
                0.3333,

            empate:
                0.3333,

            fora:
                0.3334

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


// ==========================================================
// PLACAR PROVÁVEL
// ==========================================================

function preverPlacar(
    golsCasa,
    golsFora
) {

    let melhorPlacar =
        "0x0";

    let maiorProbabilidade =
        0;


    for (
        let gc = 0;
        gc <= 6;
        gc++
    ) {

        for (
            let gf = 0;
            gf <= 6;
            gf++
        ) {

            const prob =
                poisson(
                    gc,
                    golsCasa
                )
                *
                poisson(
                    gf,
                    golsFora
                );


            if (
                prob >
                maiorProbabilidade
            ) {

                maiorProbabilidade =
                    prob;

                melhorPlacar =
                    `${gc}x${gf}`;

            }

        }

    }


    return {

        placar:
            melhorPlacar,

        probabilidade:
            arredondar(
                maiorProbabilidade *
                100,
                2
            )

    };

}


// ==========================================================
// AMBAS MARCAM
// ==========================================================

function calcularAmbasMarcam(
    golsCasa,
    golsFora
) {

    const casaNaoMarca =
        poisson(
            0,
            golsCasa
        );

    const foraNaoMarca =
        poisson(
            0,
            golsFora
        );


    const probabilidade =
        1 -
        casaNaoMarca -
        foraNaoMarca +
        (
            casaNaoMarca *
            foraNaoMarca
        );


    return limitar(
        probabilidade,
        0,
        1
    );

}


// ==========================================================
// CONFIANÇA
//
// Agora a confiança é reduzida quando não existe histórico.
// ==========================================================

function calcularConfianca(
    probabilidades,
    amostraCasa,
    amostraFora,
    h2hJogos
) {

    const valores = [

        numero(
            probabilidades.casa
        ),

        numero(
            probabilidades.empate
        ),

        numero(
            probabilidades.fora
        )

    ]
    .sort(
        (
            a,
            b
        ) =>
            b - a
    );


    const maior =
        valores[0] || 0;

    const segundo =
        valores[1] || 0;


    const margem =
        maior -
        segundo;


    const amostra =
        Math.min(
            numero(
                amostraCasa
            ),
            numero(
                amostraFora
            )
        );


    let confianca =
        25;


    confianca +=
        margem * 100;


    if (
        amostra >= 10
    ) {

        confianca += 12;

    }
    else if (
        amostra >= 8
    ) {

        confianca += 10;

    }
    else if (
        amostra >= 5
    ) {

        confianca += 6;

    }
    else if (
        amostra >= 3
    ) {

        confianca += 3;

    }
    else if (
        amostra === 0
    ) {

        confianca -= 8;

    }


    if (
        h2hJogos >= 5
    ) {

        confianca += 3;

    }


    confianca =
        limitar(
            confianca,
            20,
            95
        );


    // ======================================================
    // SEM HISTÓRICO SUFICIENTE:
    // nunca classificar como Alta.
    // ======================================================

    if (
        amostra <
        MINIMO_JOGOS_HISTORICO
    ) {

        confianca =
            Math.min(
                confianca,
                59
            );

    }


    let nivel =
        "Baixa";


    if (
        confianca >= 70
    ) {

        nivel =
            "Alta";

    }
    else if (
        confianca >= 50
    ) {

        nivel =
            "Média";

    }


    return {

        percentual:
            arredondar(
                confianca,
                1
            ),

        nivel

    };

}


// ==========================================================
// PROBABILIDADE IMPLÍCITA
// ==========================================================

function probabilidadeImplicita(
    odd
) {

    const valor =
        numero(
            odd
        );


    if (
        valor <= 1
    ) {

        return 0;

    }


    return 1 / valor;

}


// ==========================================================
// VALUE BET
// ==========================================================

function calcularValueBet(
    probabilidade,
    odd
) {

    const oddNumerica =
        numero(
            odd
        );


    if (
        oddNumerica <= 1 ||
        probabilidade <= 0
    ) {

        return {

            valueBet:
                false,

            valor:
                0,

            edge:
                0,

            oddJusta:
                0

        };

    }


    const probabilidadeMercado =
        probabilidadeImplicita(
            oddNumerica
        );


    const edge =
        probabilidade -
        probabilidadeMercado;


    const valorEstimado =
        (
            probabilidade *
            oddNumerica
        ) -
        1;


    const oddJusta =
        1 /
        probabilidade;


    return {

        valueBet:
            edge >= 0.05,

        valor:
            arredondar(
                valorEstimado *
                100,
                2
            ),

        edge:
            arredondar(
                edge *
                100,
                2
            ),

        oddJusta:
            arredondar(
                oddJusta,
                2
            )

    };

}


// ==========================================================
// NORMALIZAR ODDS
// ==========================================================

function extrairOdds(
    dados
) {

    const odds =
        dados?.odds ||
        dados?.odd ||
        {};


    return {

        casa:
            numero(
                odds.casa ??
                odds.home ??
                odds.home_win ??
                dados?.odd_casa
            ),

        empate:
            numero(
                odds.empate ??
                odds.draw ??
                dados?.odd_empate
            ),

        fora:
            numero(
                odds.fora ??
                odds.away ??
                odds.away_win ??
                dados?.odd_fora
            )

    };

}


// ==========================================================
// ANÁLISE PRINCIPAL
// ==========================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    const equipes =
        extrairEquipes(
            jogo
        );


    if (
        !equipes.casa ||
        !equipes.fora
    ) {

        throw new Error(
            "Jogo não informado"
        );

    }


    const nomeJogo =
        montarNomeJogo(
            equipes.casa,
            equipes.fora
        );


    const dataJogo =
        normalizarDataJogo(
            jogo
        );


    const apiIdAtual =
        jogo?.api_id ??
        jogo?.apiId ??
        jogo?.fixture?.id ??
        null;


    console.log(
        "=================================================="
    );

    console.log(
        `📊 BUSCANDO HISTÓRICO REAL: ${nomeJogo}`
    );

    console.log(
        `📅 Data Brasil: ${obterDataHojeBrasil()}`
    );

    console.log(
        `🌎 Fuso: ${TIMEZONE}`
    );

    console.log(
        `🆔 API ID atual: ${apiIdAtual || "não informado"}`
    );

    if (
        dataJogo
    ) {

        console.log(
            `📅 Data do jogo: ${dataJogo.toISOString()}`
        );

    }

    console.log(
        "=================================================="
    );


    // ======================================================
    // HISTÓRICO CASA
    // ======================================================

    console.log(
        `📚 Consultando histórico do time: ${equipes.casa}`
    );


    const historicoCasa =
        await buscarHistoricoEquipe(
            equipes.casa,
            dataJogo,
            apiIdAtual
        );


    // ======================================================
    // HISTÓRICO FORA
    // ======================================================

    console.log(
        `📚 Consultando histórico do time: ${equipes.fora}`
    );


    const historicoFora =
        await buscarHistoricoEquipe(
            equipes.fora,
            dataJogo,
            apiIdAtual
        );


    const historicoCasaValido =
        filtrarHistoricoValido(
            historicoCasa
        );


    const historicoForaValido =
        filtrarHistoricoValido(
            historicoFora
        );


    console.log(
        `📊 ${equipes.casa}: ` +
        `${historicoCasaValido.length} jogos históricos válidos`
    );


    console.log(
        `📊 ${equipes.fora}: ` +
        `${historicoForaValido.length} jogos históricos válidos`
    );


    // ======================================================
    // H2H
    // ======================================================

    console.log(
        `⚔️ Consultando H2H: ${nomeJogo}`
    );


    const h2hHistorico =
        await buscarH2H(
            equipes.casa,
            equipes.fora,
            dataJogo,
            apiIdAtual
        );


    const h2h =
        calcularEstatisticasH2H(
            h2hHistorico,
            equipes.casa,
            equipes.fora
        );


    console.log(
        `⚔️ H2H válido: ${h2h.jogos} confrontos`
    );


    console.log(
        `⚔️ H2H: ${h2h.jogos} confrontos | ` +
        `Casa ${h2h.casaVitorias} vitórias | ` +
        `Empates ${h2h.empates} | ` +
        `Fora ${h2h.foraVitorias}`
    );


    // ======================================================
    // ESTATÍSTICAS
    // ======================================================

    const estatisticasCasa =
        calcularEstatisticasEquipe(
            historicoCasaValido,
            equipes.casa
        );


    const estatisticasFora =
        calcularEstatisticasEquipe(
            historicoForaValido,
            equipes.fora
        );


    console.log(
        `📊 ${equipes.casa}: ` +
        `${estatisticasCasa.jogos} jogos | ` +
        `forma ${arredondar(
            estatisticasCasa.forma * 100,
            1
        )}% | ` +
        `gols ${estatisticasCasa.golsMarcados}`
    );


    console.log(
        `📊 ${equipes.fora}: ` +
        `${estatisticasFora.jogos} jogos | ` +
        `forma ${arredondar(
            estatisticasFora.forma * 100,
            1
        )}% | ` +
        `gols ${estatisticasFora.golsMarcados}`
    );


    // ======================================================
    // GOLS ESPERADOS
    // ======================================================

    const gols =
        calcularGolsEsperados(
            estatisticasCasa,
            estatisticasFora,
            h2h
        );


    // ======================================================
    // 1X2
    // ======================================================

    const probabilidades =
        calcularProbabilidadesResultado(
            gols.casa,
            gols.fora
        );


    // ======================================================
    // PLACAR
    // ======================================================

    const placar =
        preverPlacar(
            gols.casa,
            gols.fora
        );


    // ======================================================
    // AMBAS MARCAM
    // ======================================================

    const ambasMarcam =
        calcularAmbasMarcam(
            gols.casa,
            gols.fora
        );


    // ======================================================
    // MERCADOS
    // ======================================================

    const over15 =
        probabilidadeOver(
            1.5,
            gols.total
        );

    const over25 =
        probabilidadeOver(
            2.5,
            gols.total
        );

    const over35 =
        probabilidadeOver(
            3.5,
            gols.total
        );

    const under15 =
        probabilidadeUnder(
            1.5,
            gols.total
        );

    const under25 =
        probabilidadeUnder(
            2.5,
            gols.total
        );

    const under35 =
        probabilidadeUnder(
            3.5,
            gols.total
        );


    // ======================================================
    // AMOSTRA
    // ======================================================

    const amostra =
        Math.min(
            estatisticasCasa.jogos,
            estatisticasFora.jogos
        );


    // ======================================================
    // CONFIANÇA
    // ======================================================

    const confianca =
        calcularConfianca(
            probabilidades,
            estatisticasCasa.jogos,
            estatisticasFora.jogos,
            h2h.jogos
        );


    // ======================================================
    // ODDS
    // ======================================================

    const odds =
        extrairOdds(
            dados
        );


    // ======================================================
    // VALUE BET
    // ======================================================

    const valueCasa =
        calcularValueBet(
            probabilidades.casa,
            odds.casa
        );


    const valueEmpate =
        calcularValueBet(
            probabilidades.empate,
            odds.empate
        );


    const valueFora =
        calcularValueBet(
            probabilidades.fora,
            odds.fora
        );


    const valueBets = [];


    if (
        valueCasa.valueBet
    ) {

        valueBets.push({

            mercado:
                "1X2",

            selecao:
                "Casa",

            odd:
                odds.casa,

            probabilidade:
                arredondar(
                    probabilidades.casa *
                    100,
                    2
                ),

            edge:
                valueCasa.edge,

            valorEstimado:
                valueCasa.valor,

            oddJusta:
                valueCasa.oddJusta

        });

    }


    if (
        valueEmpate.valueBet
    ) {

        valueBets.push({

            mercado:
                "1X2",

            selecao:
                "Empate",

            odd:
                odds.empate,

            probabilidade:
                arredondar(
                    probabilidades.empate *
                    100,
                    2
                ),

            edge:
                valueEmpate.edge,

            valorEstimado:
                valueEmpate.valor,

            oddJusta:
                valueEmpate.oddJusta

        });

    }


    if (
        valueFora.valueBet
    ) {

        valueBets.push({

            mercado:
                "1X2",

            selecao:
                "Fora",

            odd:
                odds.fora,

            probabilidade:
                arredondar(
                    probabilidades.fora *
                    100,
                    2
                ),

            edge:
                valueFora.edge,

            valorEstimado:
                valueFora.valor,

            oddJusta:
                valueFora.oddJusta

        });

    }


    // ======================================================
    // QUALIDADE DOS DADOS
    // ======================================================

    let qualidadeDados =
        "Limitada";


    if (
        amostra >= 5 &&
        h2h.jogos >= 3
    ) {

        qualidadeDados =
            "Excelente";

    }
    else if (
        amostra >= 5
    ) {

        qualidadeDados =
            "Boa";

    }
    else if (
        amostra >= 3
    ) {

        qualidadeDados =
            "Moderada";

    }


    // ======================================================
    // AVISO DE HISTÓRICO
    // ======================================================

    let avisoHistorico =
        null;


    if (
        estatisticasCasa.jogos === 0 &&
        estatisticasFora.jogos === 0
    ) {

        avisoHistorico =
            "Nenhum histórico válido encontrado para os dois times.";

    }
    else if (
        estatisticasCasa.jogos === 0
    ) {

        avisoHistorico =
            `Nenhum histórico válido encontrado para ${equipes.casa}.`;

    }
    else if (
        estatisticasFora.jogos === 0
    ) {

        avisoHistorico =
            `Nenhum histórico válido encontrado para ${equipes.fora}.`;

    }


    // ======================================================
    // RESULTADO
    // ======================================================

    return {

        sucesso:
            true,

        algoritmo:
            "BetVision AI Motor Estatístico v9.0",

        jogo: {

            nome:
                nomeJogo,

            casa:
                equipes.casa,

            fora:
                equipes.fora,

            api_id:
                apiIdAtual,

            data_jogo:
                jogo?.data_jogo ??
                jogo?.dataJogo ??
                null

        },

        dataAnalise:
            new Date(),

        probabilidades: {

            casa:
                arredondar(
                    probabilidades.casa *
                    100,
                    2
                ),

            empate:
                arredondar(
                    probabilidades.empate *
                    100,
                    2
                ),

            fora:
                arredondar(
                    probabilidades.fora *
                    100,
                    2
                )

        },

        golsEsperados: {

            casa:
                gols.casa,

            fora:
                gols.fora,

            total:
                gols.total

        },

        placarPrevisto:
            placar.placar,

        probabilidadePlacar:
            placar.probabilidade,

        mercados: {

            over15:
                arredondar(
                    over15 *
                    100,
                    2
                ),

            over25:
                arredondar(
                    over25 *
                    100,
                    2
                ),

            over35:
                arredondar(
                    over35 *
                    100,
                    2
                ),

            under15:
                arredondar(
                    under15 *
                    100,
                    2
                ),

            under25:
                arredondar(
                    under25 *
                    100,
                    2
                ),

            under35:
                arredondar(
                    under35 *
                    100,
                    2
                ),

            ambasMarcam:
                arredondar(
                    ambasMarcam *
                    100,
                    2
                )

        },

        estatisticas: {

            casa:
                estatisticasCasa,

            fora:
                estatisticasFora,

            h2h,

            amostra

        },

        odds,

        valueBets,

        confianca,

        qualidadeDados,

        avisoHistorico

    };

}


// ==========================================================
// GERAR ANÁLISE IA
// ==========================================================

export async function gerarAnaliseIA(
    jogo,
    dados = {}
) {

    return await analisarMercado(
        jogo,
        dados
    );

}


// ==========================================================
// GERAR ANÁLISE INTELIGENTE
// ==========================================================

export async function gerarAnaliseInteligente(
    jogo,
    dados = {}
) {

    if (
        !jogo
    ) {

        throw new Error(
            "Jogo não informado"
        );

    }


    return await analisarMercado(
        jogo,
        dados
    );

}


// ==========================================================
// LISTAR ANÁLISES
//
// SOMENTE HOJE + AMANHÃ
// ==========================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `
                SELECT *

                FROM analises

                WHERE

                    data_jogo IS NOT NULL

                    AND

                    (
                        data_jogo
                        AT TIME ZONE
                        $1
                    )::date

                    BETWEEN

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        $1
                    )::date

                    AND

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        $1
                    )::date + 1

                ORDER BY
                    data_jogo ASC

                LIMIT 100
                `,

                [
                    TIMEZONE
                ]

            );


        return (
            resultado.rows ||
            []
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listar análises:",
            erro.message
        );

        return [];

    }

}


// ==========================================================
// EXPORT DEFAULT
// ==========================================================

export default {

    analisarMercado,

    gerarAnaliseIA,

    gerarAnaliseInteligente,

    listarAnalises

};
