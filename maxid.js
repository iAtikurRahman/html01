require("dotenv").config();
const mysql = require('mysql2');
const exe_table_name = process.env.MYSQL_TABLE

const dbConfig = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

async function getMaxId() {
    const pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    try {
        const [rows, fields] = await pool.promise().query(`SELECT MAX(id) AS max_id FROM ${exe_table_name}`);
        const maxId = rows[0].max_id || 0;
        return maxId;
    } catch (error) {
        console.error('Error querying the database:', error.message);
        throw error;
    } finally {
        
    }
}

module.exports = getMaxId;
