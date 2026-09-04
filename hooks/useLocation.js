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
      // 1. Request foreground location permissions from the OS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission was denied by the user');
        setLoading(false);
        return null;
      }

      // 2. Fetch the actual hardware GPS coordinates (high accuracy)
      const currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const coords = {
        latitude: currentPos.coords.latitude,
        longitude: currentPos.coords.longitude
      };
      setLocation(coords);

      // 3. Translate coordinates into human-readable text address via reverse geocoding
      const geocode = await Location.reverseGeocodeAsync(coords);
      
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        // Combine address parts safely (avoiding empty fields)
        const addressParts = [
          place.name || place.streetNumber,
          place.street,
          place.district || place.subregion,
          place.city,
          place.region,
          place.postalCode
        ].filter(Boolean); // Filter out null/undefined/empty parts

        const formattedAddress = addressParts.join(', ');
        setAddress(formattedAddress || 'Unknown Address');
        
        return { coords, address: formattedAddress };
      } else {
        setAddress('Address could not be determined');
        return { coords, address: 'Address could not be determined' };
      }
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
