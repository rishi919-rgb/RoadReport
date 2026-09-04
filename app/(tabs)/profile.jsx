/**
 * @file profile.jsx
 * @description Profile management screen - Neon Civic OS terminal style.
 */

import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import useAuth from '../../hooks/useAuth';
import { ReportContext } from '../../context/ReportContext';
import { formatDate } from '../../utils/formatDate';

const CUSTOM_CONTACTS_KEY = 'roadreport_custom_emergency_contacts';

const OFFICIAL_HELPLINES = [
  { name: 'Road Accidents Emergency Hotline', phone: '103', description: 'Immediate medical & traffic assistance for road crashes' },
  { name: 'Municipal Corporation General Helpline', phone: '1913', description: 'For roads, streetlight outages, and garbage complaints' },
  { name: 'Water Supply & Sewage Board', phone: '1916', description: 'For water leaks, pipeline ruptures, and sewage overflows' },
  { name: 'Traffic Police Helpline', phone: '1095', description: 'For broken traffic signals and road congestion alerts' },
  { name: 'Disaster Emergency Operations', phone: '1070', description: 'For severe road blocks, fallen trees, and urban flooding' }
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUserProfile } = useAuth();
  const { myReports, fetchMyReports } = useContext(ReportContext);

  const [customContacts, setCustomContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWard, setEditWard] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    fetchMyReports(1);
    loadCustomContacts();
  }, []);

  const openEditProfileModal = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditWard(user?.ward || 'Ward 12 - Central Zone');
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    setIsSavingProfile(true);
    const res = await updateUserProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      ward: editWard.trim()
    });
    setIsSavingProfile(false);

    if (res && res.success) {
      Alert.alert('Profile Saved', 'Your profile details have been updated.');
      setEditProfileModalVisible(false);
    } else {
      Alert.alert('Update Failed', res.message || 'Unable to update profile.');
    }
  };

  const loadCustomContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CONTACTS_KEY);
      if (stored) {
        setCustomContacts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load custom contacts:', e.message);
    }
  };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter a contact name and phone number.');
      return;
    }

    const newContact = {
      id: `contact_${Date.now()}`,
      name: contactName.trim(),
      phone: contactPhone.trim(),
      role: contactRole.trim() || 'Emergency Contact'
    };

    const updatedList = [newContact, ...customContacts];
    setCustomContacts(updatedList);

    try {
      await AsyncStorage.setItem(CUSTOM_CONTACTS_KEY, JSON.stringify(updatedList));
      Alert.alert('Success', 'Emergency contact added successfully.');
    } catch (e) {
      console.error('Failed to save contact:', e.message);
    }

    setContactName('');
    setContactPhone('');
    setContactRole('');
    setModalVisible(false);
  };

  const handleDeleteContact = (id) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = customContacts.filter((c) => c.id !== id);
            setCustomContacts(updated);
            try {
              await AsyncStorage.setItem(CUSTOM_CONTACTS_KEY, JSON.stringify(updated));
            } catch (e) {
              console.error('Failed to delete contact:', e.message);
            }
          }
        }
      ]
    );
  };

  const handleDialPhone = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanPhone}`;

    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Dialer Unavailable', `Phone dialer is not supported on this device. Call: ${phoneNumber}`);
        } else {
          return Linking.openURL(telUrl);
        }
      })
      .catch((err) => {
        console.error('Failed to open dialer:', err.message);
        Alert.alert('Error', `Could not initiate call to ${phoneNumber}`);
      });
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to log out of RoadReport?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const totalReportsCount = myReports.length;
  const resolvedReportsCount = myReports.filter((r) => r.status === 'resolved').length;
  const repPoints = (user?.reputationPoints !== undefined ? user.reputationPoints : 150) + (totalReportsCount * 15);

  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="mb-4 mt-2 flex-row justify-between items-center">
          <View>
            <Text className="text-textDark text-3xl font-extrabold tracking-tight">Citizen Profile</Text>
            <Text className="text-textMuted text-xs font-medium mt-0.5">Manage your civic profile and contacts</Text>
          </View>
          
          <TouchableOpacity
            onPress={openEditProfileModal}
            className="bg-primaryLight border border-primaryMid px-3.5 py-2 rounded-2xl flex-row items-center shadow-sm"
          >
            <Ionicons name="create-outline" size={15} color="#F97316" style={{ marginRight: 4 }} />
            <Text className="text-primary font-bold text-xs">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* User Identity Card */}
        <View
          className="bg-surface border border-cardBorder p-5 rounded-3xl items-center mb-5"
          style={{
            shadowColor: '#1C1917',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="bg-primaryLight border-2 border-primary w-20 h-20 rounded-3xl items-center justify-center mb-3 shadow-sm">
            <Text className="text-primary text-3xl font-extrabold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          
          <Text className="text-textDark text-xl font-extrabold tracking-tight">{user?.name || 'Citizen'}</Text>
          <Text className="text-textMuted text-xs mt-0.5 font-medium">{user?.email || 'citizen@roadreport.in'}</Text>

          {/* Phone and Ward Details */}
          <View className="flex-row items-center mt-3 bg-surfaceAlt px-3.5 py-1.5 rounded-full border border-cardBorder">
            <Ionicons name="location-outline" size={13} color="#F97316" style={{ marginRight: 4 }} />
            <Text className="text-textDark text-xs font-medium">{user?.ward || 'Ward 12 - Central Zone'}</Text>
            {user?.phone ? (
              <>
                <Text className="text-textMuted mx-2">•</Text>
                <Ionicons name="call-outline" size={13} color="#16A34A" style={{ marginRight: 4 }} />
                <Text className="text-textDark text-xs font-medium">{user.phone}</Text>
              </>
            ) : null}
          </View>

          <Text className="text-textMuted text-xs mt-3">
            Citizen Member since {user?.createdAt ? formatDate(user.createdAt) : 'August 2026'}
          </Text>
        </View>

        {/* Citizen Reputation & Karma Score Card */}
        <TouchableOpacity
          onPress={() => router.push('/rewards')}
          className="bg-surface border border-cardBorder rounded-3xl p-4 mb-5 flex-row items-center justify-between"
          style={{
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-1 pr-3">
            <View className="flex-row items-center mb-1">
              <Ionicons name="shield-checkmark" size={18} color="#F97316" style={{ marginRight: 6 }} />
              <Text className="text-primary font-extrabold text-xs uppercase tracking-wider">Level 2 Civic Sentinel</Text>
            </View>
            <Text className="text-textBody text-xs leading-relaxed">
              {user?.civicCredits || 0} Civic Credits available. Tap to exchange points and claim municipal perks!
            </Text>
          </View>
          <View className="bg-primaryLight border border-primaryMid px-3.5 py-2 rounded-2xl items-center justify-center">
            <Text className="text-primary font-extrabold text-lg">{repPoints}</Text>
            <Text className="text-textMuted text-[9px] font-bold uppercase tracking-widest">Points</Text>
          </View>
        </TouchableOpacity>

        {/* Statistics Grid */}
        <View className="flex-row justify-between mb-5">
          <View
            className="bg-surface border border-cardBorder p-4 rounded-3xl w-[48%] items-center justify-center"
            style={{
              shadowColor: '#1C1917',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text className="text-textMuted text-xs uppercase tracking-wider font-bold">Total Reports</Text>
            <Text className="text-primary text-3xl font-extrabold mt-1">{totalReportsCount}</Text>
          </View>

          <View
            className="bg-surface border border-cardBorder p-4 rounded-3xl w-[48%] items-center justify-center"
            style={{
              shadowColor: '#1C1917',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text className="text-textMuted text-xs uppercase tracking-wider font-bold">Resolved</Text>
            <Text className="text-success text-3xl font-extrabold mt-1">{resolvedReportsCount}</Text>
          </View>
        </View>

        {/* Official Municipal Helplines Section */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-textDark text-base font-extrabold">Emergency & Municipal Helplines</Text>
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider">Tap to Call</Text>
          </View>

          <View
            className="bg-surface border border-cardBorder rounded-3xl overflow-hidden divide-y divide-cardBorder"
            style={{
              shadowColor: '#1C1917',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {OFFICIAL_HELPLINES.map((item, index) => {
              return (
                <View key={index} className="p-4 flex-row justify-between items-center border-b border-cardBorder">
                  <View className="flex-1 pr-3">
                    <Text className="text-textDark font-bold text-sm">{item.name}</Text>
                    <Text className="text-textMuted text-xs mt-0.5 leading-relaxed">{item.description}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDialPhone(item.phone)}
                    activeOpacity={0.8}
                    className="bg-primaryLight border border-primaryMid px-3.5 py-2 rounded-2xl flex-row items-center shadow-sm"
                  >
                    <Ionicons name="call" size={13} color="#F97316" style={{ marginRight: 4 }} />
                    <Text className="text-primary font-bold text-sm">{item.phone}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Custom Personal Emergency Contacts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-textDark text-base font-extrabold">Personal Emergency Contacts</Text>
            
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-primaryLight border border-primaryMid px-3 py-1.5 rounded-xl flex-row items-center shadow-sm"
            >
              <Ionicons name="add" size={16} color="#F97316" style={{ marginRight: 2 }} />
              <Text className="text-primary font-bold text-xs">Add Contact</Text>
            </TouchableOpacity>
          </View>

          {customContacts.length === 0 ? (
            <View className="bg-surface border border-cardBorder p-6 rounded-3xl items-center">
              <Ionicons name="people-outline" size={36} color="#D4C5BA" className="mb-1" />
              <Text className="text-textDark font-bold text-sm mt-1">No Personal Contacts Added</Text>
              <Text className="text-textMuted text-xs text-center mt-1 leading-relaxed">
                Save local ward representatives or family members for quick 1-tap emergency calling.
              </Text>
            </View>
          ) : (
            <View
              className="bg-surface border border-cardBorder rounded-3xl overflow-hidden divide-y divide-cardBorder"
              style={{
                shadowColor: '#1C1917',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {customContacts.map((contact) => (
                <View key={contact.id} className="p-4 flex-row justify-between items-center border-b border-cardBorder">
                  <View className="flex-1 pr-3">
                    <Text className="text-textDark font-bold text-sm">{contact.name}</Text>
                    <Text className="text-primary text-xs font-medium mt-0.5">{contact.role}</Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleDialPhone(contact.phone)}
                      className="bg-successLight border border-success/30 px-3 py-1.5 rounded-xl flex-row items-center mr-1 shadow-sm"
                    >
                      <Ionicons name="call" size={13} color="#16A34A" style={{ marginRight: 4 }} />
                      <Text className="text-success font-bold text-xs">{contact.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteContact(contact.id)}
                      className="bg-surfaceAlt border border-cardBorder w-8 h-8 rounded-full items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Logout Action Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-dangerLight border border-danger/20 py-3.5 rounded-2xl items-center mb-8 active:opacity-80 flex-row justify-center"
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
          <Text className="text-danger font-bold text-sm">Sign Out of Account</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Profile Modal Dialog */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editProfileModalVisible}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface border-t border-cardBorder p-6 rounded-t-3xl">
            <Text className="text-textDark font-extrabold text-xl tracking-tight mb-0.5">Edit Profile</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Update your personal and ward information</Text>

            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Full Name *</Text>
            <TextInput
              className="bg-surfaceAlt text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium mb-4"
              placeholder="Your full name"
              placeholderTextColor="#A8A29E"
              value={editName}
              onChangeText={setEditName}
            />

            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Phone Number</Text>
            <TextInput
              className="bg-surfaceAlt text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium mb-4"
              placeholder="+91 9876543210"
              placeholderTextColor="#A8A29E"
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />

            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Municipal Ward</Text>
            <TextInput
              className="bg-surfaceAlt text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium mb-6"
              placeholder="Ward 14 - Science City"
              placeholderTextColor="#A8A29E"
              value={editWard}
              onChangeText={setEditWard}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditProfileModalVisible(false)}
                className="bg-surfaceAlt border border-cardBorder py-3.5 rounded-2xl flex-1 items-center"
              >
                <Text className="text-textBody font-bold text-sm">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
                activeOpacity={0.85}
                className="bg-primary rounded-2xl py-3.5 flex-1 items-center shadow-md"
                style={{
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-textLight font-bold text-sm">
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Custom Emergency Contact Modal Dialog */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface border-t border-cardBorder p-6 rounded-t-3xl">
            <Text className="text-textDark font-extrabold text-xl tracking-tight mb-0.5">Add Emergency Contact</Text>
            <Text className="text-textMuted text-xs font-medium mb-5">Save a local ward officer or family contact</Text>

            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Contact Name *</Text>
            <TextInput
              className="bg-surfaceAlt text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium mb-4"
              placeholder="e.g. Ward Inspector Sharma"
              placeholderTextColor="#A8A29E"
              value={contactName}
              onChangeText={setContactName}
            />

            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Phone Number *</Text>
            <TextInput
              className="bg-surfaceAlt text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium mb-4"
              placeholder="9876543210"
              placeholderTextColor="#A8A29E"
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
            />

            <Text className="text-textBody text-xs uppercase tracking-widest font-bold mb-1.5">Designation / Relationship</Text>
            <TextInput
              className="bg-surfaceAlt text-textDark px-4 py-3.5 rounded-2xl border border-cardBorder text-sm font-medium mb-6"
              placeholder="e.g. Municipal Representative"
              placeholderTextColor="#A8A29E"
              value={contactRole}
              onChangeText={setContactRole}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-surfaceAlt border border-cardBorder py-3.5 rounded-2xl flex-1 items-center"
              >
                <Text className="text-textBody font-bold text-sm">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveContact}
                activeOpacity={0.85}
                className="bg-primary rounded-2xl py-3.5 flex-1 items-center shadow-md"
                style={{
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-textLight font-bold text-sm">Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
