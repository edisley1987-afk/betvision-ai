// ==================================================
// BETVISION AI
// services/jogoBancoService.js
//
// Controle de Jogos PostgreSQL / NeonDB
// Versão 6.0
//
// OBJETIVOS:
// - Evitar jogos duplicados
// - Usar api_id como identificador externo
// - Validar dados recebidos da API
// - Atualizar jogo existente em vez de duplicar
// - Manter compatibilidade com PostgreSQL / NeonDB
// - Compatível com historicoService.js
// - Compatível com inteligenciaService.js
//
// ESTRUTURA REAL DA TABELA jogos:
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
// NÃO UTILIZA:
// - time_casa_id
// - time_fora_id
// - campeonato_id
// - gols_casa
// - gols_fora
// ==================================================

import { query } from "../database/database.js";

// ==================================================
// CONSTANTES
// ==================================================

const STATUS_PADRAO = "SCHEDULED";

const LIMITE_JOGOS_PADRAO = 20;

const LIMITE_JOGOS_MAXIMO = 100;

// ==================================================
// NORMALIZAR TEXTO
// ==================================================

function normalizarTexto(valor) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return null;

    }

    const texto =
        String(valor)
            .trim();

    return texto
        ? texto
        : null;

}

// ==================================================
// NORMALIZAR API ID
// ==================================================

function normalizarApiId(valor) {

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
// NORMALIZAR DATA
//
// Não converte datas inválidas.
// O PostgreSQL recebe:
// - Date
// - string válida
// - null
// ==================================================

function normalizarData(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return null;

    }

    if (
        valor instanceof Date
    ) {

        if (
            Number.isNaN(
                valor.getTime()
            )
        ) {

            return null;

        }

        return valor;

    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }

    return data;

}

// ==================================================
// NORMALIZAR STATUS
// ==================================================

function normalizarStatus(valor) {

    const status =
        normalizarTexto(
            valor
        );

    if (!status) {

        return STATUS_PADRAO;

    }

    return status
        .toUpperCase();

}

// ==================================================
// NORMALIZAR JOGO
// ==================================================

function normalizarJogo(jogo) {

    if (
        !jogo ||
        typeof jogo !== "object"
    ) {

        return null;

    }

    const apiId =
        normalizarApiId(
            jogo.api_id ??
            jogo.apiId ??
            jogo.id
        );

    const campeonato =
        normalizarTexto(
            jogo.campeonato ??
            jogo.competicao ??
            jogo.competition
        );

    const timeCasa =
        normalizarTexto(
            jogo.time_casa ??
            jogo.timeCasa ??
            jogo.casa ??
            jogo.homeTeam
        );

    const timeFora =
        normalizarTexto(
            jogo.time_fora ??
            jogo.timeFora ??
            jogo.fora ??
            jogo.awayTeam
        );

    const dataJogo =
        normalizarData(
            jogo.data_jogo ??
            jogo.dataJogo ??
            jogo.horario ??
            jogo.data
        );

    const estadio =
        normalizarTexto(
            jogo.estadio ??
            jogo.stadium
        );

    const status =
        normalizarStatus(
            jogo.status
        );

    return {

        api_id:
            apiId,

        campeonato:
            campeonato ||
            "Futebol",

        time_casa:
            timeCasa,

        time_fora:
            timeFora,

        data_jogo:
            dataJogo,

        estadio:
            estadio,

        status:
            status

    };

}

// ==================================================
// VALIDAR JOGO
// ==================================================

function validarJogo(jogo) {

    if (!jogo) {

        return {

            valido: false,

            erro:
                "Jogo não informado"

        };

    }

    if (
        !jogo.api_id
    ) {

        return {

            valido: false,

            erro:
                "api_id inválido ou ausente"

        };

    }

    if (
        !jogo.time_casa
    ) {

        return {

            valido: false,

            erro:
                "time_casa ausente"

        };

    }

    if (
        !jogo.time_fora
    ) {

        return {

            valido: false,

            erro:
                "time_fora ausente"

        };

    }

    // ------------------------------------------
    // Não aceitar times fictícios
    // ------------------------------------------

    const casa =
        jogo.time_casa
            .toLowerCase();

    const fora =
        jogo.time_fora
            .toLowerCase();

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

            valido: false,

            erro:
                "Times fictícios ou de fallback"

        };

    }

    // ------------------------------------------
    // Casa e fora não podem ser iguais
    // ------------------------------------------

    if (
        casa === fora
    ) {

        return {

            valido: false,

            erro:
                "Time da casa e visitante são iguais"

        };

    }

    return {

        valido: true,

        erro: null

    };

}

