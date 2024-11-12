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

app.post('/save-location', async (req, res) => {
    try {
        const { lat, lng, name, address, rent, contact, rooms, bed } = req.body;

        // Validate input data
        if (!lat || !lng || !name || !address || !rent || !contact || !rooms || !bed) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Save location to the database
        const result = await db.query(
            'INSERT INTO locations (latitude, longitude, name, address, rent, contact, rooms, bed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [lat, lng, name, address, rent, contact, rooms, bed]
        );

        // Send back the saved location
        res.status(201).json({
            id: result.insertId,
            lat,
            lng,
            name,
            address,
            rent,
            contact,
            rooms,
            bed
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
        const [locations] = await db.query('SELECT * FROM locations WHERE id = ?', [id]);
        
        if (!locations || locations.length === 0) {
            return res.status(404).json({ message: 'Location not found.' });
        }

        // The details object is returned here, matching what is expected on the client-side
        const location = locations[0];
        res.status(200).json({
            id: location.id,
            name: location.name,
            address: location.address,
            rent: location.rent,
            contact: location.contact,
            rooms: location.rooms,
            bed: location.bed,
            latitude: location.latitude,
            longitude: location.longitude
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ message: 'An error occurred while fetching the location.', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
