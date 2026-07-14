import express from "express";
import db from "../database/database.js";


const router = express.Router();



/*
====================================
 VALUE BETS

 GET  -> Lista oportunidades salvas
 POST -> Calcula oportunidade de valor

====================================
*/



/*
====================================
 LISTAR VALUE BETS
====================================
*/


router.get("/", async (req,res)=>{


    try{


        const resultado = await db.query(

            `
            SELECT *

            FROM valuebets

            ORDER BY criado_em DESC

            `

        );



        res.json({


            total:
            resultado.rows.length,


            valuebets:
            resultado.rows


        });



    }

    catch(error){



        console.error(

            "Erro buscando Value Bets:",
            error

        );



        res.status(500).json({


            erro:
            "Erro ao buscar value bets",


            detalhe:
            error.message


        });



    }


});





/*
====================================
 CALCULADORA VALUE BET
====================================
*/


router.post("/", async(req,res)=>{


    try{


        const {

            oddMercado,

            probabilidade,

            jogo,

            mercado

        } = req.body;





        if(

            oddMercado === undefined ||

            probabilidade === undefined

        ){


            return res.status(400).json({


                erro:
                "Informe oddMercado e probabilidade"


            });


        }





        const odd =
        Number(oddMercado);



        const prob =
        Number(probabilidade);





        if(

            odd <= 0 ||

            prob <= 0 ||

            prob >= 1

        ){


            return res.status(400).json({


                erro:
                "Probabilidade deve estar entre 0 e 1 e odd maior que zero"


            });


        }






        /*
        ================================
        Cálculos
        ================================
        */


        const oddJusta =
        1 / prob;




        const valor =

        (

            (odd / oddJusta) - 1

        ) * 100;





        const oportunidade =
        valor > 5;







        /*
        ================================
        Salvar se for Value Bet
        ================================
        */


        if(oportunidade){


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


                jogo || "Jogo não informado",


                mercado || "Resultado Final",


                odd,


                Number(
                    oddJusta.toFixed(2)
                ),


                Number(
                    valor.toFixed(2)
                ),


                "Calculada"


            ]


            );


        }







        res.json({



            mercado:{


                jogo:
                jogo || null,


                tipo:
                mercado || "Resultado Final",


                oddMercado:
                odd,


                probabilidade:
                prob



            },



            analise:{



                oddJusta:

                Number(
                    oddJusta.toFixed(2)
                ),




                valorPercentual:

                Number(
                    valor.toFixed(2)
                ),




                oportunidade:

                oportunidade
                ? "SIM"
                : "NÃO"



            },



            modelo:

            "Probabilidade Estatística BetVision AI"



        });





    }


    catch(error){


        console.error(

            "Erro ValueBet:",
            error

        );



        res.status(500).json({


            erro:
            "Erro interno ao calcular Value Bet",


            detalhe:
            error.message


        });


    }


});





export default router;
