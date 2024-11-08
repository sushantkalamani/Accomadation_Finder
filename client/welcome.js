let map;
let currentMarker;
let savedMarkers = [];

document.addEventListener("DOMContentLoaded", () => {
    // Initialize the map
    map = L.map('map').setView([51.505, -0.09], 13); // Default location (London)
    
    // Set up the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Load and display saved locations from the database
    loadSavedLocations();

    // Event listener for adding a marker on map click
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;

        // Remove existing marker if any
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        // Add a new marker at the clicked location
        currentMarker = L.marker([lat, lng]).addTo(map);
        currentMarker.bindPopup(`Latitude: ${lat}, Longitude: ${lng}`).openPopup();
    });
});

// Fetch and display saved locations
async function loadSavedLocations() {
    try {
        const response = await fetch('http://localhost:3000/locations');
        const locations = await response.json();

        // Clear any existing markers before adding new ones
        savedMarkers.forEach(marker => map.removeLayer(marker));
        savedMarkers = [];

        // Add markers for each saved location
        locations.forEach(location => {
            const marker = L.marker([location.latitude, location.longitude]).addTo(map);
            marker.bindPopup(`Latitude: ${location.latitude}, Longitude: ${location.longitude}`);
            savedMarkers.push(marker); // Store the marker to clear later if needed
        });
    } catch (error) {
        console.error("Failed to load saved locations:", error);
    }
}

// Save the location of the marker to the server
async function saveLocation() {
    if (!currentMarker) {
        alert("Please add a pin on the map first.");
        return;
    }

    const { lat, lng } = currentMarker.getLatLng();
    
    try {
        const response = await fetch('http://localhost:3000/save-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng })
        });

        const result = await response.json();
        alert(result.message);

        // Reload saved locations to reflect the newly saved pin in real-time
        if (response.ok) {
            loadSavedLocations();
        }
    } catch (error) {
        console.error("Failed to save location:", error);
    }
}

function logout() {
    window.location.href = "index.html";
}
