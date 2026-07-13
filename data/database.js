import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function conectarBanco() {

    try {

        const client = await pool.connect();

        console.log("🐘 PostgreSQL conectado");

        client.release();

    } catch (erro) {

        console.error(erro);

    }

}

export default pool;
