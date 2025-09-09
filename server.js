const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
const port = process.env.PORT || 3000;

const ADMIN_TELEGRAM_ID = 8457318925; 

// Updated CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- User Routes ---
app.get('/', (req, res) => {
    res.send('AdReward Backend Server is running!');
});

app.post('/api/user', (req, res) => {
    const { id, username, first_name } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID is required' });
    const userId = parseInt(id); 
    const sql = "SELECT * FROM users WHERE telegram_id = ?";
    db.get(sql, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            row.is_admin = (userId === ADMIN_TELEGRAM_ID) ? 1 : 0;
            res.json(row);
        } else {
            const isAdmin = (userId === ADMIN_TELEGRAM_ID) ? 1 : 0;
            const insert = 'INSERT INTO users (telegram_id, username, first_name, is_admin) VALUES (?,?,?,?)';
            db.run(insert, [userId, username, first_name, isAdmin], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                db.get(sql, [userId], (err, newUser) => {
                    if (newUser) newUser.is_admin = isAdmin;
                    res.status(201).json(newUser);
                });
            });
        }
    });
});

app.post('/api/watch-ad', (req, res) => {
    const { user_id, ad_id } = req.body;
    if (!user_id || !ad_id) return res.status(400).json({ error: 'User ID and Ad ID are required' });
    const reward = 0.0005;
    const userId = parseInt(user_id);
    const updateUserSql = `UPDATE users SET balance = balance + ?, ads_watched = ads_watched + 1, total_earned = total_earned + ? WHERE telegram_id = ?`;
    db.run(updateUserSql, [reward, reward, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const insertHistorySql = `INSERT INTO reward_history (user_id, ad_id, amount) VALUES (?, ?, ?)`;
        db.run(insertHistorySql, [userId, ad_id, reward], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save reward history' });
            db.get("SELECT balance FROM users WHERE telegram_id = ?", [userId], (err, user) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, reward: reward, balance: user.balance });
            });
        });
    });
});

app.get('/api/reward-history', (req, res) => {
    const userId = parseInt(req.query.user_id);
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    const sql = "SELECT ad_id, amount, created_at FROM reward_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20";
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/leaderboard', (req, res) => {
    const sql = "SELECT first_name, username, total_earned FROM users WHERE is_admin = 0 ORDER BY total_earned DESC LIMIT 50";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Admin Routes ---
let adSdks = { ad1: '', ad2: '', ad3: '', ad4: '' };

const isAdmin = (req, res, next) => {
    const authUserId = parseInt(req.query.user_id || req.body.user_id);
    if (authUserId && authUserId === ADMIN_TELEGRAM_ID) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
};

app.get('/api/admin/sdks', isAdmin, (req, res) => {
    res.json(adSdks);
});

app.post('/api/admin/update-sdks', isAdmin, (req, res) => {
    const { ad1, ad2, ad3, ad4 } = req.body;
    adSdks = { ad1, ad2, ad3, ad4 };
    res.json({ success: true, message: 'SDKs updated successfully' });
});

app.get('/api/admin/stats', isAdmin, (req, res) => {
    const q1 = "SELECT COUNT(*) as total_users FROM users WHERE is_admin = 0";
    const q2 = "SELECT SUM(ads_watched) as total_ads_watched FROM users";
    Promise.all([
        new Promise((resolve, reject) => db.get(q1, (err, row) => err ? reject(err) : resolve(row))),
        new Promise((resolve, reject) => db.get(q2, (err, row) => err ? reject(err) : resolve(row)))
    ]).then(results => {
        res.json({ total_users: results[0].total_users, total_ads_watched: results[1].total_ads_watched });
    }).catch(err => res.status(500).json({ error: err.message }));
});

// এই নতুন API টি যোগ করা হয়েছে
app.get('/api/admin/withdrawal-requests', isAdmin, (req, res) => {
    const sql = `SELECT w.id, w.user_id, w.amount, w.method, w.account_number, w.status, w.created_at, u.username 
                 FROM withdrawals w JOIN users u ON u.telegram_id = w.user_id 
                 WHERE w.status = 'pending' 
                 ORDER BY w.created_at ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
