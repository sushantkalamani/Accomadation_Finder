const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Nikhil3254@',
    database: 'user_db'
});

module.exports = pool.promise();