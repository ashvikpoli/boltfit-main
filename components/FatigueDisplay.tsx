import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, AlertTriangle, TrendingUp, Zap } from 'lucide-react-native';
import { MuscleFatigue } from '@/lib/fatigue';

interface FatigueDisplayProps {
  fatigueLevels: MuscleFatigue[];
  currentExercise?: {
    muscleGroup: string;
    targetMuscles?: string[];
  };
  recommendations: {
    restNeeded: string[];
    intensityAdjustment: string;
    nextExerciseSuggestion: string;
  };
}

export default function FatigueDisplay({
  fatigueLevels,
  currentExercise,
  recommendations,
}: FatigueDisplayProps) {
  const getFatigueColor = (level: number) => {
    if (level < 30) return '#10B981'; // Green
    if (level < 60) return '#F59E0B'; // Yellow
    if (level < 80) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getFatigueStatus = (level: number) => {
    if (level < 30) return 'Fresh';
    if (level < 60) return 'Moderate';
    if (level < 80) return 'High';
    return 'Critical';
  };

  const getFatigueIcon = (level: number) => {
    if (level < 30) return <Activity size={16} color="#10B981" />;
    if (level < 60) return <TrendingUp size={16} color="#F59E0B" />;
    if (level < 80) return <AlertTriangle size={16} color="#F97316" />;
    return <Zap size={16} color="#EF4444" />;
  };

  const currentExerciseFatigue = currentExercise
    ? fatigueLevels.find((f) => f.muscleGroup === currentExercise.muscleGroup)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle Fatigue</Text>

      {/* Current Exercise Fatigue */}
      {currentExerciseFatigue && (
        <View style={styles.currentExerciseSection}>
          <Text style={styles.sectionTitle}>Current Exercise</Text>
          <LinearGradient
            colors={['#1A1A2E', '#0F0F23']}
            style={styles.fatigueCard}
          >
            <View style={styles.fatigueHeader}>
              {getFatigueIcon(currentExerciseFatigue.fatigueLevel)}
              <Text style={styles.muscleGroup}>
                {currentExerciseFatigue.muscleGroup}
              </Text>
              <Text
                style={[
                  styles.fatigueLevel,
                  {
                    color: getFatigueColor(currentExerciseFatigue.fatigueLevel),
                  },
                ]}
              >
                {Math.round(currentExerciseFatigue.fatigueLevel)}%
              </Text>
            </View>
            <View style={styles.fatigueBar}>
              <View
                style={[
                  styles.fatigueProgress,
                  {
                    width: `${currentExerciseFatigue.fatigueLevel}%`,
                    backgroundColor: getFatigueColor(
                      currentExerciseFatigue.fatigueLevel
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.fatigueStatus}>
              {getFatigueStatus(currentExerciseFatigue.fatigueLevel)}
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* All Muscle Groups */}
      <View style={styles.allMusclesSection}>
        <Text style={styles.sectionTitle}>All Muscle Groups</Text>
        <View style={styles.muscleGrid}>
          {fatigueLevels.slice(0, 6).map((fatigue) => (
            <View key={fatigue.muscleGroup} style={styles.muscleItem}>
              <View style={styles.muscleHeader}>
                {getFatigueIcon(fatigue.fatigueLevel)}
                <Text style={styles.muscleName}>{fatigue.muscleGroup}</Text>
              </View>
              <Text
                style={[
                  styles.muscleFatigueLevel,
                  { color: getFatigueColor(fatigue.fatigueLevel) },
                ]}
              >
                {Math.round(fatigue.fatigueLevel)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <LinearGradient
          colors={['#1A1A2E', '#0F0F23']}
          style={styles.recommendationsCard}
        >
          {recommendations.restNeeded.length > 0 && (
            <View style={styles.recommendationItem}>
              <AlertTriangle size={16} color="#EF4444" />
              <Text style={styles.recommendationText}>
                Rest needed: {recommendations.restNeeded.join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.recommendationItem}>
            <Activity size={16} color="#10B981" />
            <Text style={styles.recommendationText}>
              Intensity: {recommendations.intensityAdjustment}
            </Text>
          </View>

          <View style={styles.recommendationItem}>
            <TrendingUp size={16} color="#3B82F6" />
            <Text style={styles.recommendationText}>
              {recommendations.nextExerciseSuggestion}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  currentExerciseSection: {
    marginBottom: 20,
  },
  fatigueCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  fatigueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  muscleGroup: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 8,
  },
  fatigueLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fatigueBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginBottom: 8,
  },
  fatigueProgress: {
    height: '100%',
    borderRadius: 3,
  },
  fatigueStatus: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  allMusclesSection: {
    marginBottom: 20,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  muscleItem: {
    width: '48%',
    backgroundColor: '#1A1A2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  muscleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  muscleName: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
    flex: 1,
  },
  muscleFatigueLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recommendationsSection: {
    marginBottom: 10,
  },
  recommendationsCard: {
    padding: 15,
    borderRadius: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 8,
    flex: 1,
  },
});
