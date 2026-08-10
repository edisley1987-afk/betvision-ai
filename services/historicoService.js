// ==========================================
// BETVISION AI
// services/historicoService.js
//
// Histórico de Jogos + Estatísticas
// Versão 9.0
//
// PostgreSQL / NeonDB
//
// ALINHADO COM:
//
// database/schema.sql
// services/jogoBancoService.js
// services/inteligenciaService.js
//
// Estrutura atual:
//
// jogos
// ├── id
// ├── api_id
// ├── campeonato_id
// ├── time_casa_id
// ├── time_fora_id
// ├── data_jogo
// ├── status
// ├── gols_casa
// ├── gols_fora
// └── temporada
//
// times
// ├── id
// ├── api_id
// ├── campeonato_id
// ├── nome
// ├── pais
// └── logo
//
// IMPORTANTE:
//
// A tabela jogos NÃO possui:
//
// time_casa
// time_fora
//
// Os nomes dos times são obtidos através
// das tabelas times.
// ==========================================

import {
    query
} from "../database/database.js";


// ==========================================
// CONFIGURAÇÕES
// ==========================================

const LIMITE_HISTORICO = 10;


// ==========================================
// NORMALIZAR NOME DO TIME
// ==========================================

function normalizarNomeTime(nome) {

    if (
        nome === undefined ||
        nome === null
    ) {

        return "";

    }

    return String(nome)
        .trim();

}


// ==========================================
// BUSCAR HISTÓRICO DE UM TIME
//
// Procura o time pelo nome.
//
// Depois faz JOIN:
//
// jogos.time_casa_id
//      ↓
// times.id
//
// ou
//
// jogos.time_fora_id
//      ↓
// times.id
//
// ==========================================

