const mysql = require('mysql2');

// Database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'loveyouharmeekoo',
    database: 'university_db'
}).promise();

module.exports = db