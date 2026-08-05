// ==========================================
// BetVision AI
// services/jogoBancoService.js
// PostgreSQL Jogos
// Versão 10.0
// ==========================================

import db from "../database/database.js";


// ==========================================
// NORMALIZAR DATA
// ==========================================

function normalizarData(data) {

    if (!data) {

        return new Date();

    }

    // Já veio ISO
    if (String(data).includes("T")) {

        return new Date(data);

    }

    // Veio apenas horário (20:00)
    if (/^\d{2}:\d{2}$/.test(String(data))) {

        const hoje = new Date();

        const [hora, minuto] = data.split(":");

        hoje.setHours(Number(hora));
        hoje.setMinutes(Number(minuto));
        hoje.setSeconds(0);
        hoje.setMilliseconds(0);

        return hoje;

    }

    const d = new Date(data);

    if (isNaN(d.getTime())) {

        return new Date();

    }

    return d;

}



// ==========================================
// SALVAR JOGO
// ==========================================

export async function salvarJogo(jogo = {}) {

    try {

        // Normaliza o ID para caber em INTEGER
        let apiId = Number(jogo.id);

        if (!Number.isInteger(apiId) || apiId > 2147483647) {

            apiId = Number(String(Date.now()).slice(-9));

        }

        const timeCasa =
            jogo.time_casa ||
            jogo.casa ||
            "-";

        const timeFora =
            jogo.time_fora ||
            jogo.fora ||
            "-";

        const campeonato =
            jogo.campeonato ||
            jogo.league ||
            "-";

        const dataJogo =
            jogo.data_jogo ||
            jogo.horario ||
            jogo.data ||
            new Date();

        await db.query(

            `
            INSERT INTO jogos
            (
                api_id,
                campeonato,
                time_casa,
                time_fora,
                data_jogo,
                status
            )

            VALUES
            (
                $1,$2,$3,$4,$5,$6
            )

            ON CONFLICT(api_id)

            DO UPDATE SET

                campeonato = EXCLUDED.campeonato,
                time_casa  = EXCLUDED.time_casa,
                time_fora  = EXCLUDED.time_fora,
                data_jogo  = EXCLUDED.data_jogo,
                status     = EXCLUDED.status
            `,

            [

                apiId,

                campeonato,

                timeCasa,

                timeFora,

                normalizarData(dataJogo),

                jogo.status || "SCHEDULED"

            ]

        );

        return true;

    }

    catch (error) {

        console.error("❌ Erro salvar jogo:", error.message);

        return false;

    }

}


// ==========================================
// SALVAR LISTA
// ==========================================

export async function salvarListaJogos(jogos = []) {

    let total = 0;

    for (const jogo of jogos) {

        const salvo = await salvarJogo(jogo);

        if (salvo) {

            total++;

        }

    }

    console.log(`⚽ ${total} jogos salvos no PostgreSQL`);

    return total;

}



// ==========================================
// LISTAR JOGOS
// ==========================================

export async function listarJogos() {

    try {

        const resultado = await db.query(

            `
            SELECT *
            FROM jogos
            ORDER BY data_jogo ASC
            `

        );

        return resultado.rows;

    }

    catch (error) {

        console.error("❌ Erro listar jogos:", error.message);

        return [];

    }

}



// ==========================================
// BUSCAR JOGO
// ==========================================

export async function buscarJogo(id) {

    try {

        const resultado = await db.query(

            `
            SELECT *
            FROM jogos
            WHERE api_id = $1
            LIMIT 1
            `,

            [id]

        );

        return resultado.rows[0] || null;

    }

    catch {

        return null;

    }

}



// ==========================================
// REMOVER JOGOS ANTIGOS
// ==========================================

export async function limparJogosAntigos() {

    try {

        await db.query(

            `
            DELETE FROM jogos
            WHERE data_jogo < NOW() - INTERVAL '7 days'
            `

        );

    }

    catch (error) {

        console.log(error.message);

    }

}



// ==========================================
// EXPORT
// ==========================================

export default {

    salvarJogo,

    salvarListaJogos,

    listarJogos,

    buscarJogo,

    limparJogosAntigos

};
