import fs from "fs";

const CAMINHO = "./data/jogos.json";

export function listarJogos() {

    if (!fs.existsSync(CAMINHO)) {

        return [];

    }

    const dados = fs.readFileSync(CAMINHO);

    return JSON.parse(dados);

}
