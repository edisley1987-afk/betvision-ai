// ==================================================
// BETVISION AI
// services/historicoService.js
//
// Histórico de Jogos + Estatísticas
// Versão 9.0
//
// Compatível com:
// - PostgreSQL
// - NeonDB
// - schema.sql atual
//
// Correções:
// - Usa time_casa_id e time_fora_id
// - Busca nomes através da tabela times
// - Usa data_jogo
// - Usa gols_casa / gols_fora
// - Não utiliza colunas inexistentes
// - Histórico casa e fora separado
// - Histórico de confrontos diretos
// - Estatísticas para treinamento da IA
// ==================================================

import { query } from "../database/database.js";

// ==================================================
// CONFIGURAÇÃO
// ==================================================

const LIMITE_HISTORICO = 10;

const LIMITE_CONFRONTOS = 10;

// ==================================================
// NORMALIZAR NOME
// ==================================================

function normalizarNome(nome) {

    if (!nome) {

        return "";

    }

    return String(nome)
        .trim()
        .toLowerCase();

}

// ==================================================
// BUSCAR TIME POR NOME
// ==================================================

async function buscarTimePorNome(nome) {

    if (!nome) {

        return null;

    }

    try {

        const resultado = await query(

            `
            SELECT
                id,
                api_id,
                nome,
                pais,
                campeonato_id

            FROM times

            WHERE LOWER(TRIM(nome))
                = LOWER(TRIM($1))

            LIMIT 1
            `,

            [
                nome
            ]

        );

        return resultado.rows[0] || null;

    }

    catch (error) {

        console.error(

            "❌ Erro buscar time por nome:",

            error.message

        );

        return null;

    }

}

// ==================================================
// BUSCAR HISTÓRICO DE UM TIME
//
// Retorna os últimos jogos do time,
// independentemente de ser mandante ou visitante.
// ==================================================

export async function buscarHistoricoTime(

    time

) {

    try {

        if (!time) {

            return [];

        }

        let timeId = null;

        let nomeTime = null;

        // ==================================================
        // SE FOI INFORMADO ID
        // ==================================================

        if (
            typeof time === "number" ||
            /^\d+$/.test(String(time))
        ) {

            timeId = Number(time);

        }

        // ==================================================
        // SE FOI INFORMADO NOME
        // ==================================================

        else {

            nomeTime = String(time).trim();

            const timeBanco =
                await buscarTimePorNome(
                    nomeTime
                );

            if (!timeBanco) {

                console.log(

                    `⚠️ Time não encontrado: ${nomeTime}`

                );

                return [];

            }

            timeId = timeBanco.id;

        }

        // ==================================================
        // BUSCAR JOGOS
        // ==================================================

        const resultado = await query(

            `
            SELECT

                j.id,

                j.api_id,

                j.data_jogo,

                j.status,

                j.gols_casa,

                j.gols_fora,

                j.temporada,

                j.time_casa_id,

                j.time_fora_id,

                tc.nome AS time_casa,

                tf.nome AS time_fora

            FROM jogos j

            LEFT JOIN times tc
                ON tc.id = j.time_casa_id

            LEFT JOIN times tf
                ON tf.id = j.time_fora_id

            WHERE

                j.time_casa_id = $1

                OR

                j.time_fora_id = $1

            ORDER BY

                j.data_jogo DESC

            LIMIT $2
            `,

            [
                timeId,
                LIMITE_HISTORICO
            ]

        );

        return resultado.rows;

    }

    catch (error) {

        console.error(

            "❌ Erro histórico time:",

            error.message

        );

        return [];

    }

}

// ==================================================
// BUSCAR HISTÓRICO CASA/FORA
//
// Usado pela IA para analisar:
// - forma recente
// - ataque
// - defesa
// - desempenho casa/fora
// ==================================================

export async function buscarHistoricoJogo(

    timeCasa,

    timeFora

) {

    try {

        console.log(

            `📊 Buscando histórico: ${timeCasa} x ${timeFora}`

        );

        // ==================================================
        // HISTÓRICO GERAL DOS TIMES
        // ==================================================

        const historicoCasa =

            await buscarHistoricoTime(
                timeCasa
            );

        const historicoFora =

            await buscarHistoricoTime(
                timeFora
            );

        // ==================================================
        // CONFRONTOS DIRETOS
        // ==================================================

        const confrontosDiretos =

            await buscarConfrontosDiretos(

                timeCasa,

                timeFora

            );

        return {

            historicoCasa,

            historicoFora,

            confrontosDiretos

        };

    }

    catch (error) {

        console.error(

            "❌ Erro buscar histórico jogo:",

            error.message

        );

        return {

            historicoCasa: [],

            historicoFora: [],

            confrontosDiretos: []

        };

    }

}

