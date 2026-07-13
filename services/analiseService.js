import fs from "fs";

const CAMINHO = "./data/analises.json";

// Lista todas as análises
export function listarAnalises() {
    try {
        if (!fs.existsSync(CAMINHO)) {
            return [];
        }

        const dados = fs.readFileSync(CAMINHO, "utf8");

        return JSON.parse(dados);

    } catch (erro) {

        console.error("Erro ao carregar análises:", erro);

        return [];
    }
}

// Busca análise por ID
export function buscarAnalise(id) {

    const lista = listarAnalises();

    return lista.find(jogo => jogo.id == id);

}

// Lista apenas Value Bets
export function listarValueBets() {

    return listarAnalises().filter(jogo => jogo.valueBet);

}

// Estatísticas do Dashboard
export function estatisticasDashboard() {

    const jogos = listarAnalises();

    const valueBets = jogos.filter(j => j.valueBet);

    let somaConfianca = 0;

    jogos.forEach(jogo => {

        somaConfianca += jogo.confianca;

    });

    return {

        jogosHoje: jogos.length,

        valueBets: valueBets.length,

        confiancaMedia: jogos.length
            ? Math.round(somaConfianca / jogos.length)
            : 0,

        roi: 18.5

    };

}
