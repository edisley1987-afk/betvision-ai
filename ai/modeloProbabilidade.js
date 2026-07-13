export function calcularProbabilidade(
    timeCasa,
    timeFora
){

    const forcaCasa =
    (
        timeCasa.ataque +
        timeCasa.defesa
    ) / 2;



    const forcaFora =
    (
        timeFora.ataque +
        timeFora.defesa
    ) / 2;



    const diferenca =
    forcaCasa - forcaFora;



    let casa =
    50 + (diferenca * 0.8);



    if(casa > 85)
        casa = 85;


    if(casa < 15)
        casa = 15;



    const empate =
    25;



    const fora =
    100 - casa - empate;



    return {

        casa:
        Number(casa.toFixed(2)),


        empate:
        Number(empate.toFixed(2)),


        fora:
        Number(fora.toFixed(2))

    };

}