// ==================================================
// BUSCAR CONFRONTOS DIRETOS
//
// Essa informação será muito importante para a IA.
//
// Exemplo:
//
// Corinthians x Bragantino
//
// A IA poderá descobrir que nos últimos confrontos
// o Corinthians teve desempenho superior mesmo
// quando o mercado apontava o Bragantino como favorito.
// ==================================================

export async function buscarConfrontosDiretos(

    timeCasa,

    timeFora

) {

    try {

        const casa =
            await buscarTimePorNome(
                timeCasa
            );

        const fora =
            await buscarTimePorNome(
                timeFora
            );

        if (!casa || !fora) {

            return [];

        }

        const resultado = await query(

            `
            SELECT

                j.id,

                j.api_id,

                j.data_jogo,

                j.status,

                j.gols_casa,

                j.gols_fora,

                j.temporada,

                tc.nome AS time_casa,

                tf.nome AS time_fora,

                j.time_casa_id,

                j.time_fora_id

            FROM jogos j

            LEFT JOIN times tc
                ON tc.id = j.time_casa_id

            LEFT JOIN times tf
                ON tf.id = j.time_fora_id

            WHERE

                (

                    j.time_casa_id = $1

                    AND

                    j.time_fora_id = $2

                )

                OR

                (

                    j.time_casa_id = $2

                    AND

                    j.time_fora_id = $1

                )

            ORDER BY

                j.data_jogo DESC

            LIMIT $3
            `,

            [

                casa.id,

                fora.id,

                LIMITE_CONFRONTOS

            ]

        );

        console.log(

            `🤝 ${resultado.rows.length} confrontos diretos encontrados`

        );

        return resultado.rows;

    }

    catch (error) {

        console.error(

            "❌ Erro confrontos diretos:",

            error.message

        );

        return [];

    }

}

// ==================================================
// SALVAR HISTÓRICO DE JOGO
//
// IMPORTANTE:
//
// O banco atual possui:
//
// jogos
// - id
// - api_id
// - campeonato_id
// - time_casa_id
// - time_fora_id
// - data_jogo
// - status
// - gols_casa
// - gols_fora
// - temporada
//
// Portanto não podemos inserir:
// time_casa
// time_fora
//
// diretamente em jogos.
// ==================================================

