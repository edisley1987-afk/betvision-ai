export function preverGols(
    mediaCasa,
    mediaFora
){


    const esperado =

    (
        mediaCasa +
        mediaFora

    ) / 2;



    return {


        golsEsperados:

        Number(
            esperado.toFixed(2)
        ),



        over25:

        esperado >= 2.5
        ? "SIM"
        : "NÃO",



        ambasMarcam:

        mediaCasa > 0.8 &&
        mediaFora > 0.8

        ? "SIM"
        : "NÃO"


    };


}
