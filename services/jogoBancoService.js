```javascript
//
// ==================================================
// BETVISION AI
// services/jogoBancoService.js
// Controle de Jogos PostgreSQL v5.3
// ==================================================

import { query } from "../database/database.js";


// ==================================================
// SALVAR JOGO INDIVIDUAL DA API
// ==================================================

export async function salvarJogoAPI(jogo) {

    if (!jogo) {
        throw new Error("Dados do jogo não informados");
    }

    const {
        api_id,
        campeonato,
        time_casa,
        time_fora,
        data_jogo,
        status,
        estadio
    } = jogo;

    if (!api_id) {
        throw new Error("api_id do jogo é obrigatório");
    }

    const resultado = await query(
        "INSERT INTO jogos " +
        "(api_id, campeonato, time_casa, time_fora, data_jogo, estadio, status) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7) " +
        "ON CONFLICT (api_id) DO UPDATE SET " +
        "campeonato = EXCLUDED.campeonato, " +
        "time_casa = EXCLUDED.time_casa, " +
        "time_fora = EXCLUDED.time_fora, " +
        "data_jogo = EXCLUDED.data_jogo, " +
        "estadio = EXCLUDED.estadio, " +
        "status = EXCLUDED.status " +
        "RETURNING *",
        [
            api_id,
            campeonato || null,
            time_casa || null,
            time_fora || null,
            data_jogo || null,
            estadio || null,
            status || "SCHEDULED"
        ]
    );

    return resultado.rows[0];
}


// ==================================================
// SALVAR LISTA DE JOGOS
// ==================================================

export async function salvarListaJogos(jogos = []) {

    const lista = [];

    for (const jogo of jogos) {

        try {

            const salvo = await salvarJogoAPI(jogo);

            lista.push(salvo);

        } catch (erro) {

            console.error(
                "Erro ao salvar jogo:",
                erro.message
            );

        }
    }

    return lista;
}


// ==================================================
// BUSCAR JOGO PELO API_ID
// ==================================================

export async function buscarPorApiId(api_id) {

    const resultado = await query(
        "SELECT * FROM jogos WHERE api_id = $1 LIMIT 1",
        [api_id]
    );

    return resultado.rows[0] || null;
}


// ==================================================
// LISTAR TODOS OS JOGOS
// ==================================================

export async function listarJogos() {

    const resultado = await query(
        "SELECT id, api_id, campeonato, time_casa, time_fora, " +
        "data_jogo, estadio, status, criado_em " +
        "FROM jogos ORDER BY data_jogo DESC"
    );

    return resultado.rows;
}


// ==================================================
// BUSCAR JOGOS DO DIA
// ==================================================

export async function buscarJogosDoDia() {

    const resultado = await query(
        "SELECT id, api_id, campeonato, time_casa, time_fora, " +
        "data_jogo, estadio, status, criado_em " +
        "FROM jogos " +
        "WHERE DATE(data_jogo) = CURRENT_DATE " +
        "ORDER BY data_jogo ASC"
    );

    return resultado.rows;
}


// ==================================================
// BUSCAR PRÓXIMOS JOGOS
// ==================================================

export async function buscarProximosJogos(limite = 20) {

    const resultado = await query(
        "SELECT id, api_id, campeonato, time_casa, time_fora, " +
        "data_jogo, estadio, status, criado_em " +
        "FROM jogos " +
        "WHERE data_jogo >= NOW() " +
        "ORDER BY data_jogo ASC " +
        "LIMIT $1",
        [limite]
    );

    return resultado.rows;
}


// ==================================================
// ATUALIZAR STATUS DO JOGO
// ==================================================

export async function atualizarStatusJogo(
    api_id,
    status
) {

    const resultado = await query(
        "UPDATE jogos " +
        "SET status = $2 " +
        "WHERE api_id = $1 " +
        "RETURNING *",
        [
            api_id,
            status
        ]
    );

    return resultado.rows[0] || null;
}


// ==================================================
// ATUALIZAR DADOS DO JOGO
// ==================================================

export async function atualizarJogo(
    api_id,
    dados = {}
) {

    const {
        campeonato,
        time_casa,
        time_fora,
        data_jogo,
        estadio,
        status
    } = dados;

    const resultado = await query(
        "UPDATE jogos SET " +
        "campeonato = COALESCE($2, campeonato), " +
        "time_casa = COALESCE($3, time_casa), " +
        "time_fora = COALESCE($4, time_fora), " +
        "data_jogo = COALESCE($5, data_jogo), " +
        "estadio = COALESCE($6, estadio), " +
        "status = COALESCE($7, status) " +
        "WHERE api_id = $1 " +
        "RETURNING *",
        [
            api_id,
            campeonato || null,
            time_casa || null,
            time_fora || null,
            data_jogo || null,
            estadio || null,
            status || null
        ]
    );

    return resultado.rows[0] || null;
}


// ==================================================
// REMOVER JOGOS ANTIGOS
// ==================================================

export async function removerJogosAntigos(dias = 90) {

    const diasNumerico = Number(dias);

    if (
        !Number.isInteger(diasNumerico) ||
        diasNumerico <= 0
    ) {
        throw new Error("Quantidade de dias inválida");
    }

    const resultado = await query(
        "DELETE FROM jogos " +
        "WHERE data_jogo < NOW() - ($1 * INTERVAL '1 day') " +
        "RETURNING id",
        [diasNumerico]
    );

    return resultado.rowCount;
}


// ==================================================
// ESTATÍSTICAS DOS JOGOS
// ==================================================

export async function estatisticasJogos() {

    const resultado = await query(
        "SELECT " +
        "COUNT(*) AS total, " +
        "COUNT(CASE WHEN status = 'FINISHED' THEN 1 END) AS finalizados, " +
        "COUNT(CASE WHEN status IN ('SCHEDULED', 'TIMED') THEN 1 END) AS agendados " +
        "FROM jogos"
    );

    return resultado.rows[0];
}


// ==================================================
// EXPORTAÇÃO DEFAULT
// ==================================================

export default {

    salvarJogoAPI,
    salvarListaJogos,
    listarJogos,
    buscarPorApiId,
    buscarJogosDoDia,
    buscarProximosJogos,
    atualizarStatusJogo,
    atualizarJogo,
    removerJogosAntigos,
    estatisticasJogos

};
```
