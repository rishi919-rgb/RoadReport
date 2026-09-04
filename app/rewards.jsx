/**
 * @file rewards.jsx
 * @description Municipal Civic Rewards Marketplace & Ward Leaderboard screen - Neon Civic OS style.
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Clipboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getLeaderboard } from '../services/authService';

const MUNICIPAL_PERKS = [
  {
    id: 'perk-metro-pass-1day',
    title: '1-Day Unlimited Metro Pass',
    authority: 'City Rapid Transit Dept',
    cost: 50,
    icon: 'subway-outline',
    color: '#A855F7',
    description: 'Get 24 hours of complimentary travel across all city metro & bus routes.',
    validity: 'Pass activates upon first tap'
  },
  {
    id: 'perk-water-50l',
    title: 'Free 50L Clean Water Credit',
    authority: 'Water Supply Board',
    cost: 30,
    icon: 'water-outline',
    color: '#38BDF8',
    description: 'Waive charges for up to 50 liters of utility water consumption on your next bill.',
    validity: 'Applied to next billing cycle'
  },
  {
    id: 'perk-milk-5l',
    title: '5L Free Milk Voucher',
    authority: 'Verified Municipal Dairy Booth',
    cost: 40,
    icon: 'cafe-outline',
    color: '#10B981',
    description: 'Claim 5 liters of fresh pouch milk at any authorized government dairy booth.',
    validity: 'Valid at all city milk booths'
  }
];

export default function RewardsScreen() {
  const router = useRouter();
  const { user, redeemUserPerk, convertUserPoints } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('perks');
  const [redeemingId, setRedeemingId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState(25);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboardData();
    }
  }, [activeTab]);

  const handleConvertPoints = async (ptsToConvert) => {
    const pts = parseInt(ptsToConvert) || selectedPoints;
    const currentPts = user?.reputationPoints !== undefined ? user.reputationPoints : 150;

    if (currentPts < pts) {
      Alert.alert('Insufficient Karma Points', `You only have ${currentPts} Karma Points available.`);
      return;
    }

    if (pts < 5) {
      Alert.alert('Minimum Threshold', 'You need at least 5 Karma Points to convert into 1 CC.');
      return;
    }

    setIsConverting(true);
    const result = await convertUserPoints(pts);
    setIsConverting(false);

    if (result && result.success) {
      setConvertModalVisible(false);
      Alert.alert(
        'Conversion Successful!',
        `Converted ${result.data.pointsDeducted} Karma Points into +${result.data.creditsEarned} Civic Credit(s)!`
      );
    } else {
      Alert.alert('Conversion Error', result?.message || 'Failed to convert points.');
    }
  };

  const fetchLeaderboardData = async () => {
    setLoadingLeaderboard(true);
    const res = await getLeaderboard();
    if (res && res.success) {
      setLeaderboard(res.data || []);
    } else {
      Alert.alert('Notice', 'Could not sync latest leaderboard. Showing cached rankings.');
    }
    setLoadingLeaderboard(false);
  };

  const handleRedeem = (perk) => {
    const userCredits = user?.civicCredits || 0;
    if (userCredits < perk.cost) {
      Alert.alert(
        'Insufficient Civic Credits',
        `You need ${perk.cost - userCredits} more Civic Credits to claim this perk.`
      );
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem "${perk.title}" for ${perk.cost} Civic Credits?\n\nThis will issue an official municipal voucher code.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem Now',
          style: 'default',
          onPress: () => processRedemption(perk)
        }
      ]
    );
  };

  const processRedemption = async (perk) => {
    setRedeemingId(perk.id);
    const result = await redeemUserPerk({
      perkId: perk.id,
      title: perk.title,
      cost: perk.cost
    });
    setRedeemingId(null);

    if (result && result.success) {
      setSelectedVoucher(result.voucher);
    } else {
      Alert.alert('Redemption Failed', result?.message || 'Failed to complete transaction.');
    }
  };

  const handleCopyCode = (code) => {
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const renderRankBadge = (rank) => {
    if (rank === 1) return <Ionicons name="trophy" size={18} color="#F59E0B" />;
    if (rank === 2) return <Ionicons name="medal" size={18} color="#94A3B8" />;
    if (rank === 3) return <Ionicons name="medal" size={18} color="#B45309" />;
    return <Text className="text-textMuted font-bold text-xs">#{rank}</Text>;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Navigation Header */}
      <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-cardBorder bg-surface">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-2xl bg-surface border border-cardBorder"
        >
          <Ionicons name="chevron-back" size={20} color="#44403C" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-textDark font-extrabold text-base tracking-tight">Citizen Rewards</Text>
          <Text className="text-textMuted text-xs font-medium">Municipal Perks & Ward Rankings</Text>
        </View>

        <View className="bg-primaryLight border border-primaryMid px-3 py-1.5 rounded-full flex-row items-center">
          <Ionicons name="sparkles" size={13} color="#F97316" />
          <Text className="text-primary font-bold text-xs ml-1.5">
            {user?.civicCredits || 0} CC
          </Text>
        </View>
      </View>

      {/* User Status Bar */}
      <View className="bg-surface border-b border-cardBorder px-5 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-2xl bg-primaryLight items-center justify-center border border-primaryMid mr-3">
            <Ionicons name="shield-checkmark" size={18} color="#F97316" />
          </View>
          <View>
            <Text className="text-textDark font-bold text-sm">{user?.name || 'Citizen'}</Text>
            <Text className="text-textMuted text-xs font-medium">
              {user?.ward || 'Ward 12'} • Karma: {user?.reputationPoints || 0} pts
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-warningLight border border-warning/30 px-2.5 py-1 rounded-full">
          <Ionicons name="flame" size={13} color="#D97706" />
          <Text className="text-warning font-bold text-xs ml-1">
            {user?.streakCount || 1}d Streak
          </Text>
        </View>
      </View>

      {/* Tab Controls */}
      <View className="flex-row border-b border-cardBorder px-5 pt-2 bg-surface">
        <TouchableOpacity
          onPress={() => setActiveTab('perks')}
          className={`flex-1 pb-3 items-center flex-row justify-center ${
            activeTab === 'perks' ? 'border-b-2 border-primary' : ''
          }`}
        >
          <Ionicons
            name="gift-outline"
            size={16}
            color={activeTab === 'perks' ? '#F97316' : '#A8A29E'}
          />
          <Text
            className={`font-bold text-xs ml-1.5 ${
              activeTab === 'perks' ? 'text-primary' : 'text-textMuted'
            }`}
          >
            Marketplace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('leaderboard')}
          className={`flex-1 pb-3 items-center flex-row justify-center ${
            activeTab === 'leaderboard' ? 'border-b-2 border-primary' : ''
          }`}
        >
          <Ionicons
            name="podium-outline"
            size={16}
            color={activeTab === 'leaderboard' ? '#F97316' : '#A8A29E'}
          />
          <Text
            className={`font-bold text-xs ml-1.5 ${
              activeTab === 'leaderboard' ? 'text-primary' : 'text-textMuted'
            }`}
          >
            Leaderboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('vouchers')}
          className={`flex-1 pb-3 items-center flex-row justify-center ${
            activeTab === 'vouchers' ? 'border-b-2 border-primary' : ''
          }`}
        >
          <Ionicons
            name="ticket-outline"
            size={16}
            color={activeTab === 'vouchers' ? '#F97316' : '#A8A29E'}
          />
          <Text
            className={`font-bold text-xs ml-1.5 ${
              activeTab === 'vouchers' ? 'text-primary' : 'text-textMuted'
            }`}
          >
            Vouchers ({user?.redeemedPerks?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'perks' && (
          <View className="pb-8">

            {/* Points to Civic Credits Conversion Callout Banner */}
            <View
              className="bg-primaryLight border border-primaryMid p-4 rounded-3xl mb-5"
              style={{
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.10,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-2xl bg-primaryMid items-center justify-center mr-3 border border-primary/30">
                    <Ionicons name="swap-horizontal" size={20} color="#F97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textDark font-bold text-sm">Exchange Karma Points</Text>
                    <Text className="text-textBody text-xs mt-0.5 font-medium">
                      Available: <Text className="text-primary font-bold">{user?.reputationPoints !== undefined ? user.reputationPoints : 150} pts</Text> (5 pts = 1 CC)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setConvertModalVisible(true)}
                  activeOpacity={0.85}
                  className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center shadow-sm"
                  style={{
                    shadowColor: '#F97316',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="sparkles" size={13} color="#FAFAF9" />
                  <Text className="text-textLight font-bold text-xs ml-1">Convert</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-1">
              Municipal Marketplace
            </Text>
            <Text className="text-textDark font-extrabold text-xl tracking-tight mb-4">
              Redeem Credits for Local Benefits
            </Text>

            {MUNICIPAL_PERKS.map((perk) => {
              const canAfford = (user?.civicCredits || 0) >= perk.cost;
              const isLoadingThis = redeemingId === perk.id;

              return (
                <View
                  key={perk.id}
                  className="bg-surface border border-cardBorder rounded-3xl p-4 mb-3.5"
                  style={{
                    shadowColor: '#1C1917',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${perk.color}15` }}
                      >
                        <Ionicons name={perk.icon} size={22} color={perk.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-textDark font-bold text-base">{perk.title}</Text>
                        <Text className="text-textMuted text-xs font-medium">{perk.authority}</Text>
                      </View>
                    </View>

                    <View className="bg-primaryLight border border-primaryMid px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="sparkles" size={12} color="#F97316" />
                      <Text className="text-primary font-bold text-xs ml-1">
                        {perk.cost} CC
                      </Text>
                    </View>
                  </View>

                  <Text className="text-textBody text-xs leading-relaxed my-2 font-medium">
                    {perk.description}
                  </Text>

                  <View className="flex-row items-center justify-between pt-2.5 border-t border-cardBorder mt-1">
                    <Text className="text-textMuted text-xs font-medium">
                      {perk.validity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleRedeem(perk)}
                      disabled={isLoadingThis}
                      activeOpacity={0.85}
                      className={`px-4 py-2 rounded-xl flex-row items-center ${
                        canAfford ? 'bg-primary shadow-sm' : 'bg-surfaceAlt border border-cardBorder'
                      }`}
                      style={canAfford ? {
                        shadowColor: '#F97316',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      } : null}
                    >
                      {isLoadingThis ? (
                        <ActivityIndicator size="small" color="#FAFAF9" />
                      ) : (
                        <>
                          <Ionicons
                            name={canAfford ? 'checkmark-circle' : 'lock-closed'}
                            size={14}
                            color={canAfford ? '#FAFAF9' : '#A8A29E'}
                          />
                          <Text
                            className={`font-bold text-xs ml-1.5 ${
                              canAfford ? 'text-textLight' : 'text-textMuted'
                            }`}
                          >
                            {canAfford ? 'Redeem Voucher' : 'Need More CC'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View className="pb-8">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-textMuted text-xs font-bold uppercase tracking-wider">
                  Ward Honor Roll
                </Text>
                <Text className="text-textDark font-extrabold text-xl tracking-tight">Top Civic Sentinels</Text>
              </View>
              <TouchableOpacity
                onPress={fetchLeaderboardData}
                className="bg-surface border border-cardBorder p-2.5 rounded-2xl shadow-sm"
              >
                <Ionicons name="refresh" size={16} color="#44403C" />
              </TouchableOpacity>
            </View>

            {loadingLeaderboard ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#F97316" />
                <Text className="text-textMuted text-xs font-medium mt-3">Syncing Ward Rankings...</Text>
              </View>
            ) : leaderboard.length === 0 ? (
              <View className="bg-surface border border-cardBorder rounded-3xl p-6 items-center">
                <Ionicons name="trophy-outline" size={36} color="#D4C5BA" />
                <Text className="text-textDark font-bold text-sm mt-2">No Leaderboard Data</Text>
                <Text className="text-textMuted text-xs text-center mt-1">
                  Upload the first report in your ward to claim the #1 rank!
                </Text>
              </View>
            ) : (
              leaderboard.map((item, index) => {
                const isCurrentUser = item._id === user?._id || item.email === user?.email;
                const rank = index + 1;

                return (
                  <View
                    key={item._id || index}
                    className={`flex-row items-center justify-between p-3.5 rounded-2xl mb-2.5 border ${
                      isCurrentUser
                        ? 'bg-primaryLight border-primaryMid shadow-sm'
                        : 'bg-surface border-cardBorder'
                    }`}
                    style={isCurrentUser ? {
                      shadowColor: '#F97316',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      elevation: 2,
                    } : {
                      shadowColor: '#1C1917',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 items-center justify-center mr-2">
                        {renderRankBadge(rank)}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-textDark font-bold text-sm mr-2">
                            {item.name || 'Citizen'}
                          </Text>
                          {isCurrentUser && (
                            <View className="bg-primary px-2 py-0.5 rounded-full">
                              <Text className="text-textLight font-bold text-[9px] uppercase">YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-textMuted text-xs font-medium">
                          {item.ward || 'Ward 12'} • {item.reportsSubmitted || 0} Reports
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-primary font-extrabold text-sm">
                        {item.reputationPoints || 0} pts
                      </Text>
                      <Text className="text-textMuted text-[9px] font-bold uppercase tracking-wider">Karma</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'vouchers' && (
          <View className="pb-8">
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-1">
              Active Municipal Vouchers
            </Text>
            <Text className="text-textDark font-extrabold text-xl tracking-tight mb-4">
              Your Redeemed Perk Codes
            </Text>

            {!user?.redeemedPerks || user.redeemedPerks.length === 0 ? (
              <View className="bg-surface border border-cardBorder rounded-3xl p-8 items-center">
                <Ionicons name="ticket-outline" size={40} color="#D4C5BA" />
                <Text className="text-textDark font-bold text-base mt-3">No Vouchers Yet</Text>
                <Text className="text-textMuted text-xs text-center mt-1 px-4 leading-relaxed">
                  Redeem municipal metro passes, clean water credits, or dairy vouchers using your Civic Credits.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('perks')}
                  activeOpacity={0.85}
                  className="mt-5 bg-primary rounded-2xl px-6 py-3 shadow-md"
                  style={{
                    shadowColor: '#F97316',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-textLight font-bold text-sm">Browse Marketplace</Text>
                </TouchableOpacity>
              </View>
            ) : (
              user.redeemedPerks.map((voucher, idx) => (
                <View
                  key={voucher.voucherCode || idx}
                  className="bg-surface border border-cardBorder rounded-3xl p-4 mb-3.5"
                  style={{
                    shadowColor: '#1C1917',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-textDark font-bold text-base">{voucher.title}</Text>
                    <View className="bg-successLight border border-success/30 px-2.5 py-0.5 rounded-full">
                      <Text className="text-success font-bold text-[10px] uppercase">ACTIVE</Text>
                    </View>
                  </View>

                  <View className="bg-surfaceAlt border border-cardBorder p-3.5 rounded-2xl flex-row items-center justify-between my-2">
                    <View>
                      <Text className="text-textMuted text-[10px] uppercase font-bold tracking-wider">
                        Redemption Code
                      </Text>
                      <Text className="text-primary font-extrabold text-lg tracking-widest mt-0.5">
                        {voucher.voucherCode}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleCopyCode(voucher.voucherCode)}
                      className="bg-surface border border-cardBorder px-3 py-2 rounded-xl flex-row items-center shadow-sm"
                    >
                      <Ionicons
                        name={copiedCode ? 'checkmark' : 'copy-outline'}
                        size={14}
                        color={copiedCode ? '#16A34A' : '#44403C'}
                      />
                      <Text
                        className={`text-xs font-bold ml-1.5 ${
                          copiedCode ? 'text-success' : 'text-textBody'
                        }`}
                      >
                        {copiedCode ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-textMuted text-xs mt-1">
                    Redeemed on {new Date(voucher.redeemedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Voucher Confirmation Modal */}
      {selectedVoucher && (
        <Modal transparent animationType="fade" visible={!!selectedVoucher}>
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="bg-surface border border-cardBorder w-full max-w-sm rounded-3xl p-6 items-center shadow-lg">
              <View className="w-14 h-14 rounded-3xl bg-successLight border border-success/30 items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
              </View>

              <Text className="text-textDark font-extrabold text-xl text-center tracking-tight">
                Voucher Issued!
              </Text>
              <Text className="text-textMuted text-xs text-center mt-1 mb-4">
                Your municipal perk voucher has been generated successfully.
              </Text>

              <View className="bg-surfaceAlt border border-cardBorder w-full p-4 rounded-2xl items-center mb-5">
                <Text className="text-textMuted text-xs font-bold uppercase tracking-wider">
                  {selectedVoucher.title}
                </Text>
                <Text className="text-primary font-extrabold text-2xl tracking-widest my-2">
                  {selectedVoucher.voucherCode}
                </Text>
                <Text className="text-textBody text-xs text-center leading-relaxed">
                  Present this code at municipal offices or booth counters.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedVoucher(null)}
                activeOpacity={0.85}
                className="bg-primary w-full py-4 rounded-2xl items-center shadow-md"
                style={{
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-textLight font-bold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Convert Points Modal */}
      <Modal transparent animationType="slide" visible={convertModalVisible} onRequestClose={() => setConvertModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface border-t border-cardBorder p-6 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-primaryLight border border-primaryMid items-center justify-center mr-2">
                  <Ionicons name="swap-horizontal" size={18} color="#F97316" />
                </View>
                <Text className="text-textDark font-extrabold text-xl tracking-tight">Karma Points Exchange</Text>
              </View>
              <TouchableOpacity onPress={() => setConvertModalVisible(false)} className="p-1">
                <Ionicons name="close" size={20} color="#44403C" />
              </TouchableOpacity>
            </View>

            <Text className="text-textMuted text-xs font-medium mb-4">
              Exchange Karma Points into Civic Credits (5 pts = 1 CC).
            </Text>

            <View className="bg-surfaceAlt border border-cardBorder p-4 rounded-2xl flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-textMuted text-xs uppercase font-bold tracking-wider">Karma Points</Text>
                <Text className="text-primary font-extrabold text-2xl mt-0.5">{user?.reputationPoints !== undefined ? user.reputationPoints : 150} pts</Text>
              </View>
              <View className="items-end">
                <Text className="text-textMuted text-xs uppercase font-bold tracking-wider">Yield</Text>
                <Text className="text-success font-extrabold text-2xl mt-0.5">+{Math.floor(selectedPoints / 5)} CC</Text>
              </View>
            </View>

            <Text className="text-textBody text-xs uppercase font-bold tracking-wider mb-2">Select Amount to Convert:</Text>
            <View className="flex-row justify-between mb-6">
              {[25, 50, 100, Math.max(5, (user?.reputationPoints !== undefined ? user.reputationPoints : 150))].map((pts, idx) => {
                const isSelected = selectedPoints === pts;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedPoints(pts)}
                    className={`w-[23%] py-3 rounded-2xl items-center border ${
                      isSelected
                        ? 'bg-primaryLight border-primary shadow-sm'
                        : 'bg-surfaceAlt border-cardBorder'
                    }`}
                  >
                    <Text className={`font-bold text-xs ${isSelected ? 'text-primary' : 'text-textDark'}`}>
                      {pts} pts
                    </Text>
                    <Text className="text-textMuted text-[10px] font-medium mt-0.5">
                      +{Math.floor(pts / 5)} CC
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConvertModalVisible(false)}
                className="bg-surfaceAlt border border-cardBorder py-3.5 rounded-2xl flex-1 items-center"
              >
                <Text className="text-textBody font-bold text-sm">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleConvertPoints(selectedPoints)}
                disabled={isConverting}
                activeOpacity={0.85}
                className="bg-primary py-3.5 rounded-2xl flex-1 items-center flex-row justify-center shadow-md"
                style={{
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isConverting ? (
                  <ActivityIndicator size="small" color="#FAFAF9" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FAFAF9" style={{ marginRight: 6 }} />
                    <Text className="text-textLight font-bold text-sm">Convert Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
