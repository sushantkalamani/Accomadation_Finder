// Initialize the map and set its view
var map = L.map('map').setView([17.6599, 75.9064], 13);

// Load and display tile layer from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentPin = null;
let isRegistering = false; // Flag to track registration state

// Function to save the current pinned location to local storage
function saveLocationToStorage(location) {
    const savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
    savedLocations.push(location);
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
}

// Retrieve saved locations from local storage and add them to the map
const savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

// Function to add markers for saved locations
function addSavedMarkers() {
    savedLocations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng]).addTo(map)
            .bindPopup('Saved Location')
            .on('click', () => openSidebar(loc)); // Open sidebar on marker click
    });
}

// Add a click event listener to the save button
document.getElementById('saveLocationBtn').addEventListener('click', function() {
    if (currentPin) {
        const location = currentPin.getLatLng();
        saveLocationToStorage({ lat: location.lat, lng: location.lng });

        // Immediately add the saved location to the map
        L.marker([location.lat, location.lng]).addTo(map)
            .bindPopup('Saved Location')
            .on('click', () => openSidebar({ lat: location.lat, lng: location.lng })); // Added click event for sidebar

        alert('Location saved!');

        // Reset currentPin to allow for a new selection
        currentPin = null;

        // Disable pinning after saving
        if (isRegistering) {
            disablePinning();
        }
    } else {
        alert('No location to save!');
    }
});

// ---- Sidebar ----

// Reference to the sidebar
const sidebar = document.getElementById('sidebar');
const locationInfo = document.getElementById('locationInfo');

// Function to open the sidebar with location details
function openSidebar(location) {
    sidebar.classList.add('active');
    locationInfo.textContent = `Latitude: ${location.lat}, Longitude: ${location.lng}`;
}

// Function to close the sidebar
function closeSidebar() {
    sidebar.classList.remove('active');
}

// Close the sidebar if clicked outside (optional)
document.addEventListener('click', function(event) {
    if (!sidebar.contains(event.target) && !event.target.matches('.leaflet-marker-icon')) {
        closeSidebar();
    }
});

// Function to disable pinning
function disablePinning() {
    map.off('click'); // Remove the click event listener for pinning
}

// Function to enable pinning
function enablePinning() {
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
}

// Add a click event listener to the register home button
document.getElementById('registerHomeBtn').addEventListener('click', function() {
    isRegistering = !isRegistering; // Toggle registration state

    if (isRegistering) {
        alert('Pinning is now disabled. Click on saved locations to view details.');
        disablePinning(); // Disable pinning
        // Clear the map and show only saved markers
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker && !savedLocations.find(loc => loc.lat === layer.getLatLng().lat && loc.lng === layer.getLatLng().lng)) {
                map.removeLayer(layer); // Remove all non-saved markers
            }
        });
        addSavedMarkers(); // Add saved markers to the map
    } else {
        alert('Pinning is now enabled. You can place new pins on the map.');
        enablePinning(); // Clear the map and show all markers including new pins
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer); // Remove all markers
            }
        });
        addSavedMarkers(); // Re-add saved markers to the map
    }
});

// Initialize the map with saved markers
addSavedMarkers();