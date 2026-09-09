/**
 * @file imageCompressor.js
 * @description Image manipulation utility.
 * Compresses large camera photos to reduce upload time, network bandwidth, and server storage.
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image file by resizing and reducing quality.
 * @param {string} uri - Local file path URI of the photo.
 * @returns {Promise<string>} Compressed image local URI.
 */
export const compressImage = async (uri) => {
  if (!uri) return null;
  try {
    const actions = [
      {
        resize: { width: 1024 } // Constrain width to 1024px (height scales proportionally)
      }
    ];

    const saveOptions = {
      compress: 0.7, // Reduce quality to 70% (JPEG compression)
      format: ImageManipulator.SaveFormat.JPEG
    };

    const result = await ImageManipulator.manipulateAsync(uri, actions, saveOptions);
    console.log(`Image compressed successfully: ${result.width}x${result.height}`);
    return result.uri;
  } catch (error) {
    console.error('Failed to compress image:', error.message);
    // Return original image URI if compression fails
    return uri;
  }
};

export default compressImage;