// ==================================================
// BUSCAR JOGO PELO API ID
// ==================================================

export async function buscarPorApiId(
    api_id
) {

    const apiId =
        normalizarApiId(
            api_id
        );

    if (!apiId) {

        return null;

    }

    const resultado =
        await query(

            `
            SELECT

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em

            FROM jogos

            WHERE api_id = $1

            LIMIT 1
            `,

            [
                apiId
            ]

        );

    return (
        resultado.rows[0]
        ||
        null
    );

}

// ==================================================
// SALVAR JOGO INDIVIDUAL
//
// FLUXO:
//
// 1. Normaliza
// 2. Valida
// 3. Procura api_id
// 4. Se existe -> UPDATE
// 5. Se não existe -> INSERT
//
// IMPORTANTE:
// Não cria duplicidade.
// ==================================================

export async function salvarJogoAPI(
    jogo
) {

    const normalizado =
        normalizarJogo(
            jogo
        );

    const validacao =
        validarJogo(
            normalizado
        );

    if (
        !validacao.valido
    ) {

        throw new Error(
            `Jogo inválido: ${validacao.erro}`
        );

    }

    const existente =
        await buscarPorApiId(
            normalizado.api_id
        );

    // ==================================================
    // JOGO JÁ EXISTE
    // ==================================================

    if (existente) {

        const resultado =
            await query(

                `
                UPDATE jogos

                SET

                    campeonato = COALESCE($2, campeonato),

                    time_casa = COALESCE($3, time_casa),

                    time_fora = COALESCE($4, time_fora),

                    data_jogo = COALESCE($5, data_jogo),

                    estadio = COALESCE($6, estadio),

                    status = COALESCE($7, status)

                WHERE api_id = $1

                RETURNING

                    id,
                    api_id,
                    campeonato,
                    time_casa,
                    time_fora,
                    data_jogo,
                    estadio,
                    status,
                    criado_em
                `,

                [

                    normalizado.api_id,

                    normalizado.campeonato,

                    normalizado.time_casa,

                    normalizado.time_fora,

                    normalizado.data_jogo,

                    normalizado.estadio,

                    normalizado.status

                ]

            );

        console.log(
            `🔄 Jogo atualizado: ${normalizado.time_casa} x ${normalizado.time_fora} (API ${normalizado.api_id})`
        );

        return (
            resultado.rows[0]
            ||
            existente
        );

    }

    // ==================================================
    // JOGO NOVO
    // ==================================================

    const resultado =
        await query(

            `
            INSERT INTO jogos

            (
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status
            )

            VALUES

            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )

            RETURNING

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em
            `,

            [

                normalizado.api_id,

                normalizado.campeonato,

                normalizado.time_casa,

                normalizado.time_fora,

                normalizado.data_jogo,

                normalizado.estadio,

                normalizado.status

            ]

        );

    console.log(
        `💾 Novo jogo salvo: ${normalizado.time_casa} x ${normalizado.time_fora} (API ${normalizado.api_id})`
    );

    return (
        resultado.rows[0]
        ||
        null
    );

}

// ==================================================
// SALVAR LISTA DE JOGOS
//
// Cada jogo é processado individualmente.
// ==================================================

