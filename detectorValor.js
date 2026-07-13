export function detectarValor(
    oddMercado,
    probabilidade
){


    const oddJusta =
    1 / probabilidade;



    const valor =

    (
        oddMercado /
        oddJusta

    -1) * 100;



    return {


        oddJusta:

        Number(
            oddJusta.toFixed(2)
        ),



        valor:

        Number(
            valor.toFixed(2)
        ),



        oportunidade:

        valor >=5

        ? "VALUE BET"

        : "SEM VALOR"


    };


}
