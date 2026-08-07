// ==========================================
// BetVision AI
// services/oddsService.js
// Fase 3
// Motor de Odds Reais
// Neon PostgreSQL
// ==========================================


import db from "../database/database.js";



// ==========================================
// SALVAR ODDS
// ==========================================

export async function salvarOdd(odd){


    try{


        const resultado =

        await db.query(


        `

        INSERT INTO odds

        (

            partida_id,

            mercado,

            selecao,

            odd,

            casa_aposta,

            criado_em

        )


        VALUES

        (

            $1,

            $2,

            $3,

            $4,

            $5,

            CURRENT_TIMESTAMP

        )


        RETURNING *;

        `,


        [


            odd.partida_id,


            odd.mercado,


            odd.selecao,


            odd.odd,


            odd.casa_aposta


        ]);



        return resultado.rows[0];



    }

    catch(error){


        console.error(

            "❌ Erro salvar odd:",

            error.message

        );


        return null;


    }


}





// ==========================================
// BUSCAR ODDS POR PARTIDA
// ==========================================

export async function buscarOddsJogo(partida_id){


    try{


        const resultado =


        await db.query(


        `

        SELECT *

        FROM odds

        WHERE partida_id = $1

        ORDER BY odd DESC


        `,


        [


            partida_id


        ]);



        return resultado.rows || [];



    }


    catch(error){


        console.error(

            "❌ Erro buscar odds:",

            error.message

        );


        return [];


    }


}





// ==========================================
// LISTAR TODAS ODDS
// ==========================================

export async function listarOdds(){


    try{


        const resultado =


        await db.query(


        `

        SELECT *

        FROM odds

        ORDER BY criado_em DESC

        LIMIT 500


        `



        );



        return resultado.rows || [];



    }


    catch(error){


        console.error(

            "❌ Erro listar odds:",

            error.message

        );


        return [];


    }


}





// ==========================================
// BUSCAR MELHORES ODDS
// ==========================================

export async function melhoresOdds(){


    try{


        const resultado =


        await db.query(


        `

        SELECT *

        FROM odds

        ORDER BY odd DESC

        LIMIT 50


        `



        );



        return resultado.rows || [];



    }


    catch(error){


        console.error(

            "❌ Erro melhores odds:",

            error.message

        );


        return [];


    }


}





// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {


    salvarOdd,

    buscarOddsJogo,

    listarOdds,

    melhoresOdds


};
