export function gerarRanking(
    apostas
){


    return apostas.sort(

        (a,b)=>

        b.valor -
        a.valor

    );


}
