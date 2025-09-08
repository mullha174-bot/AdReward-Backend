const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./adreward.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            telegram_id INTEGER UNIQUE,
            username TEXT,
            first_name TEXT,
            balance REAL DEFAULT 0,
            ads_watched INTEGER DEFAULT 0,
            total_earned REAL DEFAULT 0,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`;
        db.run(createUserTable);
    }
});
module.exports = db;