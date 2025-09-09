const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./adreward.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    // FOREIGN KEY constraint গুলোকে আপাতত মুছে দেওয়া হয়েছে ক্র্যাশ এড়ানোর জন্য
    const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        balance REAL DEFAULT 0,
        ads_watched INTEGER DEFAULT 0,
        total_earned REAL DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    const createWithdrawalTable = `
    CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        account_number TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    const createRewardHistoryTable = `
    CREATE TABLE IF NOT EXISTS reward_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ad_id TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;
    
    db.run(createUserTable);
    db.run(createWithdrawalTable);
    db.run(createRewardHistoryTable);
    console.log("All tables created or already exist (resilient mode).");
}

module.exports = db;
