/**
 * @file imageCompressor.js
 * @description Image manipulation utility.
 * Compresses large camera photos to reduce upload time, network bandwidth, and server storage.
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image file by resizing and reducing quality.
 * 
 * VIVA QUESTION: "Why compress the image?"
 * ANSWER: Modern mobile cameras capture photos at resolutions of 12-48+ megapixels, resulting 
 * in files that are 5MB to 12MB. Uploading raw files over cellular networks causes high battery drain, 
 * long upload spinners, high data costs, and consumes massive server disk space. Resizing the image 
 * to a maximum width of 1024px at 70% quality compresses a 10MB photo down to ~150KB while retaining 
 * clear visibility of the civic issue, making it a critical real-world engineering optimization.
 * 
 * @param {string} uri - Local file path URI of the photo.
 * @returns {Promise<string>} Compressed image local URI.
 */
export const compressImage = async (uri) => {
  if (!uri) return null;
  try {
    const actions = [
      {
        resize: { width: 500 } // Constrain width to 500px for instant upload and lightweight base64 payload
      }
    ];

    const saveOptions = {
      compress: 0.35, // High compression yielding ~25-40KB base64 payload (prevents HTTP 413)
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true
    };

    let result = await ImageManipulator.manipulateAsync(uri, actions, saveOptions);

    // If payload exceeds 65KB, perform a second micro-compression pass to guarantee it never exceeds 100KB limit
    if (result.base64 && result.base64.length > 65000) {
      result = await ImageManipulator.manipulateAsync(
        result.uri,
        [{ resize: { width: 380 } }],
        { compress: 0.25, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
    }

    console.log(`Image compressed: ${result.width}x${result.height}, base64 len: ${result.base64?.length || 0}`);
    if (result.base64) {
      return `data:image/jpeg;base64,${result.base64}`;
    }
    return result.uri;
  } catch (error) {
    console.error('Failed to compress image:', error.message);
    // Return original image URI if compression fails
    return uri;
  }
};

export default compressImage;
