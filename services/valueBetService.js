eimport db from "../database/database.js";


export async function calcularValueBet(jogo, analise, odds){


    const probabilidade =
    analise.probabilidadeCasa / 100;


    const oddMercado =
    odds.mercado.vencedor.casa;



    const oddJusta =
    1 / probabilidade;



    const valor =
    ((oddMercado / oddJusta) - 1) * 100;



    const resultado = {


        jogo:


        analise.jogo,


        mercado:

        "Vitória Casa",


        oddMercado,


        oddJusta:
        Number(oddJusta.toFixed(2)),


        valorPercentual:
        Number(valor.toFixed(2)),


        confianca:
        analise.confianca


    };



    if(valor > 5){


        await db.query(

        `
        INSERT INTO valuebets

        (
            jogo,
            mercado,
            odd_mercado,
            odd_justa,
            valor_percentual,
            confianca
        )

        VALUES
        ($1,$2,$3,$4,$5,$6)

        `,


        [

            resultado.jogo,

            resultado.mercado,

            resultado.oddMercado,

            resultado.oddJusta,

            resultado.valorPercentual,

            resultado.confianca

        ]);


        resultado.valueBet = true;


    }
    else {


        resultado.valueBet = false;


    }



    return resultado;


}
