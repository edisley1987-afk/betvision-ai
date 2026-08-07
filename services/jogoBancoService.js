//
// ==================================================
// BETVISION AI
// services/jogoBancoService.js
// Controle de Jogos PostgreSQL v5.1
// Compatibilidade Rotas Antigas + Novas
// ==================================================


import {
    query
} from "../database/database.js";



// ==================================================
// SALVAR JOGO INDIVIDUAL DA API
// ==================================================

export async function salvarJogoAPI(jogo){


    const {

        api_id,
        campeonato,
        time_casa,
        time_fora,
        data_jogo,
        status,
        gols_casa,
        gols_fora,
        rodada,
        estadio

    } = jogo;



    const resultado = await query(

        `
        INSERT INTO jogos

        (
            api_id,
            campeonato,
            time_casa,
            time_fora,
            data_jogo,
            status,
            gols_casa,
            gols_fora,
            rodada,
            estadio
        )

        VALUES

        (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9,$10
        )

        ON CONFLICT(api_id)

        DO UPDATE SET

            campeonato = EXCLUDED.campeonato,

            time_casa = EXCLUDED.time_casa,

            time_fora = EXCLUDED.time_fora,

            data_jogo = EXCLUDED.data_jogo,

            status = EXCLUDED.status,

            gols_casa = EXCLUDED.gols_casa,

            gols_fora = EXCLUDED.gols_fora,

            rodada = EXCLUDED.rodada,

            estadio = EXCLUDED.estadio


        RETURNING *

        `,


        [

            api_id,
            campeonato,
            time_casa,
            time_fora,
            data_jogo,
            status,
            gols_casa,
            gols_fora,
            rodada,
            estadio

        ]

    );


    return resultado.rows[0];

}



// ==================================================
// SALVAR LISTA DE JOGOS
// COMPATIBILIDADE ROTAS ANTIGAS
// ==================================================

export async function salvarListaJogos(
    jogos = []
){

    const lista = [];


    for(const jogo of jogos){


        const salvo =
            await salvarJogoAPI(
                jogo
            );


        lista.push(
            salvo
        );


    }


    return lista;

}



// ==================================================
// BUSCAR JOGO PELO ID API
// ==================================================

export async function buscarPorApiId(
    api_id
){

    const resultado = await query(

        `
        SELECT *

        FROM jogos

        WHERE api_id=$1

        `,

        [
            api_id
        ]

    );


    return resultado.rows[0];

}



// ==================================================
// LISTAR TODOS OS JOGOS
// COMPATIBILIDADE ROTAS
// ==================================================

export async function listarJogos(){

    const resultado = await query(

        `
        SELECT *

        FROM jogos

        ORDER BY data_jogo DESC

        `

    );


    return resultado.rows;

}



// ==================================================
// BUSCAR JOGOS DO DIA
// ==================================================

export async function buscarJogosDoDia(){

    const resultado = await query(

        `
        SELECT *

        FROM jogos

        WHERE DATE(data_jogo)
        =
        CURRENT_DATE

        ORDER BY data_jogo

        `

    );


    return resultado.rows;

}



// ==================================================
// BUSCAR PRÓXIMOS JOGOS
// ==================================================

export async function buscarProximosJogos(
    limite = 20
){

    const resultado = await query(

        `
        SELECT *

        FROM jogos

        WHERE data_jogo >= NOW()

        ORDER BY data_jogo ASC

        LIMIT $1

        `,

        [
            limite
        ]

    );


    return resultado.rows;

}



// ==================================================
// ATUALIZAR RESULTADO
// ==================================================

export async function atualizarResultado(

    api_id,

    gols_casa,

    gols_fora,

    status

){

    const resultado = await query(

        `
        UPDATE jogos

        SET

            gols_casa=$2,

            gols_fora=$3,

            status=$4


        WHERE api_id=$1


        RETURNING *

        `,

        [

            api_id,

            gols_casa,

            gols_fora,

            status

        ]

    );


    return resultado.rows[0];

}



// ==================================================
// REMOVER JOGOS ANTIGOS
// ==================================================

export async function removerJogosAntigos(
    dias = 90
){

    const resultado = await query(

        `
        DELETE FROM jogos

        WHERE data_jogo <
        
        NOW() - INTERVAL '${dias} days'


        RETURNING id

        `

    );


    return resultado.rowCount;

}



// ==================================================
// ESTATÍSTICAS DOS JOGOS
// ==================================================

export async function estatisticasJogos(){

    const resultado = await query(

        `
        SELECT


        COUNT(*) AS total,


        COUNT(
            CASE
                WHEN status='FINISHED'
                THEN 1
            END
        ) AS finalizados,


        COUNT(
            CASE
                WHEN status='SCHEDULED'
                THEN 1
            END
        ) AS agendados


        FROM jogos

        `

    );


    return resultado.rows[0];

}



// ==================================================
// EXPORTAÇÃO FINAL
// ==================================================

export default {


    salvarJogoAPI,

    salvarListaJogos,

    listarJogos,

    buscarPorApiId,

    buscarJogosDoDia,

    buscarProximosJogos,

    atualizarResultado,

    removerJogosAntigos,

    estatisticasJogos

};
