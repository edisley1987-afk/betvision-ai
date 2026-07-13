import db from "../database/database.js";

/*
====================================
 LISTAR CAMPEONATOS
====================================
*/

export async function listarCampeonatos() {

    try {

        const resultado = await db.query(`
            SELECT
                id,
                nome,
                pais,
                continente,
                temporada
            FROM campeonatos
            ORDER BY nome
        `);

        return resultado.rows;

    } catch (erro) {

        console.error("Erro ao listar campeonatos:", erro);

        return [];

    }

}

/*
====================================
 INSERIR CAMPEONATO
====================================
*/

export async function inserirCampeonato(dados) {

    try {

        const resultado = await db.query(
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
            ($1,$2,$3,$4,$5)
            ON CONFLICT (id)
            DO UPDATE SET
                nome = EXCLUDED.nome,
                pais = EXCLUDED.pais,
                continente = EXCLUDED.continente,
                temporada = EXCLUDED.temporada
            RETURNING id;
            `,
            [
                dados.id,
                dados.nome,
                dados.pais,
                dados.continente || "",
                dados.temporada || "2026"
            ]
        );

        return resultado.rows[0];

    } catch (erro) {

        console.error("Erro ao inserir campeonato:", erro);
        throw erro;

    }

}

/*
====================================
 BUSCAR CAMPEONATO
====================================
*/

export async function buscarCampeonato(id) {

    try {

        const resultado = await db.query(
            `
            SELECT *
            FROM campeonatos
            WHERE id=$1
            `,
            [id]
        );

        return resultado.rows[0] || null;

    } catch (erro) {

        console.error("Erro ao buscar campeonato:", erro);
        return null;

    }

}

/*
====================================
 REMOVER CAMPEONATO
====================================
*/

export async function removerCampeonato(id) {

    try {

        await db.query(
            `
            DELETE FROM campeonatos
            WHERE id=$1
            `,
            [id]
        );

        return true;

    } catch (erro) {

        console.error("Erro ao remover campeonato:", erro);
        return false;

    }

}
