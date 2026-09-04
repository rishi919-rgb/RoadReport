/**
 * @file useCamera.js
 * @description Custom hook for managing camera interactions.
 * Handles camera permission requests, picture capture triggers, and session photo memory management.
 */

import { useState, useRef, useEffect } from 'react';
import { Camera } from 'expo-camera';

/**
 * useCamera hook for operating camera views.
 * 
 * VIVA QUESTION: "How do you handle permission states in Expo?"
 * ANSWER: There are three main permission states:
 * 1. Undecided (null): Show a loading state or blank container while requesting permission.
 * 2. Granted (true): Render the full camera feed screen with controls.
 * 3. Denied (false): Show an error screen explaining that camera access is blocked 
 *    and guide the user to the device system settings to enable it manually.
 * 
 * @returns {Object} hasPermission, cameraRef, capturedPhoto, takePicture, clearPhoto, requestPermission
 */
const useCamera = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // Uri of the captured picture
  const cameraRef = useRef(null);

  // Request permissions on hook instantiation
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (err) {
        console.error('Failed to request camera permission:', err.message);
        setHasPermission(false);
      }
    };

    requestCameraPermission();
  }, []);

  /**
   * Helper to request permissions manually if initial check failed/denied.
   */
  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  /**
   * Captures a photo from the live camera stream.
   * @returns {Promise<string|null>} Photo file URI or null.
   */
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // Capture photo with balanced quality configurations
        const options = { quality: 0.8 };
        const photo = await cameraRef.current.takePictureAsync(options);
        setCapturedPhoto(photo.uri);
        return photo.uri;
      } catch (error) {
        console.error('Error taking picture:', error.message);
        return null;
      }
    }
    return null;
  };

  /**
   * Clears the current captured photo URI to reset state.
   */
  const clearPhoto = () => {
    setCapturedPhoto(null);
  };

  return {
    hasPermission,
    cameraRef,
    capturedPhoto,
    takePicture,
    clearPhoto,
    requestPermission
  };
};

export default useCamera;
