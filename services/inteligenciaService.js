// ==================================================
// BETVISION AI
// services/inteligenciaService.js
//
// Motor de Inteligência Estatística v8.0
// PostgreSQL + NeonDB
//
// CORREÇÕES:
//
// - api_id é o identificador principal da análise
// - Não cria análise duplicada para o mesmo jogo
// - Reutiliza análise existente pelo api_id
// - Compatibilidade com análises antigas sem api_id
// - Busca por nome somente quando api_id não existir
// - Não cria jogos fictícios
// - Probabilidades sempre normalizadas em 100%
// - Compatível com bancoService.js v6.0
// - Compatível com jogoBancoService.js
// ==================================================

import {
    salvarAnalise,
    salvarValueBet,
    buscarAnalisePorApiId,
    buscarAnalisePorNome
} from "./bancoService.js";

import {
    query
} from "../database/database.js";


// ==================================================
// LIMITADOR
// ==================================================

function limitar(
    valor,
    minimo = 0,
    maximo = 100
) {

    const numero =
        Number(valor);

    if (
        !Number.isFinite(numero)
    ) {

        return minimo;

    }

    return Math.max(
        minimo,
        Math.min(
            maximo,
            numero
        )
    );

}


// ==================================================
// NORMALIZAR NÚMERO
// ==================================================

function numeroSeguro(
    valor,
    padrao = 0
) {

    const numero =
        Number(valor);

    return Number.isFinite(numero)
        ? numero
        : padrao;

}


// ==================================================
// NORMALIZAR API ID
// ==================================================

function normalizarApiId(
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
        Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {

        return null;

    }

    return numero;

}


// ==================================================
// PROBABILIDADES
// ==================================================

export function calcularProbabilidades(
    dados = {}
) {

    const {

        ataqueCasa = 50,

        defesaCasa = 50,

        ataqueFora = 50,

        defesaFora = 50,

        formaCasa = 50,

        formaFora = 50,

        mediaGolsCasa = 1,

        mediaGolsFora = 1

    } = dados;


    // ==========================================
    // FORÇA DA CASA
    // ==========================================

    const forcaCasa =

        (
            numeroSeguro(
                ataqueCasa,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                defesaFora,
                50
            ) * 0.20
        )

        +

        (
            numeroSeguro(
                formaCasa,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                mediaGolsCasa,
                1
            ) * 10
        );


    // ==========================================
    // FORÇA DO FORA
    // ==========================================

    const forcaFora =

        (
            numeroSeguro(
                ataqueFora,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                defesaCasa,
                50
            ) * 0.20
        )

        +

        (
            numeroSeguro(
                formaFora,
                50
            ) * 0.30
        )

        +

        (
            numeroSeguro(
                mediaGolsFora,
                1
            ) * 10
        );


    const totalForcas =
        forcaCasa +
        forcaFora;


    // ==========================================
    // FALLBACK
    // ==========================================

    if (
        totalForcas <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33

        };

    }


    // ==========================================
    // PROPORÇÕES
    // ==========================================

    const proporcaoCasa =
        forcaCasa /
        totalForcas;


    const proporcaoFora =
        forcaFora /
        totalForcas;


    // ==========================================
    // DISTRIBUIR 70% ENTRE CASA/FORA
    // ==========================================

    const casaBruta =
        proporcaoCasa * 70;


    const foraBruta =
        proporcaoFora * 70;


    // ==========================================
    // EMPATE
    // ==========================================

    const diferenca =
        Math.abs(
            casaBruta -
            foraBruta
        );


    let empateBruto =
        30 -
        (
            diferenca *
            0.5
        );


    empateBruto =
        limitar(
            empateBruto,
            10,
            30
        );


    // ==========================================
    // NORMALIZAÇÃO
    // ==========================================

    const totalBruto =

        casaBruta +
        empateBruto +
        foraBruta;


    if (
        totalBruto <= 0
    ) {

        return {

            casa: 33.33,

            empate: 33.34,

            fora: 33.33

        };

    }


    const casa =
        (
            casaBruta /
            totalBruto
        ) * 100;


    const empate =
        (
            empateBruto /
            totalBruto
        ) * 100;


    const fora =
        (
            foraBruta /
            totalBruto
        ) * 100;


    // ==========================================
    // ARREDONDAMENTO
    // ==========================================

    const casaFinal =
        Number(
            limitar(
                casa
            ).toFixed(2)
        );


    const empateFinal =
        Number(
            limitar(
                empate
            ).toFixed(2)
        );


    let foraFinal =
        Number(
            limitar(
                fora
            ).toFixed(2)
        );


    const soma =
        casaFinal +
        empateFinal +
        foraFinal;


    const ajuste =
        Number(
            (
                100 -
                soma
            ).toFixed(2)
        );


    foraFinal =
        Number(
            (
                foraFinal +
                ajuste
            ).toFixed(2)
        );


    return {

        casa:
            casaFinal,

        empate:
            empateFinal,

        fora:
            foraFinal

    };

}


