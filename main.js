
 // Approximate geographic limits of South Carolina
const scBounds = L.latLngBounds(
    [32.0, -83.5], // Southwest
    [35.3, -78.3]  // Northeast
);

// Initialize the map
const map = L.map("map", {
    maxBounds: scBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 7,
    maxZoom: 18
});

// Set the initial view
map.fitBounds(scBounds);

// Add the map tiles
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    bounds: scBounds,
    noWrap: true,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
