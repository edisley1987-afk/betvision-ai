import {
calcularProbabilidade
}
from "./modeloProbabilidade.js";


import {
preverGols
}
from "./previsaoGols.js";



export function analisarJogo(dados){


    const probabilidade =

    calcularProbabilidade(

        dados.timeCasa,

        dados.timeFora

    );



    const gols =

    preverGols(

        dados.mediaGolsCasa,

        dados.mediaGolsFora

    );



    return {


        jogo:

        `${dados.timeCasa.nome}
        x
        ${dados.timeFora.nome}`,



        probabilidade,


        gols,


        recomendacao:

        probabilidade.casa > 65

        ?

        "Casa Favorita"

        :

        "Jogo Equilibrado"


    };


}
