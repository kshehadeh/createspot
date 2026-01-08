import { City, State, Country } from "country-state-city";

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Geocodes a location (city/state/country) to latitude/longitude coordinates.
 * First tries to find the city in the country-state-city package.
 * If not found, falls back to Nominatim (OpenStreetMap) geocoding API.
 */
export async function geocodeLocation(
  city: string | null,
  stateProvince: string | null,
  country: string | null,
): Promise<Coordinates | null> {
  // If no location data provided, return null
  if (!city && !stateProvince && !country) {
    return null;
  }

  // Try to find city in country-state-city package first
  if (city && country) {
    let cities: ReturnType<typeof City.getCitiesOfState> = [];

    if (stateProvince) {
      // Try to get cities for the specific state
      cities = City.getCitiesOfState(country, stateProvince);
    } else {
      // If no state, try to get all cities for the country
      // Note: City.getAllCities() doesn't filter by country, so we'll need to filter
      const allCities = City.getAllCities();
      cities = allCities.filter((c) => c.countryCode === country);
    }

    // Try to find exact city match (case-insensitive)
    const matchedCity = cities.find(
      (c) => c.name.toLowerCase() === city.toLowerCase(),
    );

    if (matchedCity && matchedCity.latitude && matchedCity.longitude) {
      // Ensure values are numbers, not strings
      const lat = typeof matchedCity.latitude === "string"
        ? parseFloat(matchedCity.latitude)
        : matchedCity.latitude;
      const lng = typeof matchedCity.longitude === "string"
        ? parseFloat(matchedCity.longitude)
        : matchedCity.longitude;

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          lat,
          lng,
        };
      }
    }

    // Try partial match (city name contains or is contained)
    const partialMatch = cities.find(
      (c) =>
        c.name.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(c.name.toLowerCase()),
    );

    if (partialMatch && partialMatch.latitude && partialMatch.longitude) {
      // Ensure values are numbers, not strings
      const lat = typeof partialMatch.latitude === "string"
        ? parseFloat(partialMatch.latitude)
        : partialMatch.latitude;
      const lng = typeof partialMatch.longitude === "string"
        ? parseFloat(partialMatch.longitude)
        : partialMatch.longitude;

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          lat,
          lng,
        };
      }
    }
  }

  // Fallback to Nominatim API (OpenStreetMap)
  try {
    const queryParts: string[] = [];
    if (city) queryParts.push(city);
    if (stateProvince) {
      // Try to get state name from ISO code
      if (country) {
        const states = State.getStatesOfCountry(country);
        const state = states.find((s) => s.isoCode === stateProvince);
        if (state) {
          queryParts.push(state.name);
        } else {
          queryParts.push(stateProvince);
        }
      } else {
        queryParts.push(stateProvince);
      }
    }
    if (country) {
      // Get country name from ISO code
      const countries = Country.getAllCountries();
      const countryObj = countries.find((c) => c.isoCode === country);
      if (countryObj) {
        queryParts.push(countryObj.name);
      } else {
        queryParts.push(country);
      }
    }

    const query = queryParts.join(", ");
    if (!query) {
      return null;
    }

    // Use Nominatim API with proper user agent (required by their ToS)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "User-Agent": "CreateSpot/1.0 (https://createspot.app)",
        },
      },
    );

    if (!response.ok) {
      console.error("Nominatim geocoding failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      // Ensure parsed values are valid numbers
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          lat,
          lng,
        };
      }
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }

  return null;
}

