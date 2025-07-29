export interface MuscleFatigue {
  muscleGroup: string;
  fatigueLevel: number; // 0-100, where 100 is completely fatigued
  lastExerciseTime: number; // timestamp of last exercise targeting this muscle
  totalVolume: number; // total weight × reps for this muscle group
  exerciseCount: number; // number of exercises targeting this muscle
  recoveryRate: number; // fatigue recovery per minute
}

export interface FatigueFactors {
  exerciseIntensity: number; // 0-1 based on weight relative to max
  exerciseVolume: number; // weight × reps
  exerciseDuration: number; // time spent on exercise in seconds
  restTime: number; // rest time since last exercise in seconds
  muscleGroup: string;
  exerciseDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Base fatigue rates for different muscle groups (per set)
const MUSCLE_FATIGUE_RATES: Record<string, number> = {
  Chest: 15,
  Back: 12,
  Shoulders: 18,
  Biceps: 20,
  Triceps: 18,
  Legs: 10,
  Core: 8,
  Calves: 25,
  Hamstrings: 12,
  Quadriceps: 10,
  Glutes: 8,
  Forearms: 30,
  Traps: 15,
  Lats: 12,
  Deltoids: 18,
  Pectorals: 15,
  Abdominals: 8,
  Obliques: 10,
  'Lower Back': 12,
  'Upper Back': 12,
};

// Recovery rates per minute for different muscle groups
const MUSCLE_RECOVERY_RATES: Record<string, number> = {
  Chest: 2.5,
  Back: 3.0,
  Shoulders: 2.0,
  Biceps: 1.5,
  Triceps: 2.0,
  Legs: 4.0,
  Core: 5.0,
  Calves: 1.0,
  Hamstrings: 3.0,
  Quadriceps: 4.0,
  Glutes: 4.5,
  Forearms: 0.5,
  Traps: 2.5,
  Lats: 3.0,
  Deltoids: 2.0,
  Pectorals: 2.5,
  Abdominals: 5.0,
  Obliques: 4.0,
  'Lower Back': 3.0,
  'Upper Back': 3.0,
};

// Difficulty multipliers
const DIFFICULTY_MULTIPLIERS = {
  beginner: 0.8,
  intermediate: 1.0,
  advanced: 1.3,
};

export class FatigueCalculator {
  private muscleFatigue: Map<string, MuscleFatigue> = new Map();
  private workoutStartTime: number;

  constructor() {
    this.workoutStartTime = Date.now();
  }

  // Calculate fatigue increase from completing a set
  calculateFatigueIncrease(factors: FatigueFactors): number {
    const baseRate = MUSCLE_FATIGUE_RATES[factors.muscleGroup] || 10;
    const difficultyMultiplier =
      DIFFICULTY_MULTIPLIERS[factors.exerciseDifficulty];

    // Volume factor (higher volume = more fatigue)
    const volumeFactor = Math.min(factors.exerciseVolume / 1000, 2.0);

    // Intensity factor (higher intensity = more fatigue)
    const intensityFactor = factors.exerciseIntensity * 1.5;

    // Duration factor (longer exercises = more fatigue)
    const durationFactor = Math.min(factors.exerciseDuration / 60, 1.5);

    // Rest factor (less rest = more fatigue)
    const restFactor = Math.max(1.0 - factors.restTime / 300, 0.5); // 5 minutes = full rest

    const fatigueIncrease =
      baseRate *
      difficultyMultiplier *
      volumeFactor *
      intensityFactor *
      durationFactor *
      restFactor;

    return Math.min(fatigueIncrease, 50); // Cap at 50% per set
  }

  // Update fatigue levels after completing a set
  updateFatigue(factors: FatigueFactors): void {
    const muscleGroup = factors.muscleGroup;
    const currentTime = Date.now();

    // Get or create fatigue tracking for this muscle group
    let fatigue = this.muscleFatigue.get(muscleGroup);
    if (!fatigue) {
      fatigue = {
        muscleGroup,
        fatigueLevel: 0,
        lastExerciseTime: currentTime,
        totalVolume: 0,
        exerciseCount: 0,
        recoveryRate: MUSCLE_RECOVERY_RATES[muscleGroup] || 2.0,
      };
    }

    // Calculate recovery since last exercise
    const timeSinceLastExercise =
      (currentTime - fatigue.lastExerciseTime) / 1000 / 60; // in minutes
    const recovery = timeSinceLastExercise * fatigue.recoveryRate;
    fatigue.fatigueLevel = Math.max(0, fatigue.fatigueLevel - recovery);

    // Calculate new fatigue increase
    const fatigueIncrease = this.calculateFatigueIncrease(factors);

    // Update fatigue level
    fatigue.fatigueLevel = Math.min(
      100,
      fatigue.fatigueLevel + fatigueIncrease
    );
    fatigue.lastExerciseTime = currentTime;
    fatigue.totalVolume += factors.exerciseVolume;
    fatigue.exerciseCount += 1;

    this.muscleFatigue.set(muscleGroup, fatigue);
  }

