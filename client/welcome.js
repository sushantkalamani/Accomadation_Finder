// Initialize the map and set its view
var map = L.map('map').setView([17.6599, 75.9064], 13);

// Load and display tile layer from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentPin = null;
let isRegistering = false;
let selectedLocation = null;
let markers = [];

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
            .on('click', () => openSidebar(loc));
        markers.push(marker);
    });
}

// Function to open the sidebar with location details
function openSidebar(location) {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('active');
    document.getElementById('locationInfo').textContent = `Latitude: ${location.lat}, Longitude: ${location.lng}`;
}

// Function to close the sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('active');
}

// Close the sidebar if clicked outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.contains(event.target) && !event.target.matches('.leaflet-marker-icon')) {
        closeSidebar();
    }
});

// Function to disable pinning
function disablePinning() {
    map.off('click');
}

// Function to enable pinning
function enablePinning() {
    map.on('click', function(e) {
        if (currentPin) {
            map.removeLayer(currentPin);
        }

        const { lat, lng } = e.latlng;
        selectedLocation = { lat, lng };
        currentPin = L.marker([lat, lng]).addTo(map)
            .bindPopup('New Location')
            .openPopup();
    });
}

// Add a click event listener to the register home button
document.getElementById('registerHomeBtn').addEventListener('click', function() {
    isRegistering = !isRegistering;
    const sidebar = document.getElementById('sidebar');

    if (isRegistering) {
        alert('Pinning is now enabled. Click on the map to select a location.');
        enablePinning();
        sidebar.style.display = 'block';
    } else {
        alert('Pinning is now disabled. Click on saved locations to view details.');
        disablePinning();
        sidebar.style.display = 'none';
        markers.forEach(marker => map.removeLayer(marker));
        addSavedMarkers();
    }
});

// Handle form submission to save details and location
document.getElementById('detailsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!name || !address) {
        alert('Name and Address are required fields.');
        return;
    }

    fetch('/save-location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            name: name,
            address: address,
            description: description
        })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        alert('Location saved!');
        closeSidebar();
        addMarkerToMap(data);
        saveLocationToStorage({ lat: data.lat, lng: data.lng, name, address, description });
    }).catch(error => {
        alert('There was a problem saving the location: ' + error.message);
    });
});


// Function to add a marker to the map
function addMarkerToMap(data) {
    let marker = L.marker([data.lat, data.lng]).addTo(map);
    marker.bindPopup(`<strong>${data.name}</strong><br>${data.address}<br>${data.description}`);
    
    marker.on('click', function() {
        fetch(`/get-location/${data.id}`)
            .then(response => response.json())
            .then(details => {
                openSidebar(details);
                document.getElementById('name').value = details.name;
                document.getElementById('address').value = details.address;
                document.getElementById('description').value = details.description;
            });
    });
    markers.push(marker);
}




// Initialize saved markers on page load
addSavedMarkers();


// btnsavelocation
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