export async function salvarListaJogos(
    jogos = []
) {

    if (
        !Array.isArray(jogos)
    ) {

        throw new Error(
            "A lista de jogos deve ser um array"
        );

    }

    const lista = [];

    const idsProcessados =
        new Set();

    for (
        const jogo of jogos
    ) {

        try {

            const normalizado =
                normalizarJogo(
                    jogo
                );

            if (!normalizado) {

                console.warn(
                    "⚠️ Jogo ignorado: dados inválidos"
                );

                continue;

            }

            // ------------------------------------------
            // Evitar duplicação dentro da própria resposta
            // da API.
            // ------------------------------------------

            if (
                idsProcessados.has(
                    normalizado.api_id
                )
            ) {

                console.warn(
                    `♻️ Jogo duplicado na resposta da API ignorado: API ${normalizado.api_id}`
                );

                continue;

            }

            idsProcessados.add(
                normalizado.api_id
            );

            const validacao =
                validarJogo(
                    normalizado
                );

            if (
                !validacao.valido
            ) {

                console.warn(
                    `⚠️ Jogo inválido ignorado: ${validacao.erro}`
                );

                continue;

            }

            const salvo =
                await salvarJogoAPI(
                    normalizado
                );

            if (salvo) {

                lista.push(
                    salvo
                );

            }

        }

        catch (erro) {

            console.error(

                "❌ Erro ao salvar jogo:",

                erro.message

            );

        }

    }

    return lista;

}

// ==================================================
// LISTAR TODOS OS JOGOS
// ==================================================

export async function listarJogos() {

    const resultado =
        await query(

            `
            SELECT

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em

            FROM jogos

            ORDER BY

                data_jogo DESC NULLS LAST,

                id DESC
            `

        );

    return (
        Array.isArray(
            resultado.rows
        )
            ? resultado.rows
            : []
    );

}

// ==================================================
// BUSCAR JOGOS DO DIA
// ==================================================

export async function buscarJogosDoDia() {

    const resultado =
        await query(

            `
            SELECT

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em

            FROM jogos

            WHERE

                data_jogo IS NOT NULL

                AND DATE(data_jogo)
                    =
                    CURRENT_DATE

            ORDER BY

                data_jogo ASC NULLS LAST,

                id ASC
            `

        );

    return (
        Array.isArray(
            resultado.rows
        )
            ? resultado.rows
            : []
    );

}

// ==================================================
// BUSCAR PRÓXIMOS JOGOS
// ==================================================

export async function buscarProximosJogos(
    limite = LIMITE_JOGOS_PADRAO
) {

    let limiteNumerico =
        Number(
            limite
        );

    if (
        !Number.isInteger(
            limiteNumerico
        )
    ) {

        limiteNumerico =
            LIMITE_JOGOS_PADRAO;

    }

    if (
        limiteNumerico <= 0
    ) {

        limiteNumerico =
            LIMITE_JOGOS_PADRAO;

    }

    if (
        limiteNumerico >
        LIMITE_JOGOS_MAXIMO
    ) {

        limiteNumerico =
            LIMITE_JOGOS_MAXIMO;

    }

    const resultado =
        await query(

            `
            SELECT

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em

            FROM jogos

            WHERE

                data_jogo IS NOT NULL

                AND data_jogo >= NOW()

            ORDER BY

                data_jogo ASC

            LIMIT $1
            `,

            [
                limiteNumerico
            ]

        );

    return (
        Array.isArray(
            resultado.rows
        )
            ? resultado.rows
            : []
    );

}

// ==================================================
// ATUALIZAR STATUS DO JOGO
// ==================================================

export async function atualizarStatusJogo(
    api_id,
    status
) {

    const apiId =
        normalizarApiId(
            api_id
        );

    if (!apiId) {

        throw new Error(
            "api_id inválido"
        );

    }

    const novoStatus =
        normalizarStatus(
            status
        );

    const resultado =
        await query(

            `
            UPDATE jogos

            SET

                status = $2

            WHERE api_id = $1

            RETURNING

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em
            `,

            [

                apiId,

                novoStatus

            ]

        );

    return (
        resultado.rows[0]
        ||
        null
    );

}

// ==================================================
// ATUALIZAR DADOS DO JOGO
// ==================================================

