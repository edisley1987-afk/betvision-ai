import axios from "axios";

const API_KEY = process.env.THESPORTSDB_API_KEY;

export async function buscarJogosReais() {

    try {

        if (!API_KEY) {
            console.warn("THESPORTSDB_API_KEY não configurada.");
            return [];
        }

        const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnextleague.php?id=4328`;

        const resposta = await axios.get(url);

        return resposta.data.events || [];

    } catch (erro) {

        console.error("Erro ao buscar jogos no TheSportsDB:", erro.message);

        return [];

    }

}
