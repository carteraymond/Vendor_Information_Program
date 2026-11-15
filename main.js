

// Get the API key from the local configuration file
const accessToken = ARCGIS_API_KEY;

// Approximate geographic boundaries of South Carolina
const scBounds = L.latLngBounds(
    [32.0, -83.5], // Southwest
    [35.3, -78.3]  // Northeast
);

// Create the Leaflet map
const map = L.map("map", {
    maxBounds: scBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 7,
    maxZoom: 18
});

map.fitBounds(scBounds);

// Load the ArcGIS Streets basemap
L.esri.Vector.vectorBasemapLayer("arcgis/streets", {
    token: accessToken
}).addTo(map);


// Group used to display and filter vendor markers
const vendorLayer = L.layerGroup().addTo(map);

// Store vendor information with its corresponding marker
const vendorMarkers = [];

// Project location and its map marker
let projectLocation = null;
let projectMarker = null;

// Lines connecting the project to the nearest vendors
const nearestVendorLines = L.layerGroup().addTo(map);

// Prevent calculations using an incomplete vendor list
let vendorsLoaded = false;


// Request coordinates for a vendor's street address
async function geocodeAddress(address) {
    const apiUrl =
        "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

    const params = new URLSearchParams({
        singleLine: address,
        f: "json",
        token: accessToken,
        maxLocations: "1",
        outSR: "4326",
        outFields: "Addr_type",
        forStorage: "false"
    });

    const response = await fetch(`${apiUrl}?${params}`);

    if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    // ArcGIS can return an error inside a successful HTTP response
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.candidates[0] ?? null;
}

// Create the information displayed when a vendor is clicked
function createVendorPopup(vendor, locationStatus) {
    const popup = document.createElement("div");

    const heading = document.createElement("h3");
    heading.textContent = vendor.name;

    const address = document.createElement("p");
    address.textContent = vendor.address || 
        `${vendor.city}, ${vendor.state}`;

    const trades = document.createElement("p");
    trades.textContent =
        `Trades: ${vendor.trades.join(", ")}`;

    const status = document.createElement("p");
    status.textContent = `Location: ${locationStatus}`;

    popup.append(heading, address, trades, status);

    return popup;
}

// Read vendors.json, geocode addresses, and create markers
async function loadVendors() {
    vendorsLoaded = false;

    const resultPanel = document.getElementById("vendor-result");
    resultPanel.textContent = "Loading vendor locations...";

    try {
        const response = await fetch("./vendors.json");

        if (!response.ok) {
            throw new Error("Unable to load vendors.json");
        }

        const vendors = await response.json();

        console.log(`Loaded ${vendors.length} vendors`);

        // Build the trade checkboxes using the vendor data
        populateTradeFilter(vendors);

        // Process vendors one at a time
        for (const vendor of vendors) {

            // Start with the approximate coordinates from JSON
            let latitude = Number(vendor.latitude);
            let longitude = Number(vendor.longitude);
            let locationStatus = "Approximate location";

            try {
                if (vendor.address) {
                    const result = await geocodeAddress(vendor.address);

                    // High confidence does not guarantee a quarry entrance
                    if (
                        result &&
                        result.score >= 90 &&
                        ["PointAddress", "StreetAddress"]
                            .includes(result.attributes?.Addr_type)
                    ) {
                        latitude = result.location.y;
                        longitude = result.location.x;
                        locationStatus = "ArcGIS address match";
                    }

                    console.log(vendor.name, {
                        score: result?.score ?? null,
                        matchType: result?.attributes?.Addr_type,
                        locationStatus
                    });
                }

            } catch (error) {
                // Keep the approximate location if geocoding fails
                console.warn(
                    `Geocoding failed for ${vendor.name}:`,
                    error
                );
            }

            // Skip vendors without usable coordinates
            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude) ||
                latitude < -90 || latitude > 90 ||
                longitude < -180 || longitude > 180
            ) {
                console.warn(
                    `Invalid coordinates for ${vendor.name}`
                );
                continue;
            }

            // Create marker using the best available coordinates
            const marker = L.marker([latitude, longitude], {
                bubblingMouseEvents: false
            });

            marker.bindPopup(
                createVendorPopup(vendor, locationStatus)
            );

            // Store vendor data alongside its marker for filtering
            vendorMarkers.push({
                vendor: vendor,
                marker: marker,
                locationStatus: locationStatus
            });

            marker.addTo(vendorLayer);
        }

        vendorsLoaded = true;

        // Update the map after all locations finish loading
        updateResults();

        if (!projectLocation) {
            resultPanel.textContent =
                "Select the required trades and click the map to set a project location.";
        }

        console.log(
            `Finished processing ${vendorMarkers.length} vendor markers.`
        );

    } catch (error) {
        console.error("Error loading vendors:", error);

        resultPanel.textContent =
            "Unable to load vendor data. Check the console.";
    }
}

