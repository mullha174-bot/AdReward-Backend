const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
const port = process.env.PORT || 3000;

// আপনার দেওয়া অ্যাডমিন আইডি এখানে সেট করা আছে
const ADMIN_TELEGRAM_ID = 8457318925; 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AdReward Backend Server is running!');
});

app.post('/api/user', (req, res) => {
    const { id, username, first_name } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const sql = "SELECT * FROM users WHERE telegram_id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        if (row) {
            if (row.telegram_id === ADMIN_TELEGRAM_ID) {
                row.is_admin = 1;
            }
            res.json(row);
        } else {
            const isAdmin = (id === ADMIN_TELEGRAM_ID) ? 1 : 0;
            const insert = 'INSERT INTO users (telegram_id, username, first_name, is_admin) VALUES (?,?,?,?)';
            db.run(insert, [id, username, first_name, isAdmin], function (err) {
                if (err) { return res.status(500).json({ error: err.message }); }
                db.get(sql, [id], (err, newUser) => {
                    res.status(201).json(newUser);
                });
            });
        }
    });
});

// ... (অন্যান্য API কোড অপরিবর্তিত)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});