// ==================================================
// PLACAR PREVISTO
// ==================================================

export function calcularPlacar(
    dados = {}
) {

    const golsCasa =
        numeroSeguro(
            dados.mediaGolsCasa,
            1
        );


    const golsFora =
        numeroSeguro(
            dados.mediaGolsFora,
            1
        );


    return {

        casa:
            Math.max(
                0,
                Math.round(
                    golsCasa
                )
            ),

        fora:
            Math.max(
                0,
                Math.round(
                    golsFora
                )
            )

    };

}


// ==================================================
// CONFIANÇA
// ==================================================

export function calcularConfianca(
    probabilidades = {}
) {

    const maior =
        Math.max(

            Number(
                probabilidades.casa ||
                0
            ),

            Number(
                probabilidades.empate ||
                0
            ),

            Number(
                probabilidades.fora ||
                0
            )

        );


    if (
        maior >= 65
    ) {

        return "ALTA";

    }


    if (
        maior >= 50
    ) {

        return "MEDIA";

    }


    return "BAIXA";

}


// ==================================================
// OBTER API ID DO JOGO
// ==================================================

function obterApiId(
    jogo
) {

    if (
        !jogo ||
        typeof jogo !== "object"
    ) {

        return null;

    }


    return normalizarApiId(

        jogo.api_id ??
        jogo.apiId ??
        jogo.fixture_id ??
        jogo.fixtureId

    );

}


// ==================================================
// NORMALIZAR NOME DO JOGO
// ==================================================

function obterNomeJogo(
    jogo
) {

    const nomeCasa =

        jogo?.time_casa ||

        jogo?.timeCasa ||

        jogo?.casa ||

        jogo?.homeTeam?.name ||

        jogo?.home_team?.name ||

        null;


    const nomeFora =

        jogo?.time_fora ||

        jogo?.timeFora ||

        jogo?.fora ||

        jogo?.awayTeam?.name ||

        jogo?.away_team?.name ||

        null;


    if (
        !nomeCasa ||
        !nomeFora
    ) {

        throw new Error(
            "Não foi possível identificar os times do jogo"
        );

    }


    const casa =
        String(
            nomeCasa
        ).trim();


    const fora =
        String(
            nomeFora
        ).trim();


    if (
        !casa ||
        !fora
    ) {

        throw new Error(
            "Nome dos times inválido"
        );

    }


    return {

        nomeCasa:
            casa,

        nomeFora:
            fora,

        nomeJogo:
            `${casa} x ${fora}`

    };

}


// ==================================================
// VALIDAR JOGO
// ==================================================

