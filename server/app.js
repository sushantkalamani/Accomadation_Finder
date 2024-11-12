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
        const [existingUsers] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
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
        const [users] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Save location endpoint
app.post('/save-location', async (req, res) => {
    const { latitude, longitude, name, address, description } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO locations (latitude, longitude, name, address, description) VALUES (?, ?, ?, ?, ?)',
            [latitude, longitude, name, address, description]
        );

        res.status(201).json({
            message: 'Location saved successfully!',
            id: result[0].insertId, // Extracting from the result of the query
            location: {
                latitude,
                longitude,
                name,
                address,
                description
            }
        });
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

// Get location details by ID
app.get('/get-location/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [location] = await db.query('SELECT * FROM locations WHERE id = ?', [id]);
        if (location.length === 0) {
            return res.status(404).json({ message: 'Location not found.' });
        }
        res.status(200).json(location[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the location.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