export async function salvarHistoricoJogo(

    dados

) {

    try {

        if (!dados) {

            return false;

        }

        // ==================================================
        // IDENTIFICAR TIMES
        // ==================================================

        let timeCasaId =
            dados.time_casa_id ||
            null;

        let timeForaId =
            dados.time_fora_id ||
            null;

        // ==================================================
        // SE NÃO TEM ID, PROCURAR PELO NOME
        // ==================================================

        if (!timeCasaId) {

            const timeCasa =
                await buscarTimePorNome(

                    dados.time_casa ||
                    dados.casa

                );

            timeCasaId =
                timeCasa?.id ||
                null;

        }

        if (!timeForaId) {

            const timeFora =
                await buscarTimePorNome(

                    dados.time_fora ||
                    dados.fora

                );

            timeForaId =
                timeFora?.id ||
                null;

        }

        // ==================================================
        // VALIDAR TIMES
        // ==================================================

        if (
            !timeCasaId ||
            !timeForaId
        ) {

            console.error(

                "❌ Não foi possível identificar os times do jogo"

            );

            return false;

        }

        // ==================================================
        // API ID
        // ==================================================

        const apiId =

            dados.api_id ??
            dados.fixture_id ??
            null;

        // ==================================================
        // VERIFICAR SE JÁ EXISTE
        // ==================================================

        if (apiId !== null) {

            const existente =

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

            if (
                existente.rows.length > 0
            ) {

                // ==================================================
                // ATUALIZAR RESULTADO
                // ==================================================

                const atualizado =

                    await query(

                        `
                        UPDATE jogos

                        SET

                            campeonato_id =
                                COALESCE(
                                    $1,
                                    campeonato_id
                                ),

                            time_casa_id =
                                $2,

                            time_fora_id =
                                $3,

                            data_jogo =
                                COALESCE(
                                    $4,
                                    data_jogo
                                ),

                            status =
                                COALESCE(
                                    $5,
                                    status
                                ),

                            gols_casa =
                                COALESCE(
                                    $6,
                                    gols_casa
                                ),

                            gols_fora =
                                COALESCE(
                                    $7,
                                    gols_fora
                                ),

                            temporada =
                                COALESCE(
                                    $8,
                                    temporada
                                )

                        WHERE api_id = $9

                        RETURNING *
                        `,

                        [

                            dados.campeonato_id ??
                                null,

                            timeCasaId,

                            timeForaId,

                            dados.data_jogo ??
                                null,

                            dados.status ??
                                null,

                            dados.gols_casa ??
                                0,

                            dados.gols_fora ??
                                0,

                            dados.temporada ??
                                null,

                            apiId

                        ]

                    );

                console.log(

                    `🔄 Histórico atualizado: jogo API ${apiId}`

                );

                return Boolean(
                    atualizado.rows[0]
                );

            }

        }

        // ==================================================
        // INSERIR NOVO JOGO
        // ==================================================

        const resultado =

            await query(

                `
                INSERT INTO jogos

                (
                    api_id,
                    campeonato_id,
                    time_casa_id,
                    time_fora_id,
                    data_jogo,
                    status,
                    gols_casa,
                    gols_fora,
                    temporada
                )

                VALUES

                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )

                RETURNING *
                `,

                [

                    apiId,

                    dados.campeonato_id ??
                        null,

                    timeCasaId,

                    timeForaId,

                    dados.data_jogo ??
                        null,

                    dados.status ??
                        null,

                    dados.gols_casa ??
                        0,

                    dados.gols_fora ??
                        0,

                    dados.temporada ??
                        null

                ]

            );

        console.log(

            `➕ Histórico salvo: jogo ${resultado.rows[0]?.id}`

        );

        return Boolean(
            resultado.rows[0]
        );

    }

    catch (error) {

        console.error(

            "❌ Erro salvar histórico:",

            error.message

        );

        return false;

    }

}

// ==================================================
// ÚLTIMOS RESULTADOS
//
// Retorna formato simplificado para a IA.
// ==================================================

export async function ultimosResultados(

    time

) {

    try {

        const jogos =

            await buscarHistoricoTime(
                time
            );

        return jogos.map(

            jogo => ({

                id:
                    jogo.id,

                api_id:
                    jogo.api_id,

                data:
                    jogo.data_jogo,

                casa:
                    jogo.time_casa,

                fora:
                    jogo.time_fora,

                golsCasa:
                    Number(
                        jogo.gols_casa || 0
                    ),

                golsFora:
                    Number(
                        jogo.gols_fora || 0
                    ),

                status:
                    jogo.status

            })

        );

    }

    catch (error) {

        console.error(

            "❌ Erro resultados:",

            error.message

        );

        return [];

    }

}

// ==================================================
// CALCULAR ESTATÍSTICAS DO TIME
//
// Essas estatísticas serão usadas posteriormente
// pelo motor de IA.
//
// Retorna:
//
// - jogos
// - vitórias
// - empates
// - derrotas
// - gols marcados
// - gols sofridos
// - média gols
// - aproveitamento
// ==================================================