function validarJogo(
    jogo
) {

    if (
        !jogo
    ) {

        return {

            valido:
                false,

            erro:
                "Jogo não informado"

        };

    }


    const apiId =
        obterApiId(
            jogo
        );


    if (
        !apiId
    ) {

        return {

            valido:
                false,

            erro:
                "api_id inválido ou ausente"

        };

    }


    let nomes;

    try {

        nomes =
            obterNomeJogo(
                jogo
            );

    }

    catch (erro) {

        return {

            valido:
                false,

            erro:
                erro.message

        };

    }


    const casa =
        nomes.nomeCasa
            .toLowerCase()
            .trim();


    const fora =
        nomes.nomeFora
            .toLowerCase()
            .trim();


    // ==========================================
    // PROTEGER CONTRA TIMES FICTÍCIOS
    // ==========================================

    const nomesInvalidos = [

        "casa",

        "fora",

        "time a",

        "time b",

        "home",

        "away",

        "home team",

        "away team"

    ];


    if (
        nomesInvalidos.includes(casa) ||
        nomesInvalidos.includes(fora)
    ) {

        return {

            valido:
                false,

            erro:
                "Times fictícios ou de fallback"

        };

    }


    // ==========================================
    // CASA E FORA DIFERENTES
    // ==========================================

    if (
        casa === fora
    ) {

        return {

            valido:
                false,

            erro:
                "Time da casa e visitante são iguais"

        };

    }


    return {

        valido:
            true,

        erro:
            null

    };

}


// ==================================================
// BUSCAR ANÁLISE EXISTENTE
//
// PRIORIDADE:
//
// 1. api_id
// 2. nome somente para análise antiga
// ==================================================

async function buscarAnaliseExistente(
    jogo,
    nomeJogo,
    apiId
) {

    // ==========================================
    // PRIMEIRO: API ID
    // ==========================================

    if (
        apiId
    ) {

        try {

            const existente =
                await buscarAnalisePorApiId(
                    apiId
                );


            if (
                existente
            ) {

                return existente;

            }

        }

        catch (erro) {

            console.error(

                "❌ Erro buscando análise por api_id:",

                erro.message

            );

        }

    }


    // ==========================================
    // SEGUNDO: NOME
    //
    // Somente compatibilidade com registros
    // antigos que possuem api_id NULL.
    // ==========================================

    if (
        nomeJogo
    ) {

        try {

            const antiga =
                await buscarAnalisePorNome(
                    nomeJogo
                );


            if (
                antiga
            ) {

                return antiga;

            }

        }

        catch (erro) {

            console.error(

                "❌ Erro buscando análise antiga por nome:",

                erro.message

            );

        }

    }


    return null;

}


// ==================================================
// GERAR ANÁLISE IA
// ==================================================

