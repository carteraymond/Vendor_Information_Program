
# Overview

The Vendor Decision Support Map is an interactive mapping application designed to help construction estimators locate suppliers and subcontractors throughout South Carolina. The application displays over 40 vendor locations, including quarries, concrete suppliers, pipe suppliers, and equipment rental companies.

Users can select one or more construction trades to filter the vendors displayed on the map. By clicking on a proposed project location, the application calculates the closest vendor for each selected trade and displays the approximate distance in miles. Users can also click individual vendor markers to view company information, including their location and available services.

Vendor information is stored in a local JSON file containing publicly available business information, including company names, addresses, and trade categories. ArcGIS Geocoding is used to convert vendor addresses into geographic coordinates, while Leaflet handles map interactions and straight-line distance calculations.

My purpose for developing this software was to explore Geographic Information Systems (GIS) and learn how to integrate external APIs into a JavaScript application. Working as a construction estimator, I wanted to create a tool that could eventually help simplify the process of identifying suppliers and subcontractors for construction projects. This project allowed me to practice API requests, asynchronous programming, JSON data handling, and geographic calculations.

[Software Demo Video](https://youtu.be/Nc31WN0VvbI)

# Development Environment

I developed this application using Visual Studio Code, with the Live Server extension to test the application locally. Git and GitHub were used for version control and managing the repository. Browser Developer Tools were also useful for monitoring API requests and troubleshooting JavaScript errors.

The application was written using HTML, CSS, and JavaScript. I used the following libraries and services:

* **Leaflet:** Displays the interactive map, markers, popups, and geographic distance calculations.
* **Esri Leaflet:** Connects Leaflet to ArcGIS geographic services.
* **Esri Leaflet Vector:** Displays the ArcGIS Streets basemap.
* **ArcGIS Geocoding API:** Converts vendor street addresses into geographic coordinates.
* **JSON:** Stores vendor information separately from the main JavaScript code.

The application also uses JavaScript's Fetch API to retrieve vendor information and make requests to ArcGIS services.

# Useful Websites

* [Leaflet Documentation](https://leafletjs.com/reference.html)
* [Esri Leaflet Documentation](https://developers.arcgis.com/esri-leaflet/)
* [ArcGIS Location Services](https://developers.arcgis.com/documentation/)
* [ArcGIS Geocoding Documentation](https://developers.arcgis.com/rest/geocode/)
* [MDN JavaScript Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* [ArcGIS API Key Documentation](https://developers.arcgis.com/documentation/security-and-authentication/api-key-authentication/)

# Future Work

* Improve vendor location accuracy by verifying physical facility entrances, particularly for quarries and aggregate suppliers.
* Expand the vendor database to include more suppliers, subcontractors, and construction trades throughout South Carolina and neighboring states.
* Improve the nearest-vendor feature to display multiple potential vendors for each trade rather than only the closest option.
* Add additional vendor information, including contact information, service areas, and available materials.
* Improve the user interface to make filtering and selecting project locations easier.
* Explore methods for calculating actual driving distances and hauling costs in the future.
* Reduce repeated geocoding requests to improve application loading times.

# Installation Guide

1. Clone or download the repository.
2. Open the project folder in Visual Studio Code.
3. Create an ArcGIS API key with Basemap Styles and Geocoding (not stored) privileges.
4. Copy `config.example.js` and rename the copy to `config.js`.
5. Add your ArcGIS API key to `config.js`.
6. Open `index.html` using the Live Server extension.
7. Select the required trades and click the map to choose a project location.

The `config.js` file is excluded from GitHub using `.gitignore` to prevent API credentials from being accidentally committed.

Distances shown in the application are straight-line estimates and do not represent actual driving or hauling distances.
