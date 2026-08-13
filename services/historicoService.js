// ==================================================
// BETVISION AI
// services/historicoService.js
//
// MOTOR ESTATÍSTICO v6
// Histórico + Forma + H2H
//
// PostgreSQL / NeonDB
//
// IMPORTANTE:
//
// Estrutura REAL conhecida da tabela jogos:
//
// id
// api_id
// campeonato
// time_casa
// time_fora
// data_jogo
// estadio
// status
// criado_em
//
// Este serviço NÃO inventa:
// - gols
// - resultados
// - estatísticas inexistentes
// - jogos fictícios
//
// ==================================================

import {
    query
} from "../database/database.js";



// ==================================================
// CONFIGURAÇÃO
// ==================================================

const CONFIG = {

    LIMITE_HISTORICO:
        20,

    LIMITE_FORMA:
        10,

    LIMITE_H2H:
        10,

    TIMEZONE:
        "America/Sao_Paulo"

};



// ==================================================
// NORMALIZAR TEXTO
// ==================================================

function normalizarTexto(
    valor
) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return "";

    }

    return String(
        valor
    )
        .trim();

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

    return Number.isFinite(
        numero
    )
        ? numero
        : padrao;

}



// ==================================================
// NORMALIZAR JOGO
// ==================================================

function normalizarJogo(
    jogo
) {

    if (!jogo) {

        return null;

    }

    return {

        id:
            jogo.id ?? null,

        api_id:
            jogo.api_id ?? null,

        campeonato:
            normalizarTexto(
                jogo.campeonato
            ),

        time_casa:
            normalizarTexto(
                jogo.time_casa
            ),

        time_fora:
            normalizarTexto(
                jogo.time_fora
            ),

        data_jogo:
            jogo.data_jogo ?? null,

        estadio:
            normalizarTexto(
                jogo.estadio
            ),

        status:
            normalizarTexto(
                jogo.status
            ),

        criado_em:
            jogo.criado_em ?? null

    };

}



// ==================================================
// BUSCAR HISTÓRICO DE UM TIME
//
// Retorna os últimos jogos cadastrados
// do time.
//
// Não utiliza IDs de times.
//
// ==================================================