export async function gerarAnaliseIA(
    jogo,
    dados = {}
) {

    if (
        !jogo
    ) {

        throw new Error(
            "Jogo é obrigatório para gerar análise"
        );

    }


    // ==========================================
    // IDENTIFICAR API ID
    // ==========================================

    const apiId =
        obterApiId(
            jogo
        );


    if (
        !apiId
    ) {

        throw new Error(
            "api_id é obrigatório para gerar análise"
        );

    }


    // ==========================================
    // IDENTIFICAR TIMES
    // ==========================================

    const {

        nomeCasa,

        nomeFora,

        nomeJogo

    } =
        obterNomeJogo(
            jogo
        );


    console.log(
        `🤖 Gerando análise: ${nomeJogo}`
    );


    console.log(
        `🤖 API ID do jogo: ${apiId}`
    );


    // ==========================================
    // VALIDAR
    // ==========================================

    const validacao =
        validarJogo(
            jogo
        );


    if (
        !validacao.valido
    ) {

        throw new Error(
            `Jogo inválido para análise: ${validacao.erro}`
        );

    }


    // ==========================================
    // VERIFICAR ANÁLISE EXISTENTE
    // ==========================================

    const existente =
        await buscarAnaliseExistente(

            jogo,

            nomeJogo,

            apiId

        );


    if (
        existente
    ) {

        console.log(

            `♻️ Análise já existente: ${nomeJogo}`

        );


        console.log(

            `♻️ API ID: ${apiId}`

        );


        console.log(

            `♻️ ID da análise: ${existente.id}`

        );


        // ======================================
        // IMPORTANTE:
        //
        // Se a análise antiga não possuir api_id,
        // tentamos vinculá-la ao jogo atual.
        // ======================================

        if (
            existente.api_id === null ||
            existente.api_id === undefined
        ) {

            try {

                const vinculada =
                    await query(

                        `
                        UPDATE analises

                        SET api_id = $1

                        WHERE id = $2

                          AND api_id IS NULL

                        RETURNING *
                        `,

                        [

                            apiId,

                            existente.id

                        ]

                    );


                if (
                    vinculada.rows[0]
                ) {

                    console.log(

                        `🔗 Análise antiga ${existente.id} vinculada à API ${apiId}`

                    );


                    return vinculada.rows[0];

                }

            }

            catch (erro) {

                console.error(

                    "⚠️ Não foi possível vincular análise antiga:",

                    erro.message

                );

            }

        }


        return existente;

    }


    // ==========================================
    // CALCULAR PROBABILIDADES
    // ==========================================

    const probabilidades =
        calcularProbabilidades(
            dados
        );


    // ==========================================
    // CALCULAR PLACAR
    // ==========================================

    const placar =
        calcularPlacar(
            dados
        );


    // ==========================================
    // GOLS ESPERADOS
    // ==========================================

    const mediaCasa =
        numeroSeguro(
            dados.mediaGolsCasa,
            1
        );


    const mediaFora =
        numeroSeguro(
            dados.mediaGolsFora,
            1
        );


    const golsEsperados =
        Number(

            (
                mediaCasa +
                mediaFora
            )
            .toFixed(2)

        );


    // ==========================================
    // CONFIANÇA
    // ==========================================

    const confianca =
        calcularConfianca(
            probabilidades
        );


    // ==========================================
    // OBJETO DA ANÁLISE
    // ==========================================

    const analise = {

        api_id:
            apiId,

        jogo:
            nomeJogo,

        probabilidade_casa:
            probabilidades.casa,

        probabilidade_empate:
            probabilidades.empate,

        probabilidade_fora:
            probabilidades.fora,

        gols_esperados:
            golsEsperados,

        placar_previsto:
            `${placar.casa}x${placar.fora}`,

        value_bet:
            false,

        confianca:
            confianca,

        algoritmo:
            "BetVision Statistical AI v8.0"

    };


    console.log(

        `🤖 Criando nova análise IA: ${nomeCasa} x ${nomeFora}`

    );


    console.log(

        `🤖 API ID associado: ${apiId}`

    );


    // ==========================================
    // SALVAR
    // ==========================================

    const salva =
        await salvarAnalise(
            analise
        );


    if (
        !salva
    ) {

        throw new Error(
            "Não foi possível salvar a análise"
        );

    }


    console.log(

        `✅ Análise salva: ${nomeJogo} | API ${apiId} | ID ${salva.id}`

    );


    return salva;

}


// ==================================================
// ANALISAR MERCADO
// ==================================================

export async function analisarMercado(
    jogo,
    dados = {}
) {

    const resultado =
        await gerarAnaliseIA(
            jogo,
            dados
        );


    return {

        sucesso:
            true,

        analise:
            resultado

    };

}


// ==================================================
// LISTAR ANÁLISES
// ==================================================

export async function listarAnalises() {

    try {

        const resultado =
            await query(

                `
                SELECT

                    id,

                    api_id,

                    jogo,

                    probabilidade_casa,

                    probabilidade_empate,

                    probabilidade_fora,

                    gols_esperados,

                    placar_previsto,

                    value_bet,

                    confianca,

                    algoritmo,

                    criado_em

                FROM analises

                ORDER BY
                    criado_em DESC,
                    id DESC
                `

            );


        return Array.isArray(
            resultado.rows
        )
            ? resultado.rows
            : [];

    }

    catch (erro) {

        console.error(

            "❌ Erro listar análises:",

            erro.message

        );


        return [];

    }

}


