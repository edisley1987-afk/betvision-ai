import express from "express";

const router = express.Router();


/*
====================================
 VALUE BETS
 Calcula oportunidades de valor
====================================
*/


// Teste da rota
router.get("/", (req, res) => {

    res.json({

        sistema: "BetVision AI",
        rota: "valuebets",
        status: "online"

    });

});



// Calculadora de Value Bet
router.post("/", (req, res) => {

    try {

        const {

            oddMercado,
            probabilidade

        } = req.body;



        // Validação

        if (
            !oddMercado ||
            !probabilidade
        ) {

            return res.status(400).json({

                erro: "Informe oddMercado e probabilidade"

            });

        }



        const odd = Number(oddMercado);
        const prob = Number(probabilidade);



        if (
            odd <= 0 ||
            prob <= 0 ||
            prob >= 1
        ) {

            return res.status(400).json({

                erro:
                "Probabilidade deve estar entre 0 e 1 e odd deve ser maior que zero"

            });

        }



        // Odd justa

        const oddJusta = 1 / prob;



        // Cálculo de valor

        const valor = (

            (odd / oddJusta) - 1

        ) * 100;



        res.json({

            mercado: {

                oddMercado: odd,

                probabilidade: prob

            },


            analise: {

                oddJusta:
                Number(
                    oddJusta.toFixed(2)
                ),


                valorPercentual:
                Number(
                    valor.toFixed(2)
                ),


                oportunidade:

                    valor > 5
                    ? "SIM"
                    : "NÃO"


            },


            modelo:

            "Probabilidade Estatística BetVision AI"


        });



    }

    catch(error) {


        console.error(
            "Erro ValueBet:",
            error
        );


        res.status(500).json({

            erro:
            "Erro interno ao calcular Value Bet"

        });


    }


});



export default router;
