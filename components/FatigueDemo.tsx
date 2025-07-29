import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FatigueCalculator } from '@/lib/fatigue';

export default function FatigueDemo() {
  const [calculator, setCalculator] = useState<FatigueCalculator | null>(null);
  const [fatigueLevels, setFatigueLevels] = useState<any[]>([]);

  useEffect(() => {
    const calc = new FatigueCalculator();
    setCalculator(calc);
  }, []);

  const simulateExercise = () => {
    if (!calculator) return;

    // Simulate completing a bench press set
    calculator.updateFatigue({
      exerciseIntensity: 0.8,
      exerciseVolume: 200 * 8, // 200 lbs × 8 reps
      exerciseDuration: 60,
      restTime: 120,
      muscleGroup: 'Chest',
      exerciseDifficulty: 'intermediate',
    });

    setFatigueLevels(calculator.getAllFatigueLevels());
  };

  const simulateRest = () => {
    if (!calculator) return;

    // Simulate 5 minutes of rest
    const currentTime = Date.now();
    const restTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Manually update the last exercise time to simulate rest
    const chestFatigue = calculator['muscleFatigue'].get('Chest');
    if (chestFatigue) {
      chestFatigue.lastExerciseTime = currentTime - restTime;
      calculator['muscleFatigue'].set('Chest', chestFatigue);
    }

    setFatigueLevels(calculator.getAllFatigueLevels());
  };

  const resetFatigue = () => {
    if (!calculator) return;
    calculator.resetFatigue();
    setFatigueLevels([]);
  };

  if (!calculator) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading Fatigue Calculator...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fatigue System Demo</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={simulateExercise}>
          <Text style={styles.buttonText}>Simulate Bench Press Set</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={simulateRest}>
          <Text style={styles.buttonText}>Simulate 5min Rest</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetFatigue}>
          <Text style={styles.buttonText}>Reset Fatigue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fatigueContainer}>
        <Text style={styles.sectionTitle}>Current Fatigue Levels:</Text>
        {fatigueLevels.map((fatigue) => (
          <View key={fatigue.muscleGroup} style={styles.fatigueItem}>
            <Text style={styles.muscleName}>{fatigue.muscleGroup}</Text>
            <Text style={styles.fatigueLevel}>
              {Math.round(fatigue.fatigueLevel)}%
            </Text>
          </View>
        ))}
        {fatigueLevels.length === 0 && (
          <Text style={styles.noFatigue}>No fatigue data yet</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • Each exercise increases fatigue based on intensity, volume, and
          muscle group
        </Text>
        <Text style={styles.infoText}>
          • Different muscle groups have different fatigue rates and recovery
          rates
        </Text>
        <Text style={styles.infoText}>
          • Fatigue decreases over time during rest periods
        </Text>
        <Text style={styles.infoText}>
          • The system provides recommendations for rest and exercise selection
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0F0F23',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#6B46C1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  fatigueContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  fatigueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A2E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  muscleName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fatigueLevel: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  noFatigue: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#1A1A2E',
    padding: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    lineHeight: 20,
  },
});
