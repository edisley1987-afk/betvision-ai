import express from "express";

const router = express.Router();



/*
 Calcula oportunidades de valor
*/

router.post("/",(req,res)=>{


    const {

        oddMercado,

        probabilidade

    } = req.body;



    const oddJusta = 1 / probabilidade;


    const valor = (

        (oddMercado / oddJusta) - 1

    ) * 100;



    res.json({

        oddMercado,

        oddJusta:Number(oddJusta.toFixed(2)),

        valorPercentual:Number(valor.toFixed(2)),


        oportunidade:

            valor > 5 ? "SIM":"NÃO"


    });



});


export default router;
