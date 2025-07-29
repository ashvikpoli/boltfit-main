import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Clock, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { useNotifications } from '@/hooks/useNotifications';
import { useSettings } from '@/hooks/useSettings';

interface RestTimerModalProps {
  visible: boolean;
  duration?: number; // in seconds, optional - will use settings default
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RestTimerModal({
  visible,
  duration,
  onComplete,
  onSkip,
  onClose,
}: RestTimerModalProps) {
  const { settings } = useSettings();
  const {
    scheduleRestEndNotification,
    scheduleRestCompleteNotification,
    cancelRestNotifications,
  } = useNotifications();

  const restDuration = duration || settings.defaultRestTime;
  const [timeRemaining, setTimeRemaining] = useState(restDuration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (visible) {
      setTimeRemaining(restDuration);
      setIsRunning(true);
    }
  }, [visible, restDuration]);

  // Schedule notifications when timer starts
  useEffect(() => {
    if (visible && isRunning && timeRemaining > 0) {
      scheduleRestEndNotification(timeRemaining);
      scheduleRestCompleteNotification(timeRemaining);
    } else {
      cancelRestNotifications();
    }
  }, [visible, isRunning, timeRemaining]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (visible && isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            cancelRestNotifications();
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [visible, isRunning, timeRemaining, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((restDuration - timeRemaining) / restDuration) * 100;
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeRemaining(restDuration);
    setIsRunning(false);
    cancelRestNotifications();
  };

  const handleSkip = () => {
    cancelRestNotifications();
    onSkip();
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / restDuration) * 100;
    if (percentage > 50) return '#10B981'; // Green
    if (percentage > 25) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1A1A2E', '#0F0F23']}
            style={styles.gradient}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Clock size={24} color="#6B46C1" />
              <Text style={styles.title}>Rest Timer</Text>
            </View>

            {/* Circular Progress */}
            <View style={styles.timerContainer}>
              <View style={styles.circularProgress}>
                <Svg width={160} height={160} style={styles.svg}>
                  {/* Background Circle */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={70}
                    stroke="#1A1A2E"
                    strokeWidth={12}
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={70}
                    stroke={getTimerColor()}
                    strokeWidth={12}
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 70 * (1 - getProgressPercentage() / 100)
                    }`}
                    strokeLinecap="round"
                    transform={`rotate(-90 80 80)`}
                  />
                </Svg>

                <View style={styles.timerContent}>
                  <Text style={[styles.timeText, { color: getTimerColor() }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                  <Text style={styles.timeLabel}>remaining</Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage()}%`,
                      backgroundColor: getTimerColor(),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleReset}
              >
                <View style={styles.controlButtonContent}>
                  <RotateCcw size={20} color="#64748B" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <LinearGradient
                  colors={['#6B46C1', '#8B5CF6']}
                  style={styles.playButtonGradient}
                >
                  {isRunning ? (
                    <Pause size={24} color="#FFFFFF" />
                  ) : (
                    <Play size={24} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleSkip}
              >
                <View style={styles.controlButtonContent}>
                  <Text style={styles.skipText}>Skip</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Time Adjustments */}
            <View style={styles.quickTimes}>
              <Text style={styles.quickTimesLabel}>Quick adjust:</Text>
              <View style={styles.quickTimeButtons}>
                {[30, 60, 90, 120].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.quickTimeButton,
                      restDuration === time && styles.activeQuickTime,
                    ]}
                    onPress={() => {
                      setTimeRemaining(time);
                      setIsRunning(false);
                      cancelRestNotifications();
                    }}
                  >
                    <Text
                      style={[
                        styles.quickTimeText,
                        restDuration === time && styles.activeQuickTimeText,
                      ]}
                    >
                      {time < 60 ? `${time}s` : `${time / 60}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  timerContainer: {
    marginBottom: 32,
  },
  circularProgress: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  timerContent: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 16,
    color: '#94A3B8',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1A1A2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  controlButton: {
    marginHorizontal: 20,
  },
  controlButtonContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    marginHorizontal: 20,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  quickTimes: {
    alignItems: 'center',
  },
  quickTimesLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 16,
  },
  quickTimeButtons: {
    flexDirection: 'row',
  },
  quickTimeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    marginHorizontal: 6,
  },
  activeQuickTime: {
    backgroundColor: '#6B46C1',
  },
  quickTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeQuickTimeText: {
    color: '#FFFFFF',
  },
});
