// Initialize the map and set its view
var map = L.map('map').setView([40.7128, -74.0060], 13);

// Load and display tile layer from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variable to hold the current pin
let currentPin = null;

// Function to get the address for a location using reverse geocoding
async function getAddress(lat, lng) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await response.json();
    return data.display_name || 'Unknown address';
}

// Function to save the current pinned location to local storage
function saveLocationToStorage(location) {
    const savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
    savedLocations.push(location);
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
}

// Retrieve saved locations from local storage and add them to the map
const savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

// Add a marker for each saved location
savedLocations.forEach(loc => {
    L.marker([loc.lat, loc.lng]).addTo(map)
        .bindPopup(`Saved Location: ${loc.address || 'No address saved'}`)
        .openPopup();
});

// Add a click event listener to the map to place a new pin
map.on('click', function(e) {
    // Remove the existing pin if it exists
    if (currentPin) {
        map.removeLayer(currentPin);
    }

    const { lat, lng } = e.latlng;
    currentPin = L.marker([lat, lng]).addTo(map)
        .bindPopup('New Location')
        .openPopup();
});

// Add a click event listener to the save button
document.getElementById('saveLocationBtn').addEventListener('click', async function() {
    if (currentPin) {
        const location = currentPin.getLatLng();
        const address = await getAddress(location.lat, location.lng); // Get address
        saveLocationToStorage({ lat: location.lat, lng: location.lng, address: address });
        
        // Immediately add the saved location with the address to the map
        L.marker([location.lat, location.lng]).addTo(map)
            .bindPopup(`Saved Location: ${address}`)
            .openPopup();
        
        alert('Location and address saved!');
        
        currentPin = null; // Reset currentPin to allow for a new selection
    } else {
        alert('No location to save!');
    }
});
