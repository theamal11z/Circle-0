import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

interface BreathingWaveProps {
    size?: number;
}

export function BreathingWave({ size = 80 }: BreathingWaveProps) {
    const [breatheAnim] = useState(new Animated.Value(0));
    const [rotateAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Breathing animation
        const breathe = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        );

        // Slow rotation
        const rotate = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 8000,
                useNativeDriver: true,
            })
        );

        breathe.start();
        rotate.start();

        return () => {
            breathe.stop();
            rotate.stop();
        };
    }, []);

    const scale = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    const opacity = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
    });

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Outer wave ring */}
            <Animated.View
                style={[
                    styles.waveRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale }, { rotate: spin }],
                        opacity,
                    },
                ]}
            />

            {/* Inner icon */}
            <View style={styles.iconContainer}>
                <Ionicons name="radio-outline" size={size * 0.5} color={colors.violetGlow} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    waveRing: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: colors.violetGlow,
        backgroundColor: colors.violetGlow + '20',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
