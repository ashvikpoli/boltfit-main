import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Settings,
  Trophy,
  Target,
  Zap,
  Calendar,
  ChevronRight,
  CreditCard as Edit,
  LogOut,
  Star,
  Flame,
} from 'lucide-react-native';
import LightningAvatar from '@/components/LightningAvatar';
import XPProgressBar from '@/components/XPProgressBar';
import AchievementCard from '@/components/AchievementCard';
import { useAuth } from '@/hooks/useAuth';
import {
  useSupabaseGamification,
  getLevelProgress,
} from '@/hooks/useSupabaseGamification';
import { useSupabaseWorkouts } from '@/hooks/useSupabaseWorkouts';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { getUnlockedAchievements } = useSupabaseGamification();
  const { getWorkoutStats } = useSupabaseWorkouts();
  const router = useRouter();

  const [showAchievements, setShowAchievements] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const workoutStats = getWorkoutStats();
  const unlockedAchievements = getUnlockedAchievements() || [];

  // Get current level progress using the new system
  const levelProgress = profile?.total_xp
    ? getLevelProgress(profile.total_xp)
    : { currentXP: 0, maxXP: 100, level: 1 };

  // Safety check for profile data
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleEditProfile = () => {
    router.push('/settings/profile' as any);
  };

  const handleWorkoutHistory = () => {
    router.push('/(tabs)/progress');
  };

  const handleSettings = () => {
    router.push('/settings' as any);
  };

  const handleSignOut = () => {
    if (isSigningOut) return; // Prevent multiple sign out attempts

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            console.log('Starting sign out process...');
            const { error } = await signOut();
            if (error) {
              setIsSigningOut(false);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              console.error('Sign out error:', error);
            } else {
              // Navigation will be handled automatically by auth state change
              console.log('Successfully signed out');
              // Don't set isSigningOut to false here as the component will unmount
            }
          } catch (error) {
            setIsSigningOut(false);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
            console.error('Sign out exception:', error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      title: 'View Achievements',
      icon: Trophy,
      color: '#F59E0B',
      action: () => setShowAchievements(!showAchievements),
    },
    {
      title: 'Edit Profile',
      icon: Edit,
      color: '#6B46C1',
      action: handleEditProfile,
    },
    {
      title: 'Workout History',
      icon: Calendar,
      color: '#3B82F6',
      action: handleWorkoutHistory,
    },
    {
      title: 'Settings',
      icon: Settings,
      color: '#64748B',
      action: handleSettings,
    },
    {
      title: isSigningOut ? 'Signing Out...' : 'Sign Out',
      icon: LogOut,
      color: '#EF4444',
      action: handleSignOut,
    },
  ];

  const totalAchievements = 15; // Total number of achievements

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Edit size={20} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileCard}>
            <LinearGradient
              colors={['#6B46C1', '#8B5CF6']}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profileContent}>
                <LightningAvatar
                  level="bolt"
                  xp={levelProgress.currentXP}
                  maxXp={levelProgress.maxXP}
                  color={(profile?.avatar_color as any) || 'purple'}
                  size="large"
                  showStats={false}
                />
                <Text style={styles.profileName}>
                  {profile?.username || 'Lightning Warrior'}
                </Text>
                <Text style={styles.profileEmail}>
                  {profile?.email || 'user@boltlab.com'}
                </Text>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    Level {profile?.level || 1} Lightning Master
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.xpCard}>
            <LinearGradient
              colors={['#1A1A2E', '#0F0F23']}
              style={styles.xpGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <XPProgressBar
                currentXP={levelProgress.currentXP}
                maxXP={levelProgress.maxXP}
                level={levelProgress.level}
                size="large"
                animated={true}
              />
            </LinearGradient>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {/* Streak Card - Now matches other stat cards */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#1A1A2E', '#0F0F23']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIcon}>
                  <Flame size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>
                  {profile?.current_streak || 0}
                </Text>
                <Text style={styles.statLabel}>Day Streak</Text>
                <View style={styles.statExtra}>
                  {profile?.longest_streak &&
                  profile.longest_streak > (profile?.current_streak || 0) ? (
                    <Text style={styles.bestStreak}>
                      Best: {profile.longest_streak}
                    </Text>
                  ) : null}
                </View>
              </LinearGradient>
            </View>

            {/* Workouts Stat */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#1A1A2E', '#0F0F23']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIcon}>
                  <Zap size={20} color="#6B46C1" />
                </View>
                <Text style={styles.statValue}>
                  {workoutStats.totalWorkouts}
                </Text>
                <Text style={styles.statLabel}>Workouts</Text>
                <View style={styles.statExtra} />
              </LinearGradient>
            </View>

            {/* Achievements Stat */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#1A1A2E', '#0F0F23']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIcon}>
                  <Trophy size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>
                  {unlockedAchievements.length}/{totalAchievements}
                </Text>
                <Text style={styles.statLabel}>Achievements</Text>
                <View style={styles.statExtra} />
              </LinearGradient>
            </View>

            {/* Total XP Stat */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#1A1A2E', '#0F0F23']}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIcon}>
                  <Star size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{profile?.total_xp || 0}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
                <View style={styles.statExtra} />
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        {showAchievements ? (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>
              Achievements ({unlockedAchievements.length}/{totalAchievements})
            </Text>
            <View style={styles.achievementsGrid}>
              {/* Would need to map through all achievements with unlock status */}
              {unlockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  size="medium"
                  showProgress={true}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={item.action}
            >
              <LinearGradient
                colors={['#1A1A2E', '#0F0F23']}
                style={styles.menuGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.menuLeft}>
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: item.color + '20' },
                    ]}
                  >
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <ChevronRight size={20} color="#64748B" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <TouchableOpacity style={styles.appInfoCard}>
            <LinearGradient
              colors={['#1A1A2E', '#0F0F23']}
              style={styles.appInfoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.appInfoContent}>
                <View style={styles.appLogo}>
                  <Zap size={24} color="#6B46C1" />
                </View>
                <Text style={styles.appName}>BoltLab</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileGradient: {
    borderRadius: 20,
    padding: 24,
  },
  profileContent: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 16,
  },
  profileBadge: {
    backgroundColor: '#FFFFFF' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  xpSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  xpCard: {
    marginBottom: 16,
  },
  xpGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  streakCard: {
    width: '48%',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  bestStreak: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  statExtra: {
    height: 20,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuCard: {
    marginBottom: 12,
  },
  menuGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  appInfoCard: {
    marginBottom: 16,
  },
  appInfoGradient: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  appInfoContent: {
    alignItems: 'center',
  },
  appLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6B46C1' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