// ==================================================
// VALUE BET
// ==================================================

export function calcularValueBet(
    odd,
    probabilidade
) {

    const oddNumero =
        Number(
            odd
        );


    const probabilidadeNumero =
        Number(
            probabilidade
        );


    if (

        !Number.isFinite(
            oddNumero
        )

        ||

        !Number.isFinite(
            probabilidadeNumero
        )

        ||

        oddNumero <= 0

        ||

        probabilidadeNumero <= 0

        ||

        probabilidadeNumero > 100

    ) {

        return {

            valor:
                0,

            possui:
                false

        };

    }


    const valorEsperado =

        (
            oddNumero *
            (
                probabilidadeNumero /
                100
            )
        )

        - 1;


    return {

        valor:
            Number(
                valorEsperado
                    .toFixed(3)
            ),

        possui:
            valorEsperado > 0.05

    };

}


// ==================================================
// GERAR VALUE BET
// ==================================================

export async function gerarValueBet(
    jogo,
    mercado,
    odd,
    probabilidade
) {

    if (
        !jogo
    ) {

        return null;

    }


    const apiId =
        obterApiId(
            jogo
        );


    const resultado =
        calcularValueBet(
            odd,
            probabilidade
        );


    if (
        !resultado.possui
    ) {

        return null;

    }


    let jogoId =
        jogo?.id ||
        null;


    // ==========================================
    // Se não houver id interno, procura pelo
    // api_id.
    // ==========================================

    if (
        !jogoId &&
        apiId
    ) {

        try {

            const encontrado =
                await query(

                    `
                    SELECT id

                    FROM jogos

                    WHERE api_id = $1

                    LIMIT 1
                    `,

                    [
                        apiId
                    ]

                );


            jogoId =
                encontrado.rows[0]?.id ||
                null;

        }

        catch (erro) {

            console.error(

                "⚠️ Erro buscando jogo para Value Bet:",

                erro.message

            );

        }

    }


    const nomeCasa =
        jogo.time_casa ||
        jogo.timeCasa ||
        jogo.casa ||
        "Casa";


    const nomeFora =
        jogo.time_fora ||
        jogo.timeFora ||
        jogo.fora ||
        "Fora";


    return await salvarValueBet({

        jogo_id:
            jogoId,

        mercado:

            mercado ||
            "N/A",

        odd_mercado:
            Number(
                odd
            ),

        probabilidade_real:
            Number(
                probabilidade
            ),

        valor_esperado:
            resultado.valor,

        confianca:
            "ALTA"

    });

}


// ==================================================
// ESTATÍSTICAS DAS ANÁLISES
// ==================================================

export async function estatisticasAnalises() {

    try {

        const resultado =
            await query(

                `
                SELECT

                    COUNT(*)::integer
                        AS total,

                    COUNT(
                        CASE
                            WHEN api_id IS NOT NULL
                            THEN 1
                        END
                    )::integer
                        AS com_api_id,

                    COUNT(
                        CASE
                            WHEN api_id IS NULL
                            THEN 1
                        END
                    )::integer
                        AS sem_api_id

                FROM analises
                `

            );


        return (

            resultado.rows[0] ||

            {

                total:
                    0,

                com_api_id:
                    0,

                sem_api_id:
                    0

            }

        );

    }

    catch (erro) {

        console.error(

            "❌ Erro estatísticas análises:",

            erro.message

        );


        return {

            total:
                0,

            com_api_id:
                0,

            sem_api_id:
                0

        };

    }

}


// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    calcularProbabilidades,

    calcularPlacar,

    calcularConfianca,

    gerarAnaliseIA,

    analisarMercado,

    listarAnalises,

    calcularValueBet,

    gerarValueBet,

    estatisticasAnalises

};

