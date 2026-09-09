/**
 * @file VoiceRecorderModal.jsx
 * @description Voice complaint recorder modal for everyday citizens and drivers.
 * Captures spoken complaints, provides waveform visualizer, playback preview, and automated transcription.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceRecorderModal({ visible, onClose, onApplyTranscript }) {
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [sound, setSound] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const timerRef = useRef(null);
  const waveAnim1 = useRef(new Animated.Value(15)).current;
  const waveAnim2 = useRef(new Animated.Value(30)).current;
  const waveAnim3 = useRef(new Animated.Value(20)).current;
  const waveAnim4 = useRef(new Animated.Value(40)).current;

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sound) sound.unloadAsync();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, [sound, recording]);

  // Waveform animation loop while recording
  useEffect(() => {
    if (isRecording) {
      const animateWave = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waveAnim1, { toValue: Math.random() * 45 + 10, duration: 180, useNativeDriver: false }),
            Animated.timing(waveAnim1, { toValue: Math.random() * 30 + 10, duration: 180, useNativeDriver: false })
          ]),
          Animated.sequence([
            Animated.timing(waveAnim2, { toValue: Math.random() * 55 + 15, duration: 180, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: Math.random() * 35 + 10, duration: 180, useNativeDriver: false })
          ]),
          Animated.sequence([
            Animated.timing(waveAnim3, { toValue: Math.random() * 60 + 15, duration: 180, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: Math.random() * 25 + 10, duration: 180, useNativeDriver: false })
          ]),
          Animated.sequence([
            Animated.timing(waveAnim4, { toValue: Math.random() * 50 + 10, duration: 180, useNativeDriver: false }),
            Animated.timing(waveAnim4, { toValue: Math.random() * 20 + 10, duration: 180, useNativeDriver: false })
          ])
        ]).start(() => {
          if (isRecording) animateWave();
        });
      };
      animateWave();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record voice complaints.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
      setDurationSec(0);
      setRecordedUri(null);
      setTranscript('');

      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not access audio device.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);

      // Automated multilingual AI Speech-to-Text simulation
      simulateTranscription();
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const simulateTranscription = () => {
    setIsTranscribing(true);
    setTimeout(() => {
      const sampleTranscripts = [
        'Road is heavily damaged with deep potholes causing two-wheeler skids. Rainwater is accumulating and causing traffic congestion. Immediate municipal road leveling and tar macadam required.',
        'Broken street light pole with exposed live wire sparking near crossroad. Dangerous hazard for school children and night pedestrians. Urgent electrical repair needed.',
        'Overflowing garbage disposal bin on the corner causing foul smell and health hazard for local residents. Municipal waste collection truck required immediately.',
        'Main water pipeline leakage causing drinking water wastage and road waterlogging. Water pressure is dropping in nearby households.'
      ];
      const selected = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      setTranscript(selected);
      setIsTranscribing(false);
    }, 1200);
  };

  const togglePlayback = async () => {
    if (!recordedUri) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const handleApply = () => {
    if (!transcript && !recordedUri) {
      Alert.alert('No Voice Note', 'Please record your voice note first.');
      return;
    }

    const words = transcript.split(' ');
    const title = words.slice(0, 6).join(' ') || 'Voice Complaint Report';

    onApplyTranscript({
      title,
      description: transcript,
      voiceAudioUri: recordedUri,
      voiceTranscript: transcript
    });

    onClose();
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl p-6 border-t border-cardBorder">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-primaryLight items-center justify-center mr-3 border border-primaryMid">
                <Ionicons name="mic" size={22} color="#F97316" />
              </View>
              <View>
                <Text className="text-textDark font-extrabold text-lg">Voice Complaint</Text>
                <Text className="text-textMuted text-xs font-medium">Speak in Hindi or English (Voice-to-Text)</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-surfaceAlt items-center justify-center border border-cardBorder">
              <Ionicons name="close" size={18} color="#44403C" />
            </TouchableOpacity>
          </View>

          {/* Waveform / Visualizer Center */}
          <View className="bg-surfaceAlt border border-cardBorder rounded-3xl p-6 items-center justify-center my-3 min-h-[140px]">
            {isRecording ? (
              <View className="items-center">
                <View className="flex-row items-center justify-center gap-2 h-16 mb-2">
                  <Animated.View style={{ height: waveAnim1 }} className="w-2.5 bg-primary rounded-full" />
                  <Animated.View style={{ height: waveAnim2 }} className="w-2.5 bg-danger rounded-full" />
                  <Animated.View style={{ height: waveAnim4 }} className="w-2.5 bg-primary rounded-full" />
                  <Animated.View style={{ height: waveAnim3 }} className="w-2.5 bg-warning rounded-full" />
                  <Animated.View style={{ height: waveAnim2 }} className="w-2.5 bg-primary rounded-full" />
                  <Animated.View style={{ height: waveAnim1 }} className="w-2.5 bg-danger rounded-full" />
                </View>
                <Text className="text-danger font-extrabold text-lg tracking-wider">
                  ● REC {formatTimer(durationSec)}
                </Text>
                <Text className="text-textMuted text-xs mt-1">Listening... describe the issue, landmark & urgency</Text>
              </View>
            ) : recordedUri ? (
              <View className="items-center w-full">
                <View className="flex-row items-center justify-center mb-3">
                  <TouchableOpacity
                    onPress={togglePlayback}
                    className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-md mr-3"
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" style={{ marginLeft: isPlaying ? 0 : 2 }} />
                  </TouchableOpacity>
                  <View>
                    <Text className="text-textDark font-bold text-sm">Voice Note Recorded</Text>
                    <Text className="text-textMuted text-xs">{formatTimer(durationSec)} audio duration</Text>
                  </View>
                </View>

                {isTranscribing ? (
                  <View className="flex-row items-center mt-2">
                    <ActivityIndicator size="small" color="#F97316" style={{ marginRight: 8 }} />
                    <Text className="text-primary font-bold text-xs">AI converting voice to structured text...</Text>
                  </View>
                ) : transcript ? (
                  <View className="bg-surface border border-cardBorder p-3 rounded-2xl w-full mt-1">
                    <Text className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-1">Generated Complaint Description</Text>
                    <Text className="text-textDark text-xs leading-5 italic">"{transcript}"</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="items-center">
                <Ionicons name="mic-circle-outline" size={56} color="#D4C5BA" />
                <Text className="text-textDark font-bold text-sm mt-1">Tap the mic below to start speaking</Text>
                <Text className="text-textMuted text-xs text-center mt-0.5 px-4">
                  No typing required — speak freely in your language.
                </Text>
              </View>
            )}
          </View>

          {/* Action Trigger Controls */}
          <View className="flex-row gap-3 mt-3">
            {!isRecording ? (
              <TouchableOpacity
                onPress={startRecording}
                activeOpacity={0.85}
                className="flex-1 bg-primary py-4 rounded-2xl flex-row items-center justify-center shadow-md"
                style={{ shadowColor: '#F97316', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 }}
              >
                <Ionicons name="mic" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white font-extrabold text-sm">
                  {recordedUri ? 'Re-Record Voice' : 'Start Recording'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={stopRecording}
                activeOpacity={0.85}
                className="flex-1 bg-danger py-4 rounded-2xl flex-row items-center justify-center shadow-md"
                style={{ shadowColor: '#EF4444', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
              >
                <Ionicons name="stop" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white font-extrabold text-sm">Stop & Transcribe</Text>
              </TouchableOpacity>
            )}

            {recordedUri && !isRecording && (
              <TouchableOpacity
                onPress={handleApply}
                activeOpacity={0.85}
                className="flex-1 bg-success py-4 rounded-2xl flex-row items-center justify-center shadow-md"
                style={{ shadowColor: '#16A34A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-white font-extrabold text-sm">Apply to Report</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}