export async function buscarHistoricoTime(
    time
) {

    try {

        const nomeTime =
            normalizarNomeTime(
                time
            );


        if (!nomeTime) {

            return [];

        }


        console.log(
            `📊 Buscando histórico: ${nomeTime}`
        );


        const resultado =
            await query(

                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato_id,

                    j.time_casa_id,

                    j.time_fora_id,

                    tc.nome AS time_casa,

                    tf.nome AS time_fora,

                    j.data_jogo,

                    j.status,

                    j.gols_casa,

                    j.gols_fora,

                    j.temporada,

                    j.criado_em

                FROM jogos j

                LEFT JOIN times tc
                    ON tc.id = j.time_casa_id

                LEFT JOIN times tf
                    ON tf.id = j.time_fora_id

                WHERE

                    LOWER(TRIM(tc.nome))
                    =
                    LOWER(TRIM($1))

                    OR

                    LOWER(TRIM(tf.nome))
                    =
                    LOWER(TRIM($1))

                ORDER BY
                    j.data_jogo DESC

                LIMIT $2
                `,

                [
                    nomeTime,
                    LIMITE_HISTORICO
                ]

            );


        const jogos =
            Array.isArray(
                resultado.rows
            )
                ? resultado.rows
                : [];


        console.log(
            `📊 ${nomeTime}: ${jogos.length} jogos encontrados`
        );


        return jogos;

    }

    catch (error) {

        console.error(

            `❌ Erro histórico time ${time}:`,

            error.message

        );


        return [];

    }

}


// ==========================================
// BUSCAR HISTÓRICO DO CONFRONTO
//
// Retorna:
//
// - histórico da equipe da casa
// - histórico da equipe visitante
// - confrontos diretos H2H
//
// ==========================================

export async function buscarHistoricoJogo(

    timeCasa,

    timeFora

) {

    try {

        const nomeCasa =
            normalizarNomeTime(
                timeCasa
            );

        const nomeFora =
            normalizarNomeTime(
                timeFora
            );


        console.log(
            `📊 Buscando histórico: ${nomeCasa} x ${nomeFora}`
        );


        if (
            !nomeCasa ||
            !nomeFora
        ) {

            return {

                historicoCasa: [],

                historicoFora: [],

                h2h: [],

                confrontos: 0,

                vitoriasCasa: 0,

                empates: 0,

                vitoriasFora: 0

            };

        }


        // ======================================
        // HISTÓRICO DA CASA
        // ======================================

        const historicoCasa =
            await buscarHistoricoTime(
                nomeCasa
            );


        // ======================================
        // HISTÓRICO DO FORA
        // ======================================

        const historicoFora =
            await buscarHistoricoTime(
                nomeFora
            );


        // ======================================
        // H2H
        //
        // Aqui verificamos os dois times
        // participando do mesmo jogo.
        //
        // Não depende da ordem casa/fora
        // para localizar o confronto.
        // ======================================

        const resultadoH2H =
            await query(

                `
                SELECT

                    j.id,

                    j.api_id,

                    j.campeonato_id,

                    j.time_casa_id,

                    j.time_fora_id,

                    tc.nome AS time_casa,

                    tf.nome AS time_fora,

                    j.data_jogo,

                    j.status,

                    j.gols_casa,

                    j.gols_fora,

                    j.temporada,

                    j.criado_em

                FROM jogos j

                LEFT JOIN times tc
                    ON tc.id = j.time_casa_id

                LEFT JOIN times tf
                    ON tf.id = j.time_fora_id

                WHERE

                    (

                        LOWER(TRIM(tc.nome))
                        =
                        LOWER(TRIM($1))

                        AND

                        LOWER(TRIM(tf.nome))
                        =
                        LOWER(TRIM($2))

                    )

                    OR

                    (

                        LOWER(TRIM(tc.nome))
                        =
                        LOWER(TRIM($2))

                        AND

                        LOWER(TRIM(tf.nome))
                        =
                        LOWER(TRIM($1))

                    )

                ORDER BY
                    j.data_jogo DESC

                LIMIT 20
                `,

                [
                    nomeCasa,
                    nomeFora
                ]

            );


        const h2h =
            Array.isArray(
                resultadoH2H.rows
            )
                ? resultadoH2H.rows
                : [];


        // ======================================
        // CALCULAR RESULTADOS DO H2H
        // ======================================

        let vitoriasCasa = 0;

        let empates = 0;

        let vitoriasFora = 0;


        for (
            const jogo of h2h
        ) {

            const golsCasa =
                Number(
                    jogo.gols_casa
                );


            const golsFora =
                Number(
                    jogo.gols_fora
                );


            if (
                !Number.isFinite(
                    golsCasa
                )
                ||
                !Number.isFinite(
                    golsFora
                )
            ) {

                continue;

            }


            // ==================================
            // JOGO COM CASA = TIME CASA
            // ==================================

            if (

                String(
                    jogo.time_casa || ""
                )
                .trim()
                .toLowerCase()
                ===
                nomeCasa
                    .toLowerCase()

            ) {

                if (
                    golsCasa > golsFora
                ) {

                    vitoriasCasa++;

                }
                else if (
                    golsCasa === golsFora
                ) {

                    empates++;

                }
                else {

                    vitoriasFora++;

                }

            }


            // ==================================
            // JOGO INVERTIDO
            // ==================================

            else {

                if (
                    golsFora > golsCasa
                ) {

                    vitoriasCasa++;

                }
                else if (
                    golsFora === golsCasa
                ) {

                    empates++;

                }
                else {

                    vitoriasFora++;

                }

            }

        }


        console.log(

            `⚔️ H2H: ${h2h.length} confrontos | ` +

            `Casa ${vitoriasCasa} vitórias | ` +

            `Empates ${empates} | ` +

            `Fora ${vitoriasFora}`

        );


        return {

            historicoCasa,

            historicoFora,

            h2h,

            confrontos:
                h2h.length,

            vitoriasCasa,

            empates,

            vitoriasFora

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

            h2h: [],

            confrontos: 0,

            vitoriasCasa: 0,

            empates: 0,

            vitoriasFora: 0

        };

    }

}


// ==========================================
// SALVAR HISTÓRICO DE JOGO
//
// IMPORTANTE:
//
// O schema atual NÃO permite:
//
// time_casa
// time_fora
//
// diretamente em jogos.
//
// Precisamos utilizar:
//
// time_casa_id
// time_fora_id
//
// ==========================================

export async function salvarHistoricoJogo(
    dados
) {

    try {

        if (!dados) {

            return false;

        }


        // ======================================
        // DADOS PRINCIPAIS
        // ======================================

        const apiId =
            dados.api_id ??
            dados.apiId ??
            dados.id ??
            null;


        const timeCasaId =
            dados.time_casa_id ??
            dados.timeCasaId ??
            null;


        const timeForaId =
            dados.time_fora_id ??
            dados.timeForaId ??
            null;


        const campeonatoId =
            dados.campeonato_id ??
            dados.campeonatoId ??
            null;


        const dataJogo =
            dados.data_jogo ??
            dados.dataJogo ??
            dados.data ??
            null;


        const status =
            dados.status ??
            "FINISHED";


        const golsCasa =
            Number(
                dados.gols_casa ??
                dados.golsCasa ??
                0
            );


        const golsFora =
            Number(
                dados.gols_fora ??
                dados.golsFora ??
                0
            );


        const temporada =
            dados.temporada ??
            null;


        // ======================================
        // VALIDAÇÃO
        // ======================================

        if (
            !timeCasaId ||
            !timeForaId
        ) {

            console.warn(

                "⚠️ Histórico não salvo: " +

                "time_casa_id ou time_fora_id ausente"

            );

            return false;

        }


        // ======================================
        // INSERIR
        //
        // Se api_id existir, atualiza o jogo.
        // ======================================

        if (
            apiId !== null &&
            apiId !== undefined
        ) {

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

                    ON CONFLICT(api_id)

                    DO UPDATE SET

                        campeonato_id =
                            EXCLUDED.campeonato_id,

                        time_casa_id =
                            EXCLUDED.time_casa_id,

                        time_fora_id =
                            EXCLUDED.time_fora_id,

                        data_jogo =
                            EXCLUDED.data_jogo,

                        status =
                            EXCLUDED.status,

                        gols_casa =
                            EXCLUDED.gols_casa,

                        gols_fora =
                            EXCLUDED.gols_fora,

                        temporada =
                            EXCLUDED.temporada

                    RETURNING *

                    `,

                    [

                        apiId,

                        campeonatoId,

                        timeCasaId,

                        timeForaId,

                        dataJogo,

                        status,

                        Number.isFinite(
                            golsCasa
                        )
                            ? golsCasa
                            : 0,

                        Number.isFinite(
                            golsFora
                        )
                            ? golsFora
                            : 0,

                        temporada

                    ]

                );


            return Boolean(
                resultado.rows[0]
            );

        }


        // ======================================
        // SEM API_ID
        // ======================================

        const resultado =
            await query(

                `
                INSERT INTO jogos

                (
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
                    $8
                )

                RETURNING *

                `,

                [

                    campeonatoId,

                    timeCasaId,

                    timeForaId,

                    dataJogo,

                    status,

                    Number.isFinite(
                        golsCasa
                    )
                        ? golsCasa
                        : 0,

                    Number.isFinite(
                        golsFora
                    )
                        ? golsFora
                        : 0,

                    temporada

                ]

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


// ==========================================
// ÚLTIMOS RESULTADOS
//
// Retorna formato simplificado
// para o motor estatístico.
//
// ==========================================

export async function ultimosResultados(
    time
) {

    try {

        const jogos =
            await buscarHistoricoTime(
                time
            );


        return jogos.map(
            (jogo) => ({

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
                        jogo.gols_casa ?? 0
                    ),

                golsFora:
                    Number(
                        jogo.gols_fora ?? 0
                    ),

                status:
                    jogo.status,

                temporada:
                    jogo.temporada

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


// ==========================================
// ESTATÍSTICAS BÁSICAS DE UM TIME
//
// Calcula:
//
// - jogos
// - vitórias
// - empates
// - derrotas
// - gols marcados
// - gols sofridos
// - média de gols
// - percentual de forma
//
// ==========================================

export async function calcularEstatisticasTime(
    time
) {

    try {

        const jogos =
            await buscarHistoricoTime(
                time
            );


        if (
            !jogos.length
        ) {

            return {

                jogos: 0,

                vitorias: 0,

                empates: 0,

                derrotas: 0,

                golsMarcados: 0,

                golsSofridos: 0,

                mediaGols: 1,

                forma: 50

            };

        }


        const nomeTime =
            normalizarNomeTime(
                time
            )
            .toLowerCase();


        let vitorias = 0;

        let empates = 0;

        let derrotas = 0;

        let golsMarcados = 0;

        let golsSofridos = 0;


        for (
            const jogo of jogos
        ) {

            const golsCasa =
                Number(
                    jogo.gols_casa
                );


            const golsFora =
                Number(
                    jogo.gols_fora
                );


            if (

                !Number.isFinite(
                    golsCasa
                )

                ||

                !Number.isFinite(
                    golsFora
                )

            ) {

                continue;

            }


            const casa =
                String(
                    jogo.time_casa || ""
                )
                .trim()
                .toLowerCase();


            if (
                casa === nomeTime
            ) {

                golsMarcados +=
                    golsCasa;

                golsSofridos +=
                    golsFora;


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

                golsMarcados +=
                    golsFora;

                golsSofridos +=
                    golsCasa;


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
            vitorias +
            empates +
            derrotas;


        const mediaGols =
            totalJogos > 0

                ? Number(
                    (
                        golsMarcados /
                        totalJogos
                    ).toFixed(2)
                )

                : 1;


        // ======================================
        // FORMA
        //
        // Vitória = 100
        // Empate = 50
        // Derrota = 0
        // ======================================

        const pontos =
            (
                vitorias * 3
            )
            +
            (
                empates
            );


        const pontosMaximos =
            totalJogos * 3;


        const forma =
            pontosMaximos > 0

                ? Number(
                    (
                        (
                            pontos /
                            pontosMaximos
                        ) * 100
                    ).toFixed(2)
                )

                : 50;


        return {

            jogos:
                totalJogos,

            vitorias,

            empates,

            derrotas,

            golsMarcados,

            golsSofridos,

            mediaGols,

            forma

        };

    }

    catch (error) {

        console.error(

            `❌ Erro estatísticas ${time}:`,

            error.message

        );


        return {

            jogos: 0,

            vitorias: 0,

            empates: 0,

            derrotas: 0,

            golsMarcados: 0,

            golsSofridos: 0,

            mediaGols: 1,

            forma: 50

        };

    }

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    buscarHistoricoJogo,

    buscarHistoricoTime,

    salvarHistoricoJogo,

    ultimosResultados,

    calcularEstatisticasTime

};

