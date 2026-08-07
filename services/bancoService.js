//
// ==================================================
// BETVISION AI
// services/bancoService.js
// Serviço central PostgreSQL v5.0
// ==================================================


import {
    query
} from "../database/database.js";



// ==================================================
// CAMPEONATOS
// ==================================================


export async function listarCampeonatos(){

    const resultado =
        await query(
            `
            SELECT *
            FROM campeonatos
            ORDER BY nome
            `
        );


    return resultado.rows;

}



export async function inserirCampeonato(
    campeonato
){

    const {

        id,
        nome,
        pais,
        continente,
        temporada

    } = campeonato;



    const resultado =
        await query(

            `
            INSERT INTO campeonatos
            (
                id,
                nome,
                pais,
                continente,
                temporada
            )

            VALUES
            (
                $1,$2,$3,$4,$5
            )

            ON CONFLICT(id)
            DO UPDATE SET

                nome = EXCLUDED.nome,
                pais = EXCLUDED.pais,
                continente = EXCLUDED.continente,
                temporada = EXCLUDED.temporada

            RETURNING *
            `,

            [
                id,
                nome,
                pais,
                continente,
                temporada
            ]

        );


    return resultado.rows[0];

}



// ==================================================
// TIMES
// ==================================================


export async function listarTimes(){

    const resultado =
        await query(
            `
            SELECT *
            FROM times
            ORDER BY nome
            `
        );


    return resultado.rows;

}



export async function inserirTime(
    time
){

    const {

        id,
        campeonato_id,
        nome,
        pais

    } = time;



    const resultado =
        await query(

            `
            INSERT INTO times
            (
                id,
                campeonato_id,
                nome,
                pais
            )

            VALUES
            (
                $1,$2,$3,$4
            )

            ON CONFLICT(id)
            DO UPDATE SET

                nome = EXCLUDED.nome,
                campeonato_id = EXCLUDED.campeonato_id,
                pais = EXCLUDED.pais

            RETURNING *
            `,

            [
                id,
                campeonato_id,
                nome,
                pais
            ]

        );


    return resultado.rows[0];

}



// ==================================================
// JOGOS
// ==================================================


export async function listarJogosHoje(){

    const resultado =
        await query(

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



export async function buscarJogoPorApiId(
    api_id
){

    const resultado =
        await query(

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
// ANÁLISES IA
// ==================================================


export async function salvarAnalise(
    analise
){

    const {

        jogo_id,
        jogo,
        probabilidade_casa,
        probabilidade_empate,
        probabilidade_fora,
        gols_esperados,
        placar_previsto,
        value_bet,
        confianca,
        algoritmo

    } = analise;



    const resultado =
        await query(

            `
            INSERT INTO analises

            (
                jogo_id,
                jogo,
                probabilidade_casa,
                probabilidade_empate,
                probabilidade_fora,
                gols_esperados,
                placar_previsto,
                value_bet,
                confianca,
                algoritmo
            )

            VALUES

            (
                $1,$2,$3,$4,$5,
                $6,$7,$8,$9,$10
            )

            RETURNING *

            `,

            [

                jogo_id,
                jogo,
                probabilidade_casa,
                probabilidade_empate,
                probabilidade_fora,
                gols_esperados,
                placar_previsto,
                value_bet,
                confianca,
                algoritmo

            ]

        );


    return resultado.rows[0];

}



export async function listarAnalises(){

    const resultado =
        await query(

            `
            SELECT *

            FROM analises

            ORDER BY criado_em DESC

            `

        );


    return resultado.rows;

}



// ==================================================
// VALUE BETS
// ==================================================


export async function salvarValueBet(
    valueBet
){

    const {

        jogo_id,
        mercado,
        odd_mercado,
        probabilidade_real,
        valor_esperado,
        confianca

    } = valueBet;



    const resultado =
        await query(

            `
            INSERT INTO value_bets

            (
                jogo_id,
                mercado,
                odd_mercado,
                probabilidade_real,
                valor_esperado,
                confianca
            )

            VALUES

            (
                $1,$2,$3,$4,$5,$6
            )

            RETURNING *

            `,

            [

                jogo_id,
                mercado,
                odd_mercado,
                probabilidade_real,
                valor_esperado,
                confianca

            ]

        );


    return resultado.rows[0];

}



// ==================================================
// DASHBOARD
// ==================================================


export async function buscarDashboard(){

    const resultado =
        await query(

            `
            SELECT *

            FROM dashboard_status

            `

        );


    return resultado.rows[0];

}



// ==================================================
// EXPORT FINAL
// ==================================================

export default {

    listarCampeonatos,

    inserirCampeonato,

    listarTimes,

    inserirTime,

    listarJogosHoje,

    buscarJogoPorApiId,

    salvarAnalise,

    listarAnalises,

    salvarValueBet,

    buscarDashboard

};
