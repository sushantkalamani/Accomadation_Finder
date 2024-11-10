const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Register endpoint (without password hashing)
app.post('http://localhost:3000/register', async (req, res) => {
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
app.post('http://localhost:3000/login', async (req, res) => {
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

app.post('http://localhost:3000/save-location', async (req, res) => {
    const { latitude, longitude, name, address, description } = req.body;

    try {
        // Insert the location into the database with additional fields
        const result = await db.query(
            'INSERT INTO locations (latitude, longitude, name, address, description) VALUES (?, ?, ?, ?, ?)',
            [latitude, longitude, name, address, description]
        );

        // Respond with the ID of the newly created location
        res.status(201).json({ 
            message: 'Location saved successfully!', 
            id: result.insertId, // Assuming result.insertId contains the ID of the new record
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
app.get('http://localhost:3000/locations', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT latitude, longitude FROM locations');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching locations.' });
    }
});

// Get location details by ID
app.get('http://localhost:3000/get-location/:id', async (req, res) => {
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
