// ==========================================
// BetVision AI
// services/probabilidadesService.js
// Motor de Probabilidades
// ==========================================

function limitar(valor, min = 0, max = 100) {

    return Math.max(min, Math.min(max, valor));

}


// ==========================================
// CALCULAR PROBABILIDADE
// ==========================================

export function calcularProbabilidades({

    forcaCasa = 50,
    forcaFora = 50,
    vantagemCasa = 5

} = {}) {


    let casa =
        forcaCasa + vantagemCasa;


    let fora =
        forcaFora;


    let empate =
        100 - casa - fora;


    if(empate < 10){

        empate = 10;

    }


    const total =
        casa + empate + fora;


    return {

        casa:
            Number(
                ((casa / total) * 100)
                .toFixed(2)
            ),

        empate:
            Number(
                ((empate / total) * 100)
                .toFixed(2)
            ),

        fora:
            Number(
                ((fora / total) * 100)
                .toFixed(2)
            )

    };

}


// ==========================================
// COMPATIBILIDADE
// ==========================================

export function prob(){

    return calcularProbabilidades({

        forcaCasa:58,

        forcaFora:18

    });

}


// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {

    calcularProbabilidades,

    prob

};