export async function atualizarJogo(
    api_id,
    dados = {}
) {

    const apiId =
        normalizarApiId(
            api_id
        );

    if (!apiId) {

        throw new Error(
            "api_id inválido"
        );

    }

    if (
        !dados ||
        typeof dados !== "object"
    ) {

        throw new Error(
            "Dados do jogo inválidos"
        );

    }

    const campeonato =
        normalizarTexto(
            dados.campeonato ??
            dados.competicao
        );

    const timeCasa =
        normalizarTexto(
            dados.time_casa ??
            dados.timeCasa ??
            dados.casa
        );

    const timeFora =
        normalizarTexto(
            dados.time_fora ??
            dados.timeFora ??
            dados.fora
        );

    const dataJogo =
        normalizarData(
            dados.data_jogo ??
            dados.dataJogo ??
            dados.horario ??
            dados.data
        );

    const estadio =
        normalizarTexto(
            dados.estadio
        );

    const status =
        dados.status !== undefined &&
        dados.status !== null &&
        dados.status !== ""
            ? normalizarStatus(
                dados.status
            )
            : null;

    const resultado =
        await query(

            `
            UPDATE jogos

            SET

                campeonato =
                    COALESCE(
                        $2,
                        campeonato
                    ),

                time_casa =
                    COALESCE(
                        $3,
                        time_casa
                    ),

                time_fora =
                    COALESCE(
                        $4,
                        time_fora
                    ),

                data_jogo =
                    COALESCE(
                        $5,
                        data_jogo
                    ),

                estadio =
                    COALESCE(
                        $6,
                        estadio
                    ),

                status =
                    COALESCE(
                        $7,
                        status
                    )

            WHERE api_id = $1

            RETURNING

                id,
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                estadio,
                status,
                criado_em
            `,

            [

                apiId,

                campeonato,

                timeCasa,

                timeFora,

                dataJogo,

                estadio,

                status

            ]

        );

    return (
        resultado.rows[0]
        ||
        null
    );

}

// ==================================================
// REMOVER JOGOS ANTIGOS
// ==================================================

export async function removerJogosAntigos(
    dias = 90
) {

    let diasNumerico =
        Number(
            dias
        );

    if (
        !Number.isInteger(
            diasNumerico
        ) ||
        diasNumerico <= 0
    ) {

        throw new Error(
            "Quantidade de dias inválida"
        );

    }

    const resultado =
        await query(

            `
            DELETE FROM jogos

            WHERE

                data_jogo IS NOT NULL

                AND data_jogo <
                    NOW()
                    -
                    (
                        $1 *
                        INTERVAL '1 day'
                    )

            RETURNING id
            `,

            [
                diasNumerico
            ]

        );

    console.log(
        `🧹 Jogos antigos removidos: ${resultado.rowCount}`
    );

    return (
        resultado.rowCount ||
        0
    );

}

// ==================================================
// ESTATÍSTICAS DOS JOGOS
// ==================================================

export async function estatisticasJogos() {

    const resultado =
        await query(

            `
            SELECT

                COUNT(*)::integer
                    AS total,

                COUNT(
                    CASE
                        WHEN UPPER(status)
                            = 'FINISHED'
                        THEN 1
                    END
                )::integer
                    AS finalizados,

                COUNT(
                    CASE
                        WHEN UPPER(status)
                            IN (
                                'SCHEDULED',
                                'TIMED'
                            )
                        THEN 1
                    END
                )::integer
                    AS agendados,

                COUNT(
                    CASE
                        WHEN UPPER(status)
                            NOT IN (
                                'FINISHED',
                                'SCHEDULED',
                                'TIMED'
                            )
                        THEN 1
                    END
                )::integer
                    AS outros

            FROM jogos
            `

        );

    return (
        resultado.rows[0]
        ||
        {
            total: 0,

            finalizados: 0,

            agendados: 0,

            outros: 0

        }
    );

}

// ==================================================
// VERIFICAR SE JOGO EXISTE
// ==================================================

export async function jogoExiste(
    api_id
) {

    const jogo =
        await buscarPorApiId(
            api_id
        );

    return Boolean(
        jogo
    );

}

// ==================================================
// CONTAR JOGOS
// ==================================================

export async function contarJogos() {

    const resultado =
        await query(

            `
            SELECT
                COUNT(*)::integer AS total

            FROM jogos
            `

        );

    return (
        resultado.rows[0]?.total
        ||
        0
    );

}

// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    salvarJogoAPI,

    salvarListaJogos,

    buscarPorApiId,

    listarJogos,

    buscarJogosDoDia,

    buscarProximosJogos,

    atualizarStatusJogo,

    atualizarJogo,

    removerJogosAntigos,

    estatisticasJogos,

    jogoExiste,

    contarJogos

};
