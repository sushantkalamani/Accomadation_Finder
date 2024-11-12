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

// *Function to add markers for saved locations
function addSavedMarkers() {
    savedLocations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng]).addTo(map);
        marker.on('click', () => openModalWithDetails(loc));
        markers.push(marker);
    });
}

// popup
// Function to open the modal and populate it with location details
function openModalWithDetails(location) {
    document.getElementById('modalName').textContent = location.name;
    document.getElementById('modalAddress').textContent = location.address;
    document.getElementById('modalRent').textContent = location.rent;
    document.getElementById('modalContact').textContent = location.contact;
    document.getElementById('modalRooms').textContent = location.rooms;
    document.getElementById('modalBed').textContent = location.bed;
    
    // Display the modal
    document.getElementById('infoModal').style.display = 'block';
}

// Close the modal when the user clicks the "X" button
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('infoModal').style.display = 'none';
});

// Optional: Close the modal when clicking outside the modal content
window.addEventListener('click', function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Function to open the register bar with location details
function openregisterbar(location) {
    const registerbar = document.getElementById('registerbar');
    registerbar.classList.add('active');
    document.getElementById('locationInfo').textContent = `Latitude: ${location.lat}, Longitude: ${location.lng}`;
}

// Function to close the register bar
function closeregisterbar() {
    const registerbar = document.getElementById('registerbar');
    registerbar.classList.remove('active');
}

// Close the register bar if clicked outside
document.addEventListener('click', function(event) {
    const registerbar = document.getElementById('registerbar');
    if (!registerbar.contains(event.target) && !event.target.matches('.leaflet-marker-icon')) {
        closeregisterbar();
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
    const registerbar = document.getElementById('registerbar');

    if (isRegistering) {
        alert('Pinning is now enabled. Click on the map to select a location.');
        enablePinning();
        registerbar.style.display = 'block';
    } else {
        alert('Pinning is now disabled. Click on saved locations to view details.');
        disablePinning();
        registerbar.style.display = 'none';
        markers.forEach(marker => map.removeLayer(marker));
        addSavedMarkers();
    }
});


// Function to add a marker to the map
function addMarkerToMap(data) {
    let marker = L.marker([data.lat, data.lng]).addTo(map);
    marker.bindPopup(`<strong>${data.name}</strong><br>${data.address}<br>Rent: ${data.rent}`);

    marker.on('click', function() {
        fetch(`http://localhost:3000/get-location/${data.id}`)
            .then(response => response.json())
            .then(details => {
                openregisterbar(details);
                document.getElementById('name').value = details.name;
                document.getElementById('address').value = details.address;
                document.getElementById('rent').value = details.rent;
                document.getElementById('contact').value = details.contact;
                document.getElementById('rooms').value = details.rooms;
                document.getElementById('bed').value = details.bed;
            });
    });
    markers.push(marker);
}

// Initialize saved markers on page load
addSavedMarkers();

// Save location button click event
document.getElementById('saveLocationBtn').addEventListener('click', async function() {
    if (!selectedLocation) {
        alert('Please select a location on the map first!');
        return;
    }

    // Retrieve the form input values
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const rent = document.getElementById('rent').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const rooms = document.getElementById('rooms').value.trim();
    const bed = document.getElementById('bed').value.trim();

    // Validate required fields
    if (!name || !address || !rent || !contact || !rooms || !bed) {
        alert('All fields are required.');
        return;
    }

    // Prepare the location data to be sent to the server
    const locationData = {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        name: name,
        address: address,
        rent: rent,
        contact: contact,
        rooms: rooms,
        bed: bed
    };
    console.log(locationData.lat);
    console.log(locationData.lng);

    try {
        // Send the location data to the server via a POST request
        const response = await fetch('http://localhost:3000/save-location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(locationData)
        });

        // Handle server response
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        alert('Location saved successfully!');

        // Close the register bar
        closeregisterbar();

        // Add the new location to local storage
        saveLocationToStorage({
            ...locationData,
            id: data.id // Add the ID from the server response
        });

        // Add the new marker to the map with the correct details
        addMarkerToMap(data);

    } catch (error) {
        console.error('Error saving location:', error);
        alert('There was a problem saving the location: ' + error.message);
    }
});

// Search functionality
document.getElementById('searchButton').addEventListener('click', function() {
    const location = document.getElementById('locationSearch').value.trim();
    if (location) {
        // Fetch coordinates from Nominatim Geocoding API
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
            .then(response => response.json())
            .then(data => {
                if (data.length) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;
                    map.setView([lat, lon], 13);
                } else {
                    alert('Location not found!');
                }
            })
            .catch(error => {
                alert('Error searching location: ' + error.message);
            });
    }
});
