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

    // আইডিকে সবসময় নম্বরে পরিণত করা হচ্ছে
    const userId = parseInt(id); 
    const sql = "SELECT * FROM users WHERE telegram_id = ?";

    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (row) {
            // ব্যবহারকারী অ্যাডমিন কিনা তা প্রতিবার স্পষ্টভাবে যাচাই করা হচ্ছে
            row.is_admin = (userId === 8457318925) ? 1 : 0;
            res.json(row);
        } else {
            // নতুন ব্যবহারকারীর জন্য অ্যাডমিন স্ট্যাটাস সেট করা হচ্ছে
            const isAdmin = (userId === 8457318925) ? 1 : 0;
            const insert = 'INSERT INTO users (telegram_id, username, first_name, is_admin) VALUES (?,?,?,?)';
            db.run(insert, [userId, username, first_name, isAdmin], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                db.get(sql, [userId], (err, newUser) => {
                    if (newUser) {
                        newUser.is_admin = isAdmin;
                    }
                    res.status(201).json(newUser);
                });
            });
        }
    });
});

// ... (অন্যান্য API কোড অপরিবর্তিত)
// রিওয়ার্ড হিস্টরি দেওয়ার জন্য নতুন API এন্ডপয়েন্ট
app.get('/api/reward-history', (req, res) => {
    // এই মুহূর্তে আমরা একটি খালি তালিকা পাঠাচ্ছি।
    // ভবিষ্যতে আমরা এখানে ডেটাবেস থেকে আসল তথ্য পাঠানোর কোড লিখব।
    // আপাতত, 404 এররটি ঠিক করার জন্য এটিই যথেষ্ট।
    res.json([]); 
});
// --- অ্যাডমিন প্যানেলের SDK সেভ করার জন্য নতুন কোড ---

// SDK গুলো স্টোর করার জন্য একটি ভ্যারিয়েবল (বাস্তবে এটি ডেটাবেসে থাকা উচিত)
let adSdks = { ad1: '', ad2: '', ad3: '', ad4: '' };

// SDK আপডেট করার জন্য API
app.post('/api/admin/update-sdks', (req, res) => {
    // রিকোয়েস্টের body থেকে নতুন SDK গুলো নেওয়া হচ্ছে
    const { ad1, ad2, ad3, ad4 } = req.body;

    // ভ্যারিয়েবলে নতুন SDK গুলো সেভ করা হচ্ছে
    adSdks.ad1 = ad1 || '';
    adSdks.ad2 = ad2 || '';
    adSdks.ad3 = ad3 || '';
    adSdks.ad4 = ad4 || '';

    console.log('Updated SDKs:', adSdks); // সার্ভার কনসোলে লগ দেখানোর জন্য
    res.json({ success: true, message: 'SDKs updated successfully!' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