export async function buscarHistoricoTime(
    time
) {

    const nomeTime =
        normalizarTexto(
            time
        );

    if (!nomeTime) {

        return [];

    }



    try {

        console.log(
            `📚 Histórico v6: ${nomeTime}`
        );



        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    (
                        LOWER(
                            TRIM(
                                j.time_casa
                            )
                        )
                        =
                        LOWER(
                            TRIM($1)
                        )

                        OR

                        LOWER(
                            TRIM(
                                j.time_fora
                            )
                        )
                        =
                        LOWER(
                            TRIM($1)
                        )
                    )

                    AND

                    j.data_jogo IS NOT NULL

                ORDER BY

                    j.data_jogo DESC

                LIMIT $2
                `,
                [
                    nomeTime,
                    CONFIG.LIMITE_HISTORICO
                ]
            );



        return resultado.rows.map(
            normalizarJogo
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro histórico do time:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// BUSCAR HISTÓRICO CASA
//
// Somente partidas onde o time
// atuou como mandante.
//
// ==================================================

export async function buscarHistoricoCasa(
    time
) {

    const nomeTime =
        normalizarTexto(
            time
        );

    if (!nomeTime) {

        return [];

    }



    try {

        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    LOWER(
                        TRIM(
                            j.time_casa
                        )
                    )
                    =
                    LOWER(
                        TRIM($1)
                    )

                    AND

                    j.data_jogo IS NOT NULL

                ORDER BY

                    j.data_jogo DESC

                LIMIT $2
                `,
                [
                    nomeTime,
                    CONFIG.LIMITE_FORMA
                ]
            );



        return resultado.rows.map(
            normalizarJogo
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro histórico casa:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// BUSCAR HISTÓRICO FORA
//
// Somente partidas onde o time
// atuou como visitante.
//
// ==================================================

export async function buscarHistoricoFora(
    time
) {

    const nomeTime =
        normalizarTexto(
            time
        );

    if (!nomeTime) {

        return [];

    }



    try {

        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    LOWER(
                        TRIM(
                            j.time_fora
                        )
                    )
                    =
                    LOWER(
                        TRIM($1)
                    )

                    AND

                    j.data_jogo IS NOT NULL

                ORDER BY

                    j.data_jogo DESC

                LIMIT $2
                `,
                [
                    nomeTime,
                    CONFIG.LIMITE_FORMA
                ]
            );



        return resultado.rows.map(
            normalizarJogo
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro histórico fora:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// BUSCAR H2H
//
// Confrontos entre dois times.
//
// IMPORTANTE:
//
// H2H não recebe peso exagerado.
//
// ==================================================

export async function buscarH2H(
    timeCasa,
    timeFora
) {

    const casa =
        normalizarTexto(
            timeCasa
        );

    const fora =
        normalizarTexto(
            timeFora
        );



    if (
        !casa ||
        !fora
    ) {

        return [];

    }



    try {

        console.log(
            `⚔️ H2H v6: ${casa} x ${fora}`
        );



        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    (

                        (
                            LOWER(
                                TRIM(
                                    j.time_casa
                                )
                            )
                            =
                            LOWER(
                                TRIM($1)
                            )

                            AND

                            LOWER(
                                TRIM(
                                    j.time_fora
                                )
                            )
                            =
                            LOWER(
                                TRIM($2)
                            )
                        )

                        OR

                        (
                            LOWER(
                                TRIM(
                                    j.time_casa
                                )
                            )
                            =
                            LOWER(
                                TRIM($2)
                            )

                            AND

                            LOWER(
                                TRIM(
                                    j.time_fora
                                )
                            )
                            =
                            LOWER(
                                TRIM($1)
                            )
                        )

                    )

                    AND

                    j.data_jogo IS NOT NULL

                ORDER BY

                    j.data_jogo DESC

                LIMIT $3
                `,
                [
                    casa,
                    fora,
                    CONFIG.LIMITE_H2H
                ]
            );



        return resultado.rows.map(
            normalizarJogo
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



// ==================================================
// BUSCAR DADOS COMPLETOS DO CONFRONTO
//
// Função principal utilizada pelo
// inteligenciaService.js v6.
//
// ==================================================

export async function buscarHistoricoJogo(
    timeCasa,
    timeFora
) {

    const casa =
        normalizarTexto(
            timeCasa
        );

    const fora =
        normalizarTexto(
            timeFora
        );



    if (
        !casa ||
        !fora
    ) {

        return {

            casa: [],

            fora: [],

            historicoCasa: [],

            historicoFora: [],

            h2h: [],

            totalCasa: 0,

            totalFora: 0,

            totalH2H: 0

        };

    }



    const [

        historicoCasa,

        historicoFora,

        h2h

    ] = await Promise.all([

        buscarHistoricoTime(
            casa
        ),

        buscarHistoricoTime(
            fora
        ),

        buscarH2H(
            casa,
            fora
        )

    ]);



    return {

        casa:
            historicoCasa,

        fora:
            historicoFora,

        historicoCasa,

        historicoFora,

        h2h,

        totalCasa:
            historicoCasa.length,

        totalFora:
            historicoFora.length,

        totalH2H:
            h2h.length

    };

}



// ==================================================
// ESTATÍSTICAS BÁSICAS DO HISTÓRICO
//
// Como a tabela atual não possui
// gols_casa/gols_fora, esta função
// NÃO calcula gols fictícios.
//
// Ela calcula somente indicadores
// que realmente existem.
//
// ==================================================

export function calcularIndicadoresHistoricos(
    historico
) {

    if (
        !Array.isArray(
            historico
        ) ||
        historico.length === 0
    ) {

        return {

            jogos:
                0,

            mandante:
                0,

            visitante:
                0,

            percentualMandante:
                0,

            percentualVisitante:
                0

        };

    }



    let mandante = 0;

    let visitante = 0;



    for (
        const jogo
        of historico
    ) {

        const casa =
            normalizarTexto(
                jogo.time_casa
            );

        const fora =
            normalizarTexto(
                jogo.time_fora
            );

        const time =
            normalizarTexto(
                jogo._time_consulta
            );



        if (
            time &&
            casa.toLowerCase() ===
            time.toLowerCase()
        ) {

            mandante++;

        }

        else if (
            time &&
            fora.toLowerCase() ===
            time.toLowerCase()
        ) {

            visitante++;

        }

    }



    const total =
        historico.length;



    return {

        jogos:
            total,

        mandante,

        visitante,

        percentualMandante:
            Number(
                (
                    mandante /
                    total *
                    100
                ).toFixed(2)
            ),

        percentualVisitante:
            Number(
                (
                    visitante /
                    total *
                    100
                ).toFixed(2)
            )

    };

}



// ==================================================
// RESUMO ESTATÍSTICO
//
// Função utilizada pelo motor v6.
//
// ==================================================

export async function obterResumoHistorico(
    timeCasa,
    timeFora
) {

    const dados =
        await buscarHistoricoJogo(
            timeCasa,
            timeFora
        );



    return {

        timeCasa:
            normalizarTexto(
                timeCasa
            ),

        timeFora:
            normalizarTexto(
                timeFora
            ),

        jogosHistoricoCasa:
            numeroSeguro(
                dados.totalCasa
            ),

        jogosHistoricoFora:
            numeroSeguro(
                dados.totalFora
            ),

        confrontosDiretos:
            numeroSeguro(
                dados.totalH2H
            ),

        historicoCasa:
            dados.historicoCasa,

        historicoFora:
            dados.historicoFora,

        h2h:
            dados.h2h

    };

}



// ==================================================
// VALIDAR SE O JOGO É HOJE OU AMANHÃ
//
// Regra central do Motor v6:
//
// SOMENTE:
// - hoje
// - amanhã
//
// ==================================================

export async function jogoPermitidoAnalise(
    jogoId
) {

    if (
        !jogoId
    ) {

        return false;

    }



    try {

        const resultado =
            await query(
                `
                SELECT

                    id,

                    api_id,

                    time_casa,

                    time_fora,

                    data_jogo,

                    campeonato,

                    estadio,

                    status

                FROM jogos

                WHERE id = $1

                LIMIT 1
                `,
                [
                    jogoId
                ]
            );



        if (
            resultado.rows.length === 0
        ) {

            return false;

        }



        const jogo =
            resultado.rows[0];



        const permitido =
            await verificarDataPermitida(
                jogo.data_jogo
            );



        return permitido;

    }

    catch (erro) {

        console.error(
            "❌ Erro validação data:",
            erro.message
        );

        return false;

    }

}



// ==================================================
// VERIFICAR DATA
//
// Retorna true somente se a partida
// for hoje ou amanhã em
// America/Sao_Paulo.
//
// ==================================================

export async function verificarDataPermitida(
    dataJogo
) {

    if (
        !dataJogo
    ) {

        return false;

    }



    try {

        const resultado =
            await query(
                `
                SELECT

                    (
                        $1::timestamp
                        AT TIME ZONE 'America/Sao_Paulo'
                    )::date
                    =
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'America/Sao_Paulo'
                    )::date

                    OR

                    (
                        $1::timestamp
                        AT TIME ZONE 'America/Sao_Paulo'
                    )::date
                    =
                    (
                        (
                            CURRENT_TIMESTAMP
                            AT TIME ZONE 'America/Sao_Paulo'
                        )::date
                        + INTERVAL '1 day'
                    )::date

                    AS permitido
                `,
                [
                    dataJogo
                ]
            );



        return Boolean(
            resultado.rows[0]
                ?.permitido
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro verificando data:",
            erro.message
        );

        return false;

    }

}



// ==================================================
// LISTAR SOMENTE JOGOS DE HOJE E AMANHÃ
//
// Esta função será usada pelo frontend/API
// para impedir que jogos antigos apareçam.
//
// ==================================================

export async function listarJogosPermitidos() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        (
                            j.data_jogo
                            AT TIME ZONE
                            'America/Sao_Paulo'
                        )::date
                        =
                        (
                            CURRENT_TIMESTAMP
                            AT TIME ZONE
                            'America/Sao_Paulo'
                        )::date

                        OR

                        (
                            j.data_jogo
                            AT TIME ZONE
                            'America/Sao_Paulo'
                        )::date
                        =
                        (
                            (
                                CURRENT_TIMESTAMP
                                AT TIME ZONE
                                'America/Sao_Paulo'
                            )::date
                            + INTERVAL '1 day'
                        )::date
                    )

                ORDER BY

                    j.data_jogo ASC

                `
            );



        return resultado.rows.map(
            normalizarJogo
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listando jogos permitidos:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// LISTAR SOMENTE JOGOS DE HOJE
// ==================================================

export async function listarJogosHoje() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                    =

                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                ORDER BY

                    j.data_jogo ASC
                `
            );



        return resultado.rows.map(
            normalizarJogo
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listando jogos de hoje:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// LISTAR SOMENTE JOGOS DE AMANHÃ
// ==================================================

export async function listarJogosAmanha() {

    try {

        const resultado =
            await query(
                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato,

                    j.time_casa,

                    j.time_fora,

                    j.data_jogo,

                    j.estadio,

                    j.status,

                    j.criado_em

                FROM jogos j

                WHERE

                    j.data_jogo IS NOT NULL

                    AND

                    (
                        j.data_jogo
                        AT TIME ZONE
                        'America/Sao_Paulo'
                    )::date

                    =

                    (
                        (
                            CURRENT_TIMESTAMP
                            AT TIME ZONE
                            'America/Sao_Paulo'
                        )::date
                        + INTERVAL '1 day'
                    )::date

                ORDER BY

                    j.data_jogo ASC
                `
            );



        return resultado.rows.map(
            normalizarJogo
        );

    }

    catch (erro) {

        console.error(
            "❌ Erro listando jogos de amanhã:",
            erro.message
        );

        return [];

    }

}



// ==================================================
// EXPORTAÇÃO
// ==================================================

export default {

    buscarHistoricoTime,

    buscarHistoricoCasa,

    buscarHistoricoFora,

    buscarH2H,

    buscarHistoricoJogo,

    calcularIndicadoresHistoricos,

    obterResumoHistorico,

    jogoPermitidoAnalise,

    verificarDataPermitida,

    listarJogosPermitidos,

    listarJogosHoje,

    listarJogosAmanha

};
