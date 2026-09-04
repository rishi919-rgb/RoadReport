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
