/**
 * @file _layout.jsx
 * @description Authentication group layout file.
 * Wraps the auth screens (login and register) in a headless stack navigation container.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
