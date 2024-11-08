const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Register endpoint (without password hashing)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username already exists. Please choose another.' });
        }

        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [user] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (user.length === 0) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Save Location endpoint
app.post('/save-location', async (req, res) => {
    const { latitude, longitude } = req.body;

    try {
        // Insert the location into the database
        await db.query('INSERT INTO locations (latitude, longitude) VALUES (?, ?)', [latitude, longitude]);
        res.status(201).json({ message: 'Location saved successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while saving the location.' });
    }
});

// Fetch all saved locations
app.get('/locations', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT latitude, longitude FROM locations');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching locations.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
