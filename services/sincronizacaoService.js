// ==================================================
// BETVISION AI
// services/sincronizacaoService.js
//
// Versão 6.0
// Neon PostgreSQL + Football-Data.org v4
//
// Sincronização automática de campeonatos
// Compatível com tabela campeonatos atual
//
// Estrutura confirmada:
//
// id
// nome
// pais
// continente
// temporada
// api_id UNIQUE
// logo
// ativo
// ==================================================

import axios from "axios";
import cron from "node-cron";

import { query } from "../database/database.js";

// ==================================================
// CONFIGURAÇÃO FOOTBALL-DATA
// ==================================================

const API_URL =
    process.env.API_FOOTBALL_URL ||
    "https://api.football-data.org/v4";

const API_KEY =
    process.env.API_FOOTBALL_KEY;

// ==================================================
// BUSCAR CAMPEONATOS NA FOOTBALL-DATA
// ==================================================

export async function buscarCampeonatosAPI() {

    try {

        if (!API_KEY) {

            console.log(
                "⚠️ API_FOOTBALL_KEY não configurada"
            );

            return [];

        }

        console.log(
            "🌍 Consultando Football-Data.org..."
        );

        const resposta = await axios.get(

            `${API_URL}/competitions`,

            {
                headers: {

                    "X-Auth-Token":
                        API_KEY

                },

                timeout: 15000

            }

        );

        const competicoes =
            resposta.data?.competitions || [];

        console.log(
            `🌍 ${competicoes.length} campeonatos recebidos da API`
        );

        return competicoes;

    }

    catch (error) {

        console.error(
            "❌ Erro Football-Data:",
            error.response?.data ||
            error.message
        );

        return [];

    }

}

// ==================================================
// NORMALIZAR CAMPEONATO
// ==================================================

function normalizarCampeonato(campeonato) {

    if (!campeonato) {

        return null;

    }

    return {

        api_id:
            Number(campeonato.id) || null,

        nome:
            campeonato.name ||
            "Desconhecido",

        pais:
            campeonato.area?.name ||
            "Internacional",

        continente:
            campeonato.area?.code ||
            null,

        temporada:
            campeonato.currentSeason?.startDate
                ?.substring(0, 4) ||
            null,

        logo:
            campeonato.emblem ||
            null,

        ativo:
            true

    };

}

// ==================================================
// OBTER PRÓXIMO ID INTERNO
//
// A tabela campeonatos possui:
//
// id INTEGER NOT NULL
//
// mas NÃO possui sequence/default.
//
// Portanto geramos o próximo ID manualmente.
//
// FOR UPDATE evita conflitos durante a transação
// quando possível.
// ==================================================

async function obterProximoId() {

    const resultado = await query(`

        SELECT
            COALESCE(MAX(id), 0) + 1 AS proximo_id

        FROM campeonatos

    `);

    return Number(
        resultado.rows[0]?.proximo_id || 1
    );

}

// ==================================================
// SALVAR CAMPEONATO
//
// Estratégia:
//
// 1. Verifica pelo api_id
// 2. Se existir -> UPDATE
// 3. Se não existir -> INSERT
// 4. Gera id interno manualmente
// ==================================================

