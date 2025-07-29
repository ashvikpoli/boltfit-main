import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Target,
  Zap,
  MessageCircle,
  Activity,
} from 'lucide-react-native';
import {
  Exercise,
  ActiveWorkout,
  WorkoutSet,
  CompletedWorkout,
} from '@/types/workout';
import { exerciseLibrary } from '@/data/exercises';
import SetTracker from '@/components/SetTracker';
import RestTimerModal from '@/components/RestTimerModal';
import WorkoutSummary from '@/components/WorkoutSummary';
import BoltChat from '@/components/BoltChat';
import { useSupabaseWorkouts } from '@/hooks/useSupabaseWorkouts';
import {
  useSupabaseGamification,
  calculateWorkoutXP,
} from '@/hooks/useSupabaseGamification';
import { useAuth } from '@/hooks/useAuth';
import { FatigueCalculator } from '@/lib/fatigue';
import FatigueDisplay from '@/components/FatigueDisplay';

// Extended Exercise interface for AI-generated workouts
interface GeneratedExercise extends Exercise {
  generatedSets?: number;
  generatedReps?: number;
  generatedWeight?: number;
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { saveWorkout } = useSupabaseWorkouts();
  const { completeWorkout } = useSupabaseGamification();
  const { loadProfile, user } = useAuth();

  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null
  );
  const [currentExercise, setCurrentExercise] =
    useState<GeneratedExercise | null>(null);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedWorkout, setCompletedWorkout] =
    useState<CompletedWorkout | null>(null);
  const [generatedWorkoutData, setGeneratedWorkoutData] = useState<any>(null); // Store original generated workout data
  const [showFullOverview, setShowFullOverview] = useState(false); // State for full overview visibility
  const [showBoltChat, setShowBoltChat] = useState(false);
  const [fatigueCalculator, setFatigueCalculator] =
    useState<FatigueCalculator | null>(null);
  const [showFatigue, setShowFatigue] = useState(false);

  useEffect(() => {
    if (params.exerciseId) {
      const exercise = exerciseLibrary.find(
        (ex) => ex.id === params.exerciseId
      );
      if (exercise) {
        startWorkout([exercise]);
      }
    } else if (params.workoutData) {
      // Handle AI-generated workout
      const workoutData = JSON.parse(params.workoutData as string);
      console.log('Received workout data:', workoutData);

      // Store the original generated workout data
      setGeneratedWorkoutData(workoutData);

      const exercises = workoutData.exercises.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        description:
          typeof ex.instructions === 'string'
            ? ex.instructions
            : ex.instructions?.setup?.[0] ||
              ex.description ||
              'Exercise description not available',
        category: 'strength' as const,
        difficulty: ex.difficulty || 'beginner',
        targetMuscles: ex.targetMuscles || [],
        images: ex.images || {
          demonstration: '',
          thumbnail: '',
        },
        instructions: ex.instructions || {
          setup: [],
          execution: [],
        },
        // Store the generated parameters for this exercise
        generatedSets: ex.sets,
        generatedReps: ex.reps,
        generatedWeight: ex.weight,
      }));
      startWorkout(exercises);
    } else if (params.customWorkoutData) {
      // Handle custom workout
      const customWorkout = JSON.parse(params.customWorkoutData as string);
      const exercises = customWorkout.exercises.map((ex: any) => {
        const exercise = ex.exercise;
        // Ensure all required fields are present
        return {
          ...exercise,
          description:
            typeof exercise.description === 'string'
              ? exercise.description
              : exercise.instructions?.setup?.[0] ||
                'Exercise description not available',
          difficulty: exercise.difficulty || 'beginner',
          targetMuscles: exercise.targetMuscles || [],
          images: exercise.images || {
            demonstration: '',
            thumbnail: '',
          },
          instructions: exercise.instructions || {
            setup: [],
            execution: [],
          },
        };
      });
      startWorkout(exercises);
    }
  }, [params.exerciseId, params.workoutData, params.customWorkoutData]);

  const startWorkout = (exercises: GeneratedExercise[]) => {
    const workout: ActiveWorkout = {
      id: Date.now().toString(),
      startTime: new Date(),
      exercises,
      sets: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
    };

    // Initialize fatigue calculator
    const calculator = new FatigueCalculator();
    setFatigueCalculator(calculator);

    setActiveWorkout(workout);
    setCurrentExercise(exercises[0]);
  };

  const completeSet = (weight: number, reps: number) => {
    if (!activeWorkout || !currentExercise) return;

    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exerciseId: currentExercise.id,
      weight,
      reps,
      completed: true,
    };

    const updatedSets = [...activeWorkout.sets, newSet];

    // Calculate fatigue for the completed set
    if (fatigueCalculator && currentExercise) {
      const exerciseVolume = weight * reps;
      const exerciseDuration = 60; // Assume 60 seconds per set
      const restTime = 0; // Will be calculated based on previous exercise time

      // Calculate intensity (weight relative to a theoretical max)
      const estimatedMax = weight * (1 + reps / 30); // Epley formula approximation
      const intensity = Math.min(weight / estimatedMax, 1.0);

      fatigueCalculator.updateFatigue({
        exerciseIntensity: intensity,
        exerciseVolume: exerciseVolume,
        exerciseDuration: exerciseDuration,
        restTime: restTime,
        muscleGroup: currentExercise.muscleGroup,
        exerciseDifficulty: currentExercise.difficulty,
      });
    }

    // Count completed sets for current exercise
    const completedSetsForCurrentExercise = updatedSets.filter(
      (set) => set.exerciseId === currentExercise.id && set.completed
    ).length;

    // Get recommended sets for current exercise (from AI generation or default to 3)
    const recommendedSets =
      (currentExercise as GeneratedExercise).generatedSets || 3;

    const currentIndex = activeWorkout.currentExerciseIndex;

    setActiveWorkout({
      ...activeWorkout,
      sets: updatedSets,
      currentExerciseIndex: currentIndex, // Keep tracking index
    });

    // Check if we've completed all recommended sets for this exercise
    if (completedSetsForCurrentExercise >= recommendedSets) {
      // Show rest timer before moving to next exercise
      setShowRestTimer(true);
    } else {
      // Start rest period for next set of same exercise
      setCurrentSetNumber(currentSetNumber + 1);
      setShowRestTimer(true);
    }
  };

  const skipRest = () => {
    setShowRestTimer(false);
    // Check if we need to advance to next exercise
    if (activeWorkout && currentExercise) {
      const currentIndex = activeWorkout.currentExerciseIndex;
      const completedSetsForCurrentExercise = activeWorkout.sets.filter(
        (set) => set.exerciseId === currentExercise.id && set.completed
      ).length;
      const recommendedSets =
        (currentExercise as GeneratedExercise).generatedSets || 3;

      if (completedSetsForCurrentExercise >= recommendedSets) {
        // Move to next exercise
        const nextIndex = currentIndex + 1;
        if (nextIndex < activeWorkout.exercises.length) {
          const nextExercise = activeWorkout.exercises[
            nextIndex
          ] as GeneratedExercise;
          setCurrentExercise(nextExercise);
          setCurrentSetNumber(1);

          // Update the current exercise index
          setActiveWorkout((prev) =>
            prev
              ? {
                  ...prev,
                  currentExerciseIndex: nextIndex,
                }
              : null
          );
        } else {
          // All exercises completed
          finishWorkout();
        }
      }
    }
  };

  const completeRest = () => {
    setShowRestTimer(false);
    // Check if we need to advance to next exercise
    if (activeWorkout && currentExercise) {
      const currentIndex = activeWorkout.currentExerciseIndex;
      const completedSetsForCurrentExercise = activeWorkout.sets.filter(
        (set) => set.exerciseId === currentExercise.id && set.completed
      ).length;
      const recommendedSets =
        (currentExercise as GeneratedExercise).generatedSets || 3;

      if (completedSetsForCurrentExercise >= recommendedSets) {
        // Move to next exercise
        const nextIndex = currentIndex + 1;
        if (nextIndex < activeWorkout.exercises.length) {
          const nextExercise = activeWorkout.exercises[
            nextIndex
          ] as GeneratedExercise;
          setCurrentExercise(nextExercise);
          setCurrentSetNumber(1);

          // Update the current exercise index
          setActiveWorkout((prev) =>
            prev
              ? {
                  ...prev,
                  currentExerciseIndex: nextIndex,
                }
              : null
          );
        } else {
          // All exercises completed
          finishWorkout();
        }
      }
    }
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - activeWorkout.startTime.getTime()) / (1000 * 60)
    );
    const totalSets = activeWorkout.sets.length;

    // Use centralized XP calculation
    const xpGained = calculateWorkoutXP(
      totalSets,
      duration,
      activeWorkout.exercises.length
    );

    const workout: CompletedWorkout = {
      id: activeWorkout.id,
      date: activeWorkout.startTime,
      duration,
      exercises: activeWorkout.exercises,
      totalSets,
      xpGained,
    };

    setCompletedWorkout(workout);
    setShowSummary(true);
  };

  const handleSaveWorkout = async () => {
    if (completedWorkout) {
      try {
        console.log('Saving workout and awarding XP...');
        console.log('Workout XP shown in summary:', completedWorkout.xpGained);

        // Save to Supabase
        await saveWorkout({
          duration: completedWorkout.duration,
          exercises: completedWorkout.exercises,
          total_sets: completedWorkout.totalSets,
          xp_gained: completedWorkout.xpGained, // Make sure this matches the UI
        });

        // Update gamification stats and await completion
        const result = await completeWorkout(
          completedWorkout.exercises.map((ex) => ex.id),
          completedWorkout.duration,
          completedWorkout.totalSets
        );

        console.log('Workout saved and XP awarded:', result);
        console.log(
          'XP from UI:',
          completedWorkout.xpGained,
          'XP from gamification:',
          result.xpGained
        );

        // Verify they match
        if (completedWorkout.xpGained !== result.xpGained) {
          console.warn(
            'XP MISMATCH! UI shows:',
            completedWorkout.xpGained,
            'but awarded:',
            result.xpGained
          );
        }

        // Reload the profile to get updated XP and level
        if (loadProfile && user) {
          await loadProfile(user.id);
        }
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  };

  const handleEndWorkout = () => {
    Alert.alert('End Workout', 'Are you sure you want to end this workout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Workout', style: 'destructive', onPress: finishWorkout },
    ]);
  };

  const getPreviousSet = (): WorkoutSet | undefined => {
    if (!activeWorkout || !currentExercise) return undefined;

    const exerciseSets = activeWorkout.sets.filter(
      (set) => set.exerciseId === currentExercise.id
    );
    return exerciseSets[exerciseSets.length - 1];
  };

  const getCompletedSetsForExercise = (exerciseId: string): number => {
    if (!activeWorkout) return 0;
    return activeWorkout.sets.filter(
      (set) => set.exerciseId === exerciseId && set.completed
    ).length;
  };

  const getRecommendedSetsForExercise = (
    exercise: GeneratedExercise
  ): number => {
    return exercise.generatedSets || 3;
  };

  const isExerciseCompleted = (exercise: GeneratedExercise): boolean => {
    const completed = getCompletedSetsForExercise(exercise.id);
    const recommended = getRecommendedSetsForExercise(exercise);
    return completed >= recommended;
  };

  const getCurrentExerciseIndex = (): number => {
    if (!activeWorkout || !currentExercise) return 0;
    return activeWorkout.exercises.findIndex(
      (ex) => ex.id === currentExercise.id
    );
  };

  const getWorkoutDuration = () => {
    if (!activeWorkout) return '0:00';

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - activeWorkout.startTime.getTime()) / 1000
    );
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleWorkoutModified = (modifiedWorkout: any) => {
    // Update the active workout with modified exercises
    if (activeWorkout) {
      const updatedWorkout = {
        ...activeWorkout,
        exercises: modifiedWorkout.exercises,
      };
      setActiveWorkout(updatedWorkout);

      // Update generated workout data for context
      setGeneratedWorkoutData(modifiedWorkout);

      console.log('Active workout modified by Bolt:', modifiedWorkout);
    }
  };

  if (showSummary && completedWorkout) {
    return (
      <WorkoutSummary
        workout={completedWorkout}
        onClose={() => router.replace('/(tabs)')} // Navigate to home instead of back
        onSaveWorkout={handleSaveWorkout}
      />
    );
  }

  if (!activeWorkout || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#0F0F23']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {currentExercise?.name || 'Workout'}
            </Text>
            <Text style={styles.headerSubtitle}>{getWorkoutDuration()}</Text>
          </View>
          <TouchableOpacity style={styles.endButton} onPress={handleEndWorkout}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Video Player Section */}
          {currentExercise && (
            <View style={styles.videoSection}>
              <View style={styles.videoContainer}>
                {currentExercise.images?.demonstration ? (
                  <Image
                    source={{ uri: currentExercise.images.demonstration }}
                    style={styles.videoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoPlaceholderText}>No Video</Text>
                  </View>
                )}

                {/* Video Controls Overlay */}
                <View style={styles.videoControls}>
                  <TouchableOpacity style={styles.howToButton}>
                    <Text style={styles.howToButtonText}>How-To</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeVideoButton}>
                    <Text style={styles.closeVideoText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>1:30 Rest</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Activity size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <RotateCcw size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Sets Logging Section */}
          {currentExercise && (
            <View style={styles.setsSection}>
              <Text style={styles.setsTitle}>Log Sets</Text>

              {/* Generate sets based on recommended sets */}
              {Array.from(
                {
                  length:
                    (currentExercise as GeneratedExercise).generatedSets || 3,
                },
                (_, index) => {
                  const setNumber = index + 1;
                  const isCompleted =
                    getCompletedSetsForExercise(currentExercise.id) >=
                    setNumber;
                  const isCurrentSet = setNumber === currentSetNumber;

                  return (
                    <View key={setNumber} style={styles.setRow}>
                      <View style={styles.setHeader}>
                        {isCompleted ? (
                          <View style={styles.completedSetIndicator}>
                            <Text style={styles.completedSetText}>✓</Text>
                          </View>
                        ) : (
                          <View style={styles.setNumberIndicator}>
                            <Text style={styles.setNumberText}>
                              {setNumber}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.setInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <Text style={styles.inputValue}>
                            {(currentExercise as GeneratedExercise)
                              .generatedReps || 10}
                          </Text>
                          {setNumber === 2 && (
                            <Text style={styles.inputSubtext}>Per Side</Text>
                          )}
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Weight (lb)</Text>
                          <Text style={styles.inputValue}>
                            {(currentExercise as GeneratedExercise)
                              .generatedWeight || 45}
                          </Text>
                          {setNumber === 2 && (
                            <Text style={styles.inputSubtext}>
                              Bar + Plates
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          )}

          {/* Next Exercises Section */}
          {activeWorkout && activeWorkout.exercises.length > 1 && (
            <View style={styles.nextExercisesSection}>
              <Text style={styles.sectionTitle}>
                Next Exercises (
                {activeWorkout.exercises.length -
                  (getCurrentExerciseIndex() + 1)}{' '}
                remaining)
              </Text>

              {/* Show next 3 exercises */}
              {activeWorkout.exercises
                .slice(
                  getCurrentExerciseIndex() + 1,
                  getCurrentExerciseIndex() + 4
                )
                .map((exercise, index) => {
                  const actualIndex = getCurrentExerciseIndex() + 1 + index;
                  const completedSets = getCompletedSetsForExercise(
                    exercise.id
                  );
                  const recommendedSets = getRecommendedSetsForExercise(
                    exercise as GeneratedExercise
                  );

                  return (
                    <View key={exercise.id} style={styles.nextExerciseCard}>
                      <LinearGradient
                        colors={['#1A1A2E', '#0F0F23']}
                        style={styles.nextExerciseGradient}
                      >
                        <View style={styles.nextExerciseHeader}>
                          <View style={styles.nextExerciseNumber}>
                            <Text style={styles.nextExerciseNumberText}>
                              {actualIndex + 1}
                            </Text>
                          </View>
                          <View style={styles.nextExerciseInfo}>
                            <Text style={styles.nextExerciseName}>
                              {exercise.name}
                            </Text>
                            <Text style={styles.nextExerciseDetails}>
                              {(exercise as GeneratedExercise).generatedSets ||
                                3}{' '}
                              sets •{' '}
                              {(exercise as GeneratedExercise).generatedReps ||
                                10}{' '}
                              reps
                              {(exercise as GeneratedExercise)
                                .generatedWeight &&
                                ` • ${
                                  (exercise as GeneratedExercise)
                                    .generatedWeight
                                } lb`}
                            </Text>
                            <Text style={styles.nextExerciseMuscle}>
                              {exercise.muscleGroup}
                            </Text>
                          </View>
                          <View style={styles.nextExerciseStatus}>
                            {isExerciseCompleted(
                              exercise as GeneratedExercise
                            ) ? (
                              <View style={styles.completedBadge}>
                                <Text style={styles.completedBadgeText}>✓</Text>
                              </View>
                            ) : (
                              <Text style={styles.nextExerciseProgress}>
                                {completedSets}/{recommendedSets}
                              </Text>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  );
                })}

              {/* Show remaining count if more than 3 */}
              {activeWorkout.exercises.length -
                (getCurrentExerciseIndex() + 1) >
                3 && (
                <View style={styles.moreExercisesCard}>
                  <Text style={styles.moreExercisesText}>
                    +
                    {activeWorkout.exercises.length -
                      (getCurrentExerciseIndex() + 4)}{' '}
                    more exercises
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Full Workout Overview (Collapsible) */}
          {activeWorkout && activeWorkout.exercises.length > 1 && (
            <View style={styles.workoutOverviewSection}>
              <TouchableOpacity
                style={styles.workoutOverviewHeader}
                onPress={() => setShowFullOverview(!showFullOverview)}
              >
                <Text style={styles.sectionTitle}>Full Workout Overview</Text>
                <Text style={styles.toggleText}>
                  {showFullOverview ? 'Hide' : 'Show All'}
                </Text>
              </TouchableOpacity>

              {showFullOverview && (
                <View style={styles.workoutOverviewCard}>
                  <LinearGradient
                    colors={['#1A1A2E', '#0F0F23']}
                    style={styles.workoutOverviewGradient}
                  >
                    {activeWorkout.exercises.map((exercise, index) => {
                      const completedSets = getCompletedSetsForExercise(
                        exercise.id
                      );
                      const recommendedSets = getRecommendedSetsForExercise(
                        exercise as GeneratedExercise
                      );
                      const isCurrent = index === getCurrentExerciseIndex();
                      const isCompleted = isExerciseCompleted(
                        exercise as GeneratedExercise
                      );

                      return (
                        <View
                          key={exercise.id}
                          style={[
                            styles.overviewExerciseItem,
                            isCurrent && styles.currentOverviewItem,
                            isCompleted && styles.completedOverviewItem,
                          ]}
                        >
                          <View style={styles.overviewExerciseNumber}>
                            <Text
                              style={[
                                styles.overviewExerciseNumberText,
                                isCurrent && styles.currentOverviewText,
                                isCompleted && styles.completedOverviewText,
                              ]}
                            >
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.overviewExerciseInfo}>
                            <Text
                              style={[
                                styles.overviewExerciseName,
                                isCurrent && styles.currentOverviewText,
                                isCompleted && styles.completedOverviewText,
                              ]}
                            >
                              {exercise.name}
                            </Text>
                            <Text
                              style={[
                                styles.overviewExerciseDetails,
                                isCurrent && styles.currentOverviewSubtext,
                                isCompleted && styles.completedOverviewSubtext,
                              ]}
                            >
                              {exercise.muscleGroup}
                            </Text>
                          </View>
                          <View style={styles.overviewExerciseProgress}>
                            <Text
                              style={[
                                styles.overviewProgressText,
                                isCurrent && styles.currentOverviewText,
                                isCompleted && styles.completedOverviewText,
                              ]}
                            >
                              {completedSets}/{recommendedSets}
                            </Text>
                            {isCompleted && (
                              <Text style={styles.completedCheckmark}>✓</Text>
                            )}
                            {isCurrent && (
                              <Text style={styles.currentIndicator}>●</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </LinearGradient>
                </View>
              )}
            </View>
          )}

          {/* Workout Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Workout Progress</Text>
            <View style={styles.progressCard}>
              <LinearGradient
                colors={['#1A1A2E', '#0F0F23']}
                style={styles.progressGradient}
              >
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Clock size={20} color="#3B82F6" />
                    <Text style={styles.progressValue}>
                      {getWorkoutDuration()}
                    </Text>
                    <Text style={styles.progressLabel}>Duration</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Target size={20} color="#10B981" />
                    <Text style={styles.progressValue}>
                      {activeWorkout.sets.length}
                    </Text>
                    <Text style={styles.progressLabel}>Sets</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Zap size={20} color="#F59E0B" />
                    <Text style={styles.progressValue}>
                      {activeWorkout.exercises.length}
                    </Text>
                    <Text style={styles.progressLabel}>Exercises</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.logAllButton}>
              <Text style={styles.logAllButtonText}>Log All Sets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logSetButton}
              onPress={() =>
                completeSet(
                  (currentExercise as GeneratedExercise).generatedWeight || 45,
                  (currentExercise as GeneratedExercise).generatedReps || 10
                )
              }
            >
              <Text style={styles.logSetButtonText}>Log Set</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Chat with Bolt Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setShowBoltChat(true)}
        >
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6']}
            style={styles.chatButtonGradient}
          >
            <MessageCircle size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bolt Chat Modal */}
        <BoltChat
          visible={showBoltChat}
          onClose={() => setShowBoltChat(false)}
          currentWorkout={generatedWorkoutData}
          onWorkoutModified={handleWorkoutModified}
        />

        {/* Rest Timer Modal */}
        <RestTimerModal
          visible={showRestTimer}
          onComplete={completeRest}
          onSkip={skipRest}
          onClose={() => setShowRestTimer(false)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
  },

  endButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  videoSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  videoControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  howToButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  howToButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  closeVideoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeVideoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  setsSection: {
    marginBottom: 20,
  },
  setsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  setHeader: {
    marginRight: 16,
  },
  setNumberIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedSetIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedSetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  inputValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputSubtext: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  logAllButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logSetButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logSetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
