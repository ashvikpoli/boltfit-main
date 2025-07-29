export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'hiit';
  // New image and instruction fields
  images: {
    demonstration: string; // Main demonstration image/gif path
    thumbnail: string; // Smaller thumbnail for lists
    startPosition?: string; // Optional start position image
    endPosition?: string; // Optional end position image
  };
  instructions: {
    setup: string[]; // Step-by-step setup instructions
    execution: string[]; // Step-by-step execution instructions
    tips?: string[]; // Optional form tips
    commonMistakes?: string[]; // Optional common mistakes to avoid
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[]; // Primary and secondary muscles
  videoUrl?: string; // Optional video demonstration URL
  sets?: number; // Number of sets for this exercise
  reps?: number; // Number of reps per set
  weight?: number; // Weight in pounds
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight?: number;
  reps?: number;
  duration?: number; // for time-based exercises
  completed: boolean;
  restTime?: number;
}

export interface ActiveWorkout {
  id: string;
  startTime: Date;
  exercises: Exercise[];
  sets: WorkoutSet[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restTimeRemaining: number;
  fatigueCalculator?: any; // FatigueCalculator instance
}

export interface CompletedWorkout {
  id: string;
  date: Date;
  duration: number; // in minutes
  exercises: Exercise[];
  totalSets: number;
  xpGained: number;
  notes?: string;
}

export interface WorkoutPreferences {
  defaultRestTime: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoStartRest: boolean;
}