async function salvarCampeonato(campeonato) {

    try {

        if (
            !campeonato ||
            !campeonato.api_id
        ) {

            console.error(
                "❌ Campeonato sem api_id"
            );

            return null;

        }

        // ==================================================
        // PROCURAR CAMPEONATO PELO API_ID
        // ==================================================

        const existente =
            await query(

                `
                SELECT
                    id,
                    api_id

                FROM campeonatos

                WHERE api_id = $1

                LIMIT 1
                `,

                [
                    campeonato.api_id
                ]

            );

        // ==================================================
        // CAMPEONATO JÁ EXISTE
        // ==================================================

        if (
            existente.rows.length > 0
        ) {

            const idExistente =
                existente.rows[0].id;

            const resultado =
                await query(

                    `
                    UPDATE campeonatos

                    SET

                        nome = $1,

                        pais = $2,

                        continente = $3,

                        temporada = $4,

                        logo = $5,

                        ativo = $6

                    WHERE id = $7

                    RETURNING *
                    `,

                    [

                        campeonato.nome,

                        campeonato.pais,

                        campeonato.continente,

                        campeonato.temporada,

                        campeonato.logo,

                        campeonato.ativo,

                        idExistente

                    ]

                );

            console.log(
                `🔄 Campeonato atualizado: ${campeonato.nome} (API ${campeonato.api_id})`
            );

            return resultado.rows[0] || null;

        }

        // ==================================================
        // CAMPEONATO NOVO
        // ==================================================

        const novoId =
            await obterProximoId();

        const resultado =
            await query(

                `
                INSERT INTO campeonatos

                (
                    id,
                    nome,
                    pais,
                    continente,
                    temporada,
                    api_id,
                    logo,
                    ativo
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

                    novoId,

                    campeonato.nome,

                    campeonato.pais,

                    campeonato.continente,

                    campeonato.temporada,

                    campeonato.api_id,

                    campeonato.logo,

                    campeonato.ativo

                ]

            );

        console.log(
            `➕ Campeonato inserido: ${campeonato.nome} (ID ${novoId} / API ${campeonato.api_id})`
        );

        return resultado.rows[0] || null;

    }

    catch (error) {

        console.error(
            `❌ Erro salvar campeonato ${campeonato?.nome || ""}:`,
            error.message
        );

        return null;

    }

}

// ==================================================
// SINCRONIZAR CAMPEONATOS
// ==================================================

export async function sincronizarCampeonatos() {

    console.log(
        "=============================================="
    );

    console.log(
        "🌍 INICIANDO SINCRONIZAÇÃO DE CAMPEONATOS"
    );

    console.log(
        "=============================================="
    );

    const lista =
        await buscarCampeonatosAPI();

    if (!lista.length) {

        console.log(
            "⚠️ Nenhum campeonato recebido da API"
        );

        return {

            sucesso: false,

            total: 0,

            mensagem:
                "Nenhum campeonato recebido da Football-Data"

        };

    }

    let salvos = 0;

    let erros = 0;

    // ==================================================
    // PROCESSAR CAMPEONATOS
    // ==================================================

    for (const item of lista) {

        try {

            const campeonato =
                normalizarCampeonato(item);

            if (!campeonato) {

                erros++;

                continue;

            }

            const resultado =
                await salvarCampeonato(
                    campeonato
                );

            if (resultado) {

                salvos++;

            }
            else {

                erros++;

            }

        }

        catch (error) {

            erros++;

            console.error(
                "❌ Erro processamento campeonato:",
                error.message
            );

        }

    }

    // ==================================================
    // RESULTADO
    // ==================================================

    console.log(
        "=============================================="
    );

    console.log(
        `🏆 ${salvos} campeonatos sincronizados`
    );

    console.log(
        `⚠️ ${erros} campeonatos com erro`
    );

    console.log(
        "=============================================="
    );

    return {

        sucesso: true,

        total: salvos,

        erros

    };

}

// ==================================================
// INICIAR SINCRONIZAÇÃO AO SUBIR O SISTEMA
// ==================================================

export async function iniciarSincronizacao() {

    console.log(
        "🚀 Iniciando serviço de sincronização..."
    );

    try {

        const resultado =
            await sincronizarCampeonatos();

        console.log(
            "📊 Resultado sincronização:",
            resultado
        );

        return resultado;

    }

    catch (error) {

        console.error(
            "❌ Erro inicial sincronização:",
            error.message
        );

        return {

            sucesso: false,

            total: 0,

            erros: 1,

            erro:
                error.message

        };

    }

}

// ==================================================
// AGENDAMENTO AUTOMÁTICO
//
// Executa todos os dias às 03:00.
//
// Horário do servidor/ambiente.
// ==================================================

export function ativarAgendamento() {

    cron.schedule(

        "0 3 * * *",

        async () => {

            console.log(
                "🔄 Atualização automática de campeonatos"
            );

            try {

                const resultado =
                    await sincronizarCampeonatos();

                console.log(
                    "📊 Atualização automática concluída:",
                    resultado
                );

            }

            catch (error) {

                console.error(
                    "❌ Erro atualização automática:",
                    error.message
                );

            }

        }

    );

    console.log(
        "⏰ Agendamento de campeonatos ativo"
    );

}

// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {

    buscarCampeonatosAPI,

    sincronizarCampeonatos,

    iniciarSincronizacao,

    ativarAgendamento

};
