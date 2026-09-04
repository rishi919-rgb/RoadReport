/**
 * @file camera.jsx
 * @description Camera screen utilizing expo-camera.
 * Provides live capture view, camera toggle triggers, flash toggles, and photo preview routing.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import useCamera from '../hooks/useCamera';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Custom hook manages camera states and permissions
  const {
    hasPermission,
    cameraRef,
    capturedPhoto,
    takePicture,
    clearPhoto,
    requestPermission
  } = useCamera();

  // Facing direction: 'back' or 'front'
  const [facing, setFacing] = useState('back');
  // Flash mode: 'off' or 'on'
  const [flash, setFlash] = useState('off');

  /**
   * Toggles between front and back camera lenses.
   */
  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  /**
   * Toggles flash on and off.
   */
  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  /**
   * Trigger photo capture and handle results.
   */
  const handleCapture = async () => {
    await takePicture();
  };

  /**
   * Passes the approved photo URI back to the report screen via routing params.
   */
  const handleUsePhoto = () => {
    router.navigate({
      pathname: '/(tabs)/report',
      params: {
        ...params,
        photoUri: capturedPhoto
      }
    });
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-gray-400 text-sm">Requesting camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
        <Ionicons name="camera-outline" size={48} color="#EF4444" className="mb-3" />
        <Text className="text-textLight text-xl font-bold text-center mb-2">Camera Access Denied</Text>
        <Text className="text-gray-400 text-xs text-center mb-6 leading-5">
          We need access to your device camera so you can take a clear photo of the civic issue.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary py-3.5 px-6 rounded-xl"
        >
          <Text className="text-textLight font-bold text-sm uppercase">Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (capturedPhoto) {
    return (
      <View className="flex-1 bg-background justify-between">
        <Image
          source={{ uri: capturedPhoto }}
          className="w-full h-full absolute inset-0"
          resizeMode="cover"
        />

        <SafeAreaView className="flex-1 justify-between p-6 bg-black/40">
          <Text className="text-textLight text-center font-bold text-base mt-2">
            Verify Attached Photo
          </Text>

          <View className="flex-row justify-around items-center mb-4">
            <TouchableOpacity
              onPress={clearPhoto}
              className="bg-slate-900/80 border border-slate-700 py-3.5 px-6 rounded-full"
            >
              <Text className="text-textLight font-bold text-base">Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUsePhoto}
              className="bg-primary py-3.5 px-8 rounded-full shadow-lg"
            >
              <Text className="text-textLight font-bold text-base">Use Photo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background relative">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        facing={facing}
        flash={flash}
      />
      
      <SafeAreaView className="flex-1 justify-between p-6 absolute inset-0">
        
        {/* Top Controls: Close & Flash */}
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-slate-900/60 w-10 h-10 rounded-full items-center justify-center border border-slate-800"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleFlash}
            className="bg-slate-900/60 px-4 py-2 rounded-full border border-slate-800 flex-row items-center"
          >
            <Ionicons name={flash === 'on' ? 'flash' : 'flash-outline'} size={14} color="#F97316" style={{ marginRight: 4 }} />
            <Text className="text-textLight text-xs font-semibold uppercase tracking-wider">
              Flash: {flash === 'on' ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls: Flip & Capture */}
        <View className="flex-row justify-around items-center mb-6">
          
          <TouchableOpacity
            onPress={toggleFacing}
            className="bg-slate-900/60 w-12 h-12 rounded-full items-center justify-center border border-slate-800"
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCapture}
            activeOpacity={0.8}
            className="bg-textLight w-20 h-20 rounded-full items-center justify-center border-4 border-gray-400/50 shadow-2xl"
          >
            <View className="bg-primary w-14 h-14 rounded-full" />
          </TouchableOpacity>

          <View className="w-12" />
        </View>

      </SafeAreaView>
    </View>
  );
}