// Generate checkboxes from the trades in vendors.json
function populateTradeFilter(vendors) {
    const container = document.getElementById("trade-options");

    container.replaceChildren();

    // Combine all trades and remove duplicate names
    const allTrades = vendors.flatMap(vendor => vendor.trades);
    const uniqueTrades = [...new Set(allTrades)].sort();

    uniqueTrades.forEach(trade => {
        const label = document.createElement("label");
        label.className = "trade-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = trade;
        checkbox.className = "trade-checkbox";
        checkbox.checked = true;

        const text = document.createElement("span");
        text.textContent = trade;

        label.append(checkbox, text);
        container.appendChild(label);
    });
}


// Return an array containing all selected trades
function getSelectedTrades() {
    const checkboxes = document.querySelectorAll(
        ".trade-checkbox:checked"
    );

    return Array.from(
        checkboxes,
        checkbox => checkbox.value
    );
}


// Show vendors that offer at least one selected trade
function filterVendors() {
    const selectedTrades = getSelectedTrades();

    vendorLayer.clearLayers();

    vendorMarkers.forEach(item => {
        const matches = item.vendor.trades.some(
            trade => selectedTrades.includes(trade)
        );

        if (matches) {
            item.marker.addTo(vendorLayer);
        }
    });
}

// Find the nearest matching vendor for each selected trade
function findNearestVendor() {
    const resultPanel = document.getElementById("vendor-result");
    const selectedTrades = getSelectedTrades();

    // Remove old lines and results before recalculating
    nearestVendorLines.clearLayers();
    resultPanel.replaceChildren();

    if (!projectLocation) {
        resultPanel.textContent =
            "Click the map to select a project location.";
        return;
    }

    if (!vendorsLoaded) {
        resultPanel.textContent =
            "Loading vendor locations...";
        return;
    }

    if (selectedTrades.length === 0) {
        resultPanel.textContent =
            "Please select at least one trade.";
        return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Closest Vendors by Trade";
    resultPanel.appendChild(heading);

    const resultList = document.createElement("ul");

    // Each trade gets its own nearest-vendor calculation
    selectedTrades.forEach(trade => {
        let closestVendor = null;
        let shortestDistance = Infinity;

        vendorMarkers.forEach(item => {

            // Ignore vendors that don't provide this trade
            if (!item.vendor.trades.includes(trade)) {
                return;
            }

            const vendorLocation = item.marker.getLatLng();

            // Leaflet calculates straight-line distance in meters
            const distance = map.distance(
                projectLocation,
                vendorLocation
            );

            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestVendor = item;
            }
        });

        const listItem = document.createElement("li");

        if (closestVendor) {
            // Convert meters into miles
            const distanceMiles =
                (shortestDistance / 1609.344).toFixed(2);

            const tradeName = document.createElement("strong");
            tradeName.textContent = `${trade}: `;

            const vendorDetails = document.createTextNode(
                `${closestVendor.vendor.name} — ${distanceMiles} miles`
            );

            listItem.append(tradeName, vendorDetails);

            // Warn when the result uses approximate coordinates
            if (closestVendor.locationStatus === "Approximate location") {
                const warning = document.createElement("span");
                warning.textContent = " (approximate location)";
                listItem.appendChild(warning);
            }

            // Draw a straight line to the closest vendor
            L.polyline([
                projectLocation,
                closestVendor.marker.getLatLng()
            ], {
                color: "blue",
                weight: 3,
                opacity: 0.7,
                dashArray: "8, 8"
            }).addTo(nearestVendorLines);

        } else {
            listItem.textContent =
                `${trade}: No matching vendor found`;
        }

        resultList.appendChild(listItem);
    });

    resultPanel.appendChild(resultList);

    // These distances do not account for roads or hauling routes
    const note = document.createElement("p");
    note.textContent =
        "Distances are straight-line estimates, not driving distances.";

    resultPanel.appendChild(note);
}

// Keep visible markers and vendor results in sync
function updateResults() {
    filterVendors();

    if (projectLocation) {
        findNearestVendor();
    }
}

// Click the map to choose a proposed construction site
map.on("click", function(event) {
    projectLocation = event.latlng;

    // Remove the old project marker if one exists
    if (projectMarker) {
        map.removeLayer(projectMarker);
    }

    // Create a draggable marker for the project
    projectMarker = L.marker(projectLocation, {
        draggable: true,
        bubblingMouseEvents: false
    }).addTo(map);

    projectMarker.bindPopup("Proposed Project Location");

    findNearestVendor();

    // Recalculate after dragging the project marker
    projectMarker.on("dragend", function() {
        projectLocation = projectMarker.getLatLng();
        findNearestVendor();
    });

    console.log("Project selected:", projectLocation);
});

// Update the map when a trade checkbox changes
document.getElementById("trade-options")
    .addEventListener("change", function(event) {

        if (event.target.matches(".trade-checkbox")) {
            updateResults();
        }
    });


// Select all available trades
document.getElementById("select-all-trades")
    .addEventListener("click", function() {

        document.querySelectorAll(".trade-checkbox")
            .forEach(checkbox => {
                checkbox.checked = true;
            });

        updateResults();
    });


// Clear all selected trades
document.getElementById("clear-trades")
    .addEventListener("click", function() {

        document.querySelectorAll(".trade-checkbox")
            .forEach(checkbox => {
                checkbox.checked = false;
            });

        updateResults();
    });

console.log("ArcGIS basemap initialized.");

loadVendors();