export async function calcularEstatisticasTime(

    time

) {

    try {

        const jogos =

            await buscarHistoricoTime(
                time
            );

        if (!jogos.length) {

            return {

                jogos: 0,

                vitorias: 0,

                empates: 0,

                derrotas: 0,

                golsMarcados: 0,

                golsSofridos: 0,

                mediaGolsMarcados: 0,

                mediaGolsSofridos: 0,

                aproveitamento: 0

            };

        }

        let vitorias = 0;

        let empates = 0;

        let derrotas = 0;

        let golsMarcados = 0;

        let golsSofridos = 0;

        const nomeNormalizado =

            normalizarNome(
                typeof time === "string"
                    ? time
                    : ""
            );

        for (
            const jogo of jogos
        ) {

            const nomeCasa =

                normalizarNome(
                    jogo.time_casa
                );

            const ehCasa =

                nomeNormalizado ===
                nomeCasa;

            const golsTime =

                ehCasa

                    ? Number(
                        jogo.gols_casa || 0
                    )

                    : Number(
                        jogo.gols_fora || 0
                    );

            const golsAdversario =

                ehCasa

                    ? Number(
                        jogo.gols_fora || 0
                    )

                    : Number(
                        jogo.gols_casa || 0
                    );

            golsMarcados +=
                golsTime;

            golsSofridos +=
                golsAdversario;

            if (
                golsTime >
                golsAdversario
            ) {

                vitorias++;

            }

            else if (
                golsTime ===
                golsAdversario
            ) {

                empates++;

            }

            else {

                derrotas++;

            }

        }

        const total =
            jogos.length;

        const aproveitamento =

            (
                (
                    vitorias * 3
                )
                +
                empates
            )
            /
            (
                total * 3
            )
            *
            100;

        return {

            jogos:
                total,

            vitorias,

            empates,

            derrotas,

            golsMarcados,

            golsSofridos,

            mediaGolsMarcados:
                Number(
                    (
                        golsMarcados /
                        total
                    ).toFixed(2)
                ),

            mediaGolsSofridos:
                Number(
                    (
                        golsSofridos /
                        total
                    ).toFixed(2)
                ),

            aproveitamento:
                Number(
                    aproveitamento.toFixed(2)
                )

        };

    }

    catch (error) {

        console.error(

            "❌ Erro calcular estatísticas:",

            error.message

        );

        return {

            jogos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            mediaGolsMarcados: 0,

            mediaGolsSofridos: 0,

            aproveitamento: 0

        };

    }

}

// ==================================================
// ESTATÍSTICAS DO CONFRONTO
//
// Mede o desempenho de cada equipe nos confrontos
// diretos.
//
// Isso é exatamente o tipo de informação que
// queremos entregar posteriormente ao botão
// "ANÁLISE".
// ==================================================

export async function estatisticasConfronto(

    timeCasa,

    timeFora

) {

    try {

        const confrontos =

            await buscarConfrontosDiretos(

                timeCasa,

                timeFora

            );

        if (!confrontos.length) {

            return {

                jogos: 0,

                vitoriasCasa: 0,

                empates: 0,

                vitoriasFora: 0,

                golsCasa: 0,

                golsFora: 0,

                mediaGolsCasa: 0,

                mediaGolsFora: 0

            };

        }

        let vitoriasCasa = 0;

        let empates = 0;

        let vitoriasFora = 0;

        let golsCasa = 0;

        let golsFora = 0;

        for (
            const jogo of confrontos
        ) {

            const nomeCasaBanco =

                normalizarNome(
                    jogo.time_casa
                );

            const casaEsperada =

                normalizarNome(
                    timeCasa
                );

            const ehCasa =

                nomeCasaBanco ===
                casaEsperada;

            let golsTimeCasa;

            let golsTimeFora;

            if (ehCasa) {

                golsTimeCasa =
                    Number(
                        jogo.gols_casa || 0
                    );

                golsTimeFora =
                    Number(
                        jogo.gols_fora || 0
                    );

            }

            else {

                golsTimeCasa =
                    Number(
                        jogo.gols_fora || 0
                    );

                golsTimeFora =
                    Number(
                        jogo.gols_casa || 0
                    );

            }

            golsCasa +=
                golsTimeCasa;

            golsFora +=
                golsTimeFora;

            if (
                golsTimeCasa >
                golsTimeFora
            ) {

                vitoriasCasa++;

            }

            else if (
                golsTimeCasa ===
                golsTimeFora
            ) {

                empates++;

            }

            else {

                vitoriasFora++;

            }

        }

        return {

            jogos:
                confrontos.length,

            vitoriasCasa,

            empates,

            vitoriasFora,

            golsCasa,

            golsFora,

            mediaGolsCasa:
                Number(
                    (
                        golsCasa /
                        confrontos.length
                    ).toFixed(2)
                ),

            mediaGolsFora:
                Number(
                    (
                        golsFora /
                        confrontos.length
                    ).toFixed(2)
                )

        };

    }

    catch (error) {

        console.error(

            "❌ Erro estatísticas confronto:",

            error.message

        );

        return {

            jogos: 0,

            vitoriasCasa: 0,

            empates: 0,

            vitoriasFora: 0,

            golsCasa: 0,

            golsFora: 0,

            mediaGolsCasa: 0,

            mediaGolsFora: 0

        };

    }

}

// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    buscarHistoricoJogo,

    buscarHistoricoTime,

    buscarConfrontosDiretos,

    salvarHistoricoJogo,

    ultimosResultados,

    calcularEstatisticasTime,

    estatisticasConfronto

};

console.log(
    "✅ historicoService v9.0 carregado"
);

