```javascript
// ==========================================
// BetVision AI
// services/jogosService.js
// Versão compatível com PostgreSQL / Neon
// ==========================================

import {
    listarJogos,
    inserirJogo,
    atualizarJogo
} from "../database/bancoService.js";


// ==========================================
// LISTAR JOGOS
// ==========================================

export async function buscarJogos() {

    const jogos = await listarJogos();

    return jogos.map(jogo => ({

        id: jogo.id,

        api_id: jogo.api_id,

        campeonato: jogo.campeonato,

        time_casa: jogo.time_casa,

        time_fora: jogo.time_fora,

        data_jogo: jogo.data_jogo,

        estadio: jogo.estadio,

        status: jogo.status,

        criado_em: jogo.criado_em

    }));

}


// ==========================================
// BUSCAR JOGO POR API_ID
// ==========================================

export async function buscarJogoPorApiId(apiId) {

    const jogos = await listarJogos();

    return jogos.find(
        jogo => Number(jogo.api_id) === Number(apiId)
    ) || null;

}


// ==========================================
// SALVAR JOGO
// ==========================================

export async function salvarJogo(dados) {

    if (!dados) {
        throw new Error("Dados do jogo não informados");
    }

    if (!dados.api_id) {
        throw new Error("api_id do jogo é obrigatório");
    }

    const jogoExistente = await buscarJogoPorApiId(
        dados.api_id
    );

    const jogo = {

        api_id: dados.api_id,

        campeonato: dados.campeonato || null,

        time_casa: dados.time_casa || null,

        time_fora: dados.time_fora || null,

        data_jogo: dados.data_jogo || null,

        estadio: dados.estadio || null,

        status: dados.status || "SCHEDULED"

    };


    // ==========================================
    // ATUALIZA JOGO EXISTENTE
    // ==========================================

    if (jogoExistente) {

        return await atualizarJogo(
            jogoExistente.id,
            jogo
        );

    }


    // ==========================================
    // INSERE NOVO JOGO
    // ==========================================

    return await inserirJogo(jogo);

}


// ==========================================
// NORMALIZAR JOGO DA API
// ==========================================

export function normalizarJogo(item) {

    if (!item) {
        return null;
    }

    const fixture = item.fixture || {};
    const league = item.league || {};
    const teams = item.teams || {};

    return {

        api_id: fixture.id || null,

        campeonato:
            league.name || null,

        time_casa:
            teams.home?.name || null,

        time_fora:
            teams.away?.name || null,

        data_jogo:
            fixture.date || null,

        estadio:
            fixture.venue?.name || null,

        status:
            fixture.status?.short ||
            fixture.status?.long ||
            "SCHEDULED"

    };

}
```