  // Get current fatigue level for a muscle group
  getFatigueLevel(muscleGroup: string): number {
    const fatigue = this.muscleFatigue.get(muscleGroup);
    if (!fatigue) return 0;

    // Calculate current fatigue with recovery
    const currentTime = Date.now();
    const timeSinceLastExercise =
      (currentTime - fatigue.lastExerciseTime) / 1000 / 60;
    const recovery = timeSinceLastExercise * fatigue.recoveryRate;

    return Math.max(0, fatigue.fatigueLevel - recovery);
  }

  // Get fatigue status for all muscle groups
  getAllFatigueLevels(): MuscleFatigue[] {
    const currentTime = Date.now();
    return Array.from(this.muscleFatigue.values()).map((fatigue) => {
      const timeSinceLastExercise =
        (currentTime - fatigue.lastExerciseTime) / 1000 / 60;
      const recovery = timeSinceLastExercise * fatigue.recoveryRate;
      const currentFatigue = Math.max(0, fatigue.fatigueLevel - recovery);

      return {
        ...fatigue,
        fatigueLevel: currentFatigue,
      };
    });
  }

  // Get fatigue status for muscle groups involved in an exercise
  getExerciseFatigue(exercise: {
    muscleGroup: string;
    targetMuscles?: string[];
  }): {
    primaryFatigue: number;
    secondaryFatigue: number;
    overallFatigue: number;
  } {
    const primaryFatigue = this.getFatigueLevel(exercise.muscleGroup);

    let secondaryFatigue = 0;
    let secondaryCount = 0;

    if (exercise.targetMuscles) {
      exercise.targetMuscles.forEach((muscle) => {
        if (muscle !== exercise.muscleGroup) {
          secondaryFatigue += this.getFatigueLevel(muscle);
          secondaryCount++;
        }
      });
    }

    const avgSecondaryFatigue =
      secondaryCount > 0 ? secondaryFatigue / secondaryCount : 0;
    const overallFatigue = primaryFatigue * 0.7 + avgSecondaryFatigue * 0.3;

    return {
      primaryFatigue,
      secondaryFatigue: avgSecondaryFatigue,
      overallFatigue,
    };
  }

  // Get fatigue recommendations
  getFatigueRecommendations(): {
    restNeeded: string[];
    intensityAdjustment: string;
    nextExerciseSuggestion: string;
  } {
    const allFatigue = this.getAllFatigueLevels();
    const highFatigue = allFatigue.filter((f) => f.fatigueLevel > 70);
    const moderateFatigue = allFatigue.filter(
      (f) => f.fatigueLevel > 40 && f.fatigueLevel <= 70
    );

    const restNeeded = highFatigue.map(
      (f) => `${f.muscleGroup} (${Math.round(f.fatigueLevel)}% fatigue)`
    );

    let intensityAdjustment = 'maintain';
    if (highFatigue.length > 0) {
      intensityAdjustment = 'reduce';
    } else if (moderateFatigue.length > 0) {
      intensityAdjustment = 'moderate';
    }

    const nextExerciseSuggestion = this.getNextExerciseSuggestion(allFatigue);

    return {
      restNeeded,
      intensityAdjustment,
      nextExerciseSuggestion,
    };
  }

  private getNextExerciseSuggestion(allFatigue: MuscleFatigue[]): string {
    const lowFatigueMuscles = allFatigue.filter((f) => f.fatigueLevel < 30);

    if (lowFatigueMuscles.length === 0) {
      return 'Consider a different muscle group or take a longer rest';
    }

    const sortedByFatigue = lowFatigueMuscles.sort(
      (a, b) => a.fatigueLevel - b.fatigueLevel
    );
    return `Consider targeting ${sortedByFatigue[0].muscleGroup} (${Math.round(
      sortedByFatigue[0].fatigueLevel
    )}% fatigue)`;
  }

  // Reset fatigue for a new workout
  resetFatigue(): void {
    this.muscleFatigue.clear();
    this.workoutStartTime = Date.now();
  }

  // Get workout duration in minutes
  getWorkoutDuration(): number {
    return (Date.now() - this.workoutStartTime) / 1000 / 60;
  }
}
