// ==========================================
// BetVision AI
// services/timesService.js
// Football-Data.org v4
// ==========================================

import { consultarAPI } from "./apiFootballService.js";

// ==========================================
// BUSCAR TIMES DA COMPETIÇÃO
// ==========================================

export async function buscarTimes(codigoCompeticao) {

    try {

        console.log(
            `⚽ Buscando times da competição ${codigoCompeticao}`
        );

        const resposta = await consultarAPI(

            `/competitions/${codigoCompeticao}/teams`

        );

        const times = resposta.teams || [];

        console.log(
            `✅ ${times.length} times encontrados`
        );

        return times.map(time => ({

            id: time.id,

            nome: time.name,

            nomeCurto: time.shortName || time.name,

            sigla: time.tla || "",

            pais: time.area?.name || "",

            fundacao: time.founded || null,

            estadio: time.venue || "",

            treinador: time.coach?.name || "",

            website: time.website || "",

            email: time.email || "",

            cores: time.clubColors || "",

            logo: time.crest || ""

        }));

    }

    catch (erro) {

        console.error(
            "❌ Erro ao buscar times:",
            erro.message
        );

        return [];

    }

}

// ==========================================
// BUSCAR UM TIME
// ==========================================

export async function buscarTime(idTime) {

    try {

        const resposta = await consultarAPI(

            `/teams/${idTime}`

        );

        return {

            id: resposta.id,

            nome: resposta.name,

            nomeCurto: resposta.shortName,

            sigla: resposta.tla,

            pais: resposta.area?.name,

            fundacao: resposta.founded,

            estadio: resposta.venue,

            treinador: resposta.coach?.name || "",

            website: resposta.website,

            cores: resposta.clubColors,

            logo: resposta.crest

        };

    }

    catch (erro) {

        console.error(
            "❌ Erro ao buscar time:",
            erro.message
        );

        return null;

    }

}

// ==========================================
// ÚLTIMOS JOGOS DO TIME
// ==========================================

export async function buscarUltimosJogos(idTime, limite = 10) {

    try {

        const resposta = await consultarAPI(

            `/teams/${idTime}/matches`,

            {

                limit: limite

            }

        );

        return resposta.matches || [];

    }

    catch (erro) {

        console.error(
            "❌ Erro ao buscar histórico:",
            erro.message
        );

        return [];

    }

}

// ==========================================
// RESUMO DO TIME
// ==========================================

export async function buscarResumoTime(idTime) {

    const time = await buscarTime(idTime);

    const jogos = await buscarUltimosJogos(idTime);

    return {

        time,

        jogos

    };

}

// ==========================================
// EXPORT
// ==========================================

export default {

    buscarTimes,

    buscarTime,

    buscarUltimosJogos,

    buscarResumoTime

};
