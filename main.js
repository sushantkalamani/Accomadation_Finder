

// Initialize the map and set its view
var map = L.map('map').setView([40.7128, -74.0060], 13);

// Load and display tile layer from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


let currentPin = null;

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
        .bindPopup('Saved Location')
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
  } else {
      alert('No location to save!');
  }
});


// ----sidebar

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

// Add a marker for each saved location with a click listener
savedLocations.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng]).addTo(map)
        .bindPopup('Saved Location')
        .on('click', () => openSidebar(loc)); // Open sidebar on marker click
});
