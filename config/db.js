
const mysql = require('mysql2');
require('dotenv').config(); 
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0
});

// Teste de conexão 
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('DATABASE_CONNECTION_WAS_CLOSED');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('DATABASE_HAS_TOO_MANY_CONNECTIONS');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('DATABASE_CONNECTION_WAS_REFUSED');
        }
        
        console.error('ERRO AO CONECTAR COM O BANCO DE DADOS:', err);
        return;
    }
    if (connection) {
        connection.release(); // Libera a conexão de volta para o pool
        console.log('Conectado ao banco de dados MySQL com sucesso!');
    }
    return;
});

// Exporta o pool para ser usado em outras partes da aplicação
// Usar .promise() permite que você use async/await com as queries do banco
module.exports = pool.promise();