/**
 * @file report.jsx
 * @description Multi-step civic issue reporting screen - Neon Civic OS terminal style.
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import MiniMapPreview from '../../components/MiniMapPreview';

import CategorySelector from '../../components/CategorySelector';
import MediaPreview from '../../components/MediaPreview';
import useLocation from '../../hooks/useLocation';
import { compressImage } from '../../utils/imageCompressor';
import { ReportContext } from '../../context/ReportContext';
import reportService from '../../services/reportService';

export default function ReportIssueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createReport, draftReport, updateDraftReport } = useContext(ReportContext);
  const scrollViewRef = useRef(null);

  // Bind Form Steps and Inputs directly to persistent draftReport in ReportContext
  const step = draftReport.step || 1;
  const setStep = (s) => updateDraftReport({ step: typeof s === 'function' ? s(step) : s });

  const category = draftReport.category || '';
  const setCategory = (c) => updateDraftReport({ category: c });

  const title = draftReport.title || '';
  const setTitle = (t) => updateDraftReport({ title: t });

  const description = draftReport.description || '';
  const setDescription = (d) => updateDraftReport({ description: d });

  const severity = draftReport.severity || 'medium';
  const setSeverity = (s) => updateDraftReport({ severity: s });

  const photoUri = draftReport.photoUri || '';
  const setPhotoUri = (p) => updateDraftReport({ photoUri: p });

  const location = draftReport.location || null;
  const setLocation = (l) => updateDraftReport({ location: l });

  const address = draftReport.address || '';
  const setAddress = (a) => updateDraftReport({ address: a });

  const isAnonymous = Boolean(draftReport.isAnonymous);
  const setIsAnonymous = (val) => updateDraftReport({ isAnonymous: val });

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [step]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);

  const { getCurrentLocation, loading: locationLoading } = useLocation();

  useEffect(() => {
    const updates = {};
    if (params.category) updates.category = params.category;
    if (params.title) updates.title = params.title;
    if (params.description) updates.description = params.description;
    if (params.severity) updates.severity = params.severity;

    if (params.photoUri) {
      updates.photoUri = params.photoUri;
      updates.step = 3;
    }
    if (params.latitude && params.longitude) {
      updates.location = {
        latitude: parseFloat(params.latitude),
        longitude: parseFloat(params.longitude)
      };
      updates.address = params.address || 'Custom Picked Location';
      updates.step = 4;
    }

    if (Object.keys(updates).length > 0) {
      updateDraftReport(updates);
    }
  }, [params.category, params.title, params.description, params.severity, params.photoUri, params.latitude, params.longitude, params.address]);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const compressedUri = await compressImage(pickedUri);
        setPhotoUri(compressedUri);
      }
    } catch (e) {
      console.error('Gallery picker error:', e.message);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri('');
  };

  const handleUseCurrentLocation = async () => {
    try {
      const res = await getCurrentLocation();
      if (res && res.coords) {
        setLocation(res.coords);
        setAddress(res.address);
      } else {
        Alert.alert(
          'Location Notice',
          'Could not retrieve GPS position. Please ensure Location Services (GPS) and permissions are enabled on your device.'
        );
      }
    } catch (e) {
      console.error('Use current location error:', e.message);
      Alert.alert('Location Notice', 'Could not retrieve GPS coordinates. Please try again or pick on map.');
    }
  };

  const handleCheckDuplicates = async () => {
    if (!location || bypassDuplicate) return false;
    try {
      const nearbyReports = await reportService.getReportsNear(
        location.latitude,
        location.longitude,
        50,
        category
      );

      if (nearbyReports && nearbyReports.length > 0) {
        setDuplicateReport(nearbyReports[0]);
        return true;
      }
    } catch (e) {
      console.error('Duplicate check error:', e.message);
    }
    return false;
  };

  const handleSubmitReport = async () => {
    if (!bypassDuplicate) {
      setIsSubmitting(true);
      const isDuplicate = await handleCheckDuplicates();
      setIsSubmitting(false);
      
      if (isDuplicate) {
        setStep(5);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        title,
        description,
        category,
        severity,
        isAnonymous,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address
        },
        media: photoUri ? [photoUri] : []
      };

      const result = await createReport(reportData);

      if (result.success) {
        if (result.offline) {
          Alert.alert(
            'Saved Offline',
            'No network connection available. Your report was saved locally and will auto-upload when reconnected.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/my-reports') }]
          );
        } else {
          Alert.alert(
            'Report Broadcasted',
            'Thank you for reporting this issue. Your complaint telemetry is live.',
            [{ text: 'View My Reports', onPress: () => router.replace('/(tabs)/my-reports') }]
          );
        }
      } else {
        Alert.alert('Submission Failed', result.message || 'Could not submit report.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1 && !category) {
      Alert.alert('Required', 'Please select an issue category.');
      return;
    }
    if (step === 2 && (!title.trim() || !description.trim())) {
      Alert.alert('Required', 'Please provide a title and description.');
      return;
    }
    if (step === 3 && !photoUri) {
      Alert.alert('Required', 'Please attach a photo of the issue.');
      return;
    }
    if (step === 4 && (!location || !address)) {
      Alert.alert('Required', 'Please select the issue location.');
      return;
    }

    if (step === 4) {
      setIsSubmitting(true);
      await handleCheckDuplicates();
      setIsSubmitting(false);
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isNextDisabled = 
    (step === 1 && !category) ||
    (step === 2 && (!title.trim() || !description.trim())) ||
    (step === 3 && !photoUri) ||
    (step === 4 && (!location || !address));

  return (
    <SafeAreaView className="flex-1 bg-background">
      
      {/* Navbar Title */}
      <View className="flex-row items-center justify-between px-5 py-3.5 bg-surface border-b border-cardBorder">
        <Text className="text-textDark font-extrabold text-lg tracking-tight">Report Civic Issue</Text>
        <Text className="text-primary text-xs font-bold uppercase tracking-wider">Step {step} of 5</Text>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1 }} className="px-5 py-4">
        
        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 ? (
          <View>
            <Text className="text-textDark text-2xl font-extrabold tracking-tight mb-0.5">Select Category</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Choose the type of issue you want to report</Text>
            <CategorySelector selected={category} onSelect={(catId) => setCategory(catId)} />
          </View>
        ) : null}

        {/* STEP 2: TITLE & DESCRIPTION DETAILS */}
        {step === 2 ? (
          <View>
            <Text className="text-textDark text-2xl font-extrabold tracking-tight mb-0.5">Issue Details</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Provide a clear title and description for municipal workers</Text>
            
            <View className="mb-4">
              <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Issue Title *</Text>
              <TextInput
                className="bg-surface text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium"
                placeholder="e.g. Deep pothole near crossroad"
                placeholderTextColor="#A8A29E"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
            </View>

            <View className="mb-4">
              <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Detailed Description *</Text>
              <TextInput
                className="bg-surface text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium h-28"
                placeholder="Describe the issue, landmarks, and safety concerns..."
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View className="mb-4">
              <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Severity Level</Text>
              <View className="flex-row justify-between bg-surface border border-cardBorder p-1.5 rounded-2xl">
                {['low', 'medium', 'high'].map((lvl) => {
                  const isLvlSelected = severity === lvl;
                  const activeBtnStyle = isLvlSelected ? 'bg-primaryLight border border-primaryMid shadow-sm' : 'bg-transparent';
                  const activeTextStyle = isLvlSelected ? 'text-primary font-bold' : 'text-textMuted font-medium';
                  return (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setSeverity(lvl)}
                      className={`flex-1 py-2.5 rounded-xl ${activeBtnStyle}`}
                    >
                      <Text className={`text-center text-xs uppercase tracking-wider ${activeTextStyle}`}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Anonymous Mode Toggle Card */}
            <TouchableOpacity
              onPress={() => setIsAnonymous(!isAnonymous)}
              activeOpacity={0.8}
              className={`p-4 rounded-2xl border flex-row items-center justify-between mb-4 ${
                isAnonymous ? 'bg-primaryLight border-primaryMid' : 'bg-surface border-cardBorder'
              }`}
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${isAnonymous ? 'bg-primaryMid' : 'bg-surfaceAlt'}`}>
                  <Ionicons name={isAnonymous ? "eye-off" : "eye-outline"} size={20} color={isAnonymous ? "#F97316" : "#A8A29E"} />
                </View>
                <View className="flex-1">
                  <Text className="text-textDark font-bold text-sm">Report Anonymously</Text>
                  <Text className="text-textMuted text-xs mt-0.5">
                    Hide your name on the public civic community feed
                  </Text>
                </View>
              </View>
              <View className={`w-5 h-5 rounded-md border items-center justify-center ${isAnonymous ? 'bg-primary border-primary' : 'border-cardBorder bg-surface'}`}>
                {isAnonymous ? <Ionicons name="checkmark" size={14} color="#FAFAF9" /> : null}
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* STEP 3: MEDIA ATTACHMENTS */}
        {step === 3 ? (
          <View>
            <Text className="text-textDark text-2xl font-extrabold tracking-tight mb-0.5">Attach Photo</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Clear photos help municipal teams resolve issues faster</Text>
            
            {photoUri ? (
              <MediaPreview uri={photoUri} onRemove={handleRemovePhoto} />
            ) : (
              <View className="flex-col gap-3.5">
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/camera',
                    params: { category, title, description, severity }
                  })}
                  className="bg-primaryLight border border-primaryMid py-8 rounded-2xl items-center justify-center"
                  style={{
                    shadowColor: '#F97316',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="camera" size={32} color="#F97316" className="mb-1" />
                  <Text className="text-primary font-bold text-sm mt-2">Take Photo with Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImage}
                  className="bg-surface border border-cardBorder py-8 rounded-2xl items-center justify-center"
                  style={{
                    shadowColor: '#1C1917',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="images" size={32} color="#A8A29E" className="mb-1" />
                  <Text className="text-textBody font-bold text-sm mt-2">Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        {/* STEP 4: GEOLOCATION PICKS */}
        {step === 4 ? (
          <View>
            <Text className="text-textDark text-2xl font-extrabold tracking-tight mb-0.5">Tag Location</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Pinpoint exact GPS position of the problem</Text>
            
            <View className="flex-col gap-3.5">
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={locationLoading}
                className="bg-primaryLight border border-primaryMid py-3.5 rounded-2xl items-center flex-row justify-center px-4 active:opacity-80"
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#F97316" />
                ) : (
                  <>
                    <Ionicons name="locate" size={18} color="#F97316" style={{ marginRight: 8 }} />
                    <Text className="text-primary font-bold text-sm">Use Current GPS Location</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/location',
                  params: { category, title, description, severity, photoUri }
                })}
                className="bg-surface border border-cardBorder py-3.5 rounded-2xl flex-row items-center justify-center"
              >
                <Ionicons name="map-outline" size={18} color="#A8A29E" style={{ marginRight: 8 }} />
                <Text className="text-textBody font-bold text-sm">Pick on Map</Text>
              </TouchableOpacity>

              {address ? (
                <View className="bg-surface border border-cardBorder p-4 rounded-2xl mt-1 flex-row items-start">
                  <Ionicons name="pin" size={18} color="#F97316" style={{ marginTop: 2, marginRight: 8 }} />
                  <View className="flex-1">
                    <Text className="text-textMuted text-xs uppercase tracking-wider font-bold">Selected Location</Text>
                    <Text className="text-textDark text-sm font-medium mt-0.5">{address}</Text>
                  </View>
                </View>
              ) : null}

              {location ? (
                <View className="rounded-2xl overflow-hidden border border-cardBorder mt-2 bg-surface">
                  <MiniMapPreview
                    latitude={location.latitude}
                    longitude={location.longitude}
                    height={176}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* STEP 5: REVIEW & DUPLICATE BANNERS */}
        {step === 5 ? (
          <View>
            {duplicateReport ? (
              <View className="bg-warningLight border border-warning/30 p-4 rounded-2xl mb-4">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="warning" size={20} color="#D97706" style={{ marginRight: 6 }} />
                  <Text className="text-warning font-extrabold text-sm">Similar Nearby Report Found</Text>
                </View>
                <Text className="text-textBody text-xs mb-3 leading-relaxed">
                  An issue within 50m was already reported: "{duplicateReport.title}".
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => router.push(`/reports/${duplicateReport._id}`)}
                    className="bg-warning/20 border border-warning px-4 py-2.5 rounded-xl flex-1 items-center"
                  >
                    <Text className="text-warning font-bold text-xs">View Existing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setBypassDuplicate(true);
                      setDuplicateReport(null);
                    }}
                    className="bg-surface border border-cardBorder px-4 py-2.5 rounded-xl flex-1 items-center"
                  >
                    <Text className="text-textDark font-bold text-xs">Submit Anyway</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <Text className="text-textDark text-2xl font-extrabold tracking-tight mb-0.5">Review Report</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Please verify all details before submitting</Text>

            <View
              className="bg-surface border border-cardBorder p-5 rounded-3xl mb-4"
              style={{
                shadowColor: '#1C1917',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              
              <View className="mb-3.5">
                <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Category</Text>
                <Text className="text-primary font-bold text-sm capitalize">
                  {category ? category.replace('_', ' ') : 'Not selected'}
                </Text>
              </View>

              <View className="mb-3.5">
                <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Title</Text>
                <Text className="text-textDark font-bold text-base">{title || 'No title'}</Text>
              </View>

              <View className="mb-3.5">
                <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Description</Text>
                <Text className="text-textBody text-sm leading-relaxed">{description || 'No description'}</Text>
              </View>

              <View className="flex-row justify-between items-center mb-3.5 pb-3.5 border-b border-cardBorder">
                <View>
                  <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Severity</Text>
                  <Text className="text-warning font-bold text-sm capitalize">{severity}</Text>
                </View>
                {photoUri ? (
                  <View className="items-end">
                    <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-1">Attached Photo</Text>
                    <Image source={{ uri: photoUri }} className="w-14 h-14 rounded-xl border border-cardBorder" resizeMode="cover" />
                  </View>
                ) : null}
              </View>

              <View>
                <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-0.5">Location</Text>
                <Text className="text-textBody text-sm font-medium">{address || 'No location specified'}</Text>
              </View>

            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* Navigation Buttons bottom bar */}
      <View className="bg-surface border-t border-cardBorder px-5 py-3.5 flex-row justify-between items-center">
        
        {step > 1 ? (
          <TouchableOpacity
            onPress={handlePrevStep}
            className="px-5 py-3 rounded-2xl border border-cardBorder bg-surfaceAlt flex-row items-center"
          >
            <Ionicons name="arrow-back" size={16} color="#44403C" style={{ marginRight: 6 }} />
            <Text className="text-textBody font-bold text-sm">Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {step < 5 ? (
          <TouchableOpacity
            onPress={handleNextStep}
            disabled={isNextDisabled || isSubmitting}
            activeOpacity={0.85}
            className={`px-6 py-3.5 rounded-2xl flex-row items-center ${
              isNextDisabled || isSubmitting ? 'bg-surfaceAlt border border-cardBorder opacity-50' : 'bg-primary shadow-md'
            }`}
            style={!isNextDisabled && !isSubmitting ? {
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            } : null}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FAFAF9" />
            ) : (
              <>
                <Text className="text-textLight font-bold text-sm mr-2">Continue</Text>
                <Ionicons name="arrow-forward" size={16} color="#FAFAF9" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmitReport}
            disabled={isSubmitting}
            activeOpacity={0.85}
            className="px-6 py-3.5 rounded-2xl bg-success shadow-md flex-row items-center"
            style={{
              shadowColor: '#16A34A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FAFAF9" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FAFAF9" style={{ marginRight: 6 }} />
                <Text className="text-textLight font-bold text-sm">Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}
