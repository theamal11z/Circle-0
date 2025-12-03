import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

interface CircularProgressProps {
  size?: number;
  animated?: boolean;
}

export function CircularProgress({ size = 200, animated = true }: CircularProgressProps) {
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!animated) return;

    // Rotation animation
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    rotation.start();
    pulse.start();
    glow.start();

    return () => {
      rotation.stop();
      pulse.stop();
      glow.stop();
    };
  }, [animated]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Main rotating circle */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate: spin }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Inner gradient effect */}
        <View style={styles.innerCircle}>
          <Ionicons name="radio-outline" size={size * 0.4} color={colors.violetGlow} />
        </View>
      </Animated.View>

      {/* Decorative dots */}
      {[0, 1, 2, 3, 4, 5, 6].map((index) => {
        const angle = (360 / 7) * index;
        const radian = (angle * Math.PI) / 180;
        const x = Math.cos(radian) * (size / 2 - 10);
        const y = Math.sin(radian) * (size / 2 - 10);

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                left: size / 2 + x - 4,
                top: size / 2 + y - 4,
                opacity: glowOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: colors.violetGlow,
    opacity: 0.2,
  },
  circle: {
    borderWidth: 3,
    borderColor: colors.violetGlow,
    backgroundColor: colors.deepIndigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.calmBlue,
  },
});
