/**
 * @file useLocation.js
 * @description Custom hook for managing device location.
 * Requests device GPS permissions, fetches current coordinates, and performs reverse geocoding.
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

/**
 * useLocation hook for fetching coordinates and addresses.
 * 
 * VIVA QUESTION: "Why reverse geocoding?"
 * ANSWER: Databases and mapping libraries (like react-native-maps) require raw floating-point 
 * GPS coordinates (latitude and longitude) to place markers accurately. However, numbers like 
 * 23.0225, 72.5714 are meaningless to municipal workers and citizens. Reverse geocoding translates 
 * these raw coordinates into a human-readable address string (street name, city, area), making 
 * the report actionable for the workers resolving the issue.
 * 
 * @returns {Object} location, address, loading, error, getCurrentLocation
 */
const useLocation = () => {
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Requests device permissions, fetches GPS position, and reverse-geocodes it to a readable address.
   */
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Verify if device location services (GPS) are toggled ON
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('Device location services (GPS) are turned off');
        setLoading(false);
        return null;
      }

      // 2. Request foreground location permissions from the OS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission was denied by the user');
        setLoading(false);
        return null;
      }

      // 3. Fetch current hardware GPS position with fallback to last known position
      let coords = null;
      try {
        const currentPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000
        });
        if (currentPos && currentPos.coords) {
          coords = {
            latitude: currentPos.coords.latitude,
            longitude: currentPos.coords.longitude
          };
        }
      } catch (posErr) {
        console.warn('getCurrentPositionAsync failed, attempting last known position:', posErr.message);
        const lastPos = await Location.getLastKnownPositionAsync();
        if (lastPos && lastPos.coords) {
          coords = {
            latitude: lastPos.coords.latitude,
            longitude: lastPos.coords.longitude
          };
        }
      }

      if (!coords) {
        setError('Unable to acquire GPS coordinates');
        setLoading(false);
        return null;
      }

      setLocation(coords);

      // 4. Translate coordinates into human-readable address with graceful fallback
      let formattedAddress = `GPS Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
      try {
        const geocode = await Location.reverseGeocodeAsync(coords);
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const addressParts = [
            place.name || place.streetNumber,
            place.street,
            place.district || place.subregion,
            place.city,
            place.region,
            place.postalCode
          ].filter(Boolean);

          if (addressParts.length > 0) {
            formattedAddress = addressParts.join(', ');
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocoding unavailable, using coordinate label:', geoErr.message);
      }

      setAddress(formattedAddress);
      return { coords, address: formattedAddress };
    } catch (err) {
      setError(err.message || 'Failed to retrieve location');
      console.error('Location Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    address,
    loading,
    error,
    setLocation,
    setAddress,
    getCurrentLocation
  };
};

export default useLocation;
