import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';

const { width } = Dimensions.get('window');

type ClosureState = 'stay' | 'break' | 'emerge';

const closureStates = {
    stay: {
        icon: 'refresh-circle' as const,
        color: colors.calmBlue,
        animation: 'circleBloom',
        title: 'Circle Continues',
        message: 'Your circle will continue. Segments may reshuffle.',
    },
    break: {
        icon: 'moon' as const,
        color: colors.warmOrange,
        animation: 'lanternDrift',
        title: 'Circle Dissolves',
        message: 'The circle dissolves. Take the warmth with you.',
    },
    emerge: {
        icon: 'star' as const,
        color: colors.violetGlow,
        animation: 'archiveGlow',
        title: 'Memory Preserved',
        message: 'A memory is carried forward.',
    },
};

export default function EndOfCycle() {
    const router = useRouter();
    const { result } = useLocalSearchParams();
    const state = (result as ClosureState) || 'break';
    const closureData = closureStates[state];

    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [glowAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Fade in and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 10,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulsing glow animation
        Animated.loop(
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
        ).start();
    }, []);

    const handleContinue = () => {
        if (state === 'stay') {
            router.replace('/circle' as any);
        } else {
            router.replace('/circle-matching' as any);
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Animated Icon */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            opacity: glowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.6, 1],
                            }),
                            transform: [
                                {
                                    scale: glowAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.1],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={[styles.iconGlow, { backgroundColor: closureData.color + '20' }]} />
                    <Ionicons name={closureData.icon} size={96} color={closureData.color} />
                </Animated.View>

                {/* Title and Message */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{closureData.title}</Text>
                    <Text style={styles.message}>{closureData.message}</Text>
                </View>

                {/* Additional Info */}
                {state === 'stay' && (
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.calmBlue} />
                        <Text style={styles.infoText}>
                            Your circle members may be reshuffled for the next cycle
                        </Text>
                    </View>
                )}

                {state === 'emerge' && (
                    <View style={styles.infoCard}>
                        <Ionicons name="heart" size={20} color={colors.violetGlow} />
                        <Text style={styles.infoText}>
                            The selected voice has been saved to your personal archive
                        </Text>
                    </View>
                )}

                {state === 'break' && (
                    <View style={styles.infoCard}>
                        <Ionicons name="leaf-outline" size={20} color={colors.warmOrange} />
                        <Text style={styles.infoText}>
                            Thank you for sharing this journey. A new circle awaits.
                        </Text>
                    </View>
                )}
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    title={state === 'stay' ? 'Return to Circle' : 'Find New Circle'}
                    onPress={handleContinue}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.midnightBlack,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    iconContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
    },
    iconGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        opacity: 0.3,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
        fontSize: 32,
        color: colors.mutedWhite,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    message: {
        ...typography.body,
        fontSize: 18,
        color: colors.gray,
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: width * 0.8,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        maxWidth: width * 0.85,
    },
    infoText: {
        ...typography.body,
        fontSize: 14,
        color: colors.gray,
        flex: 1,
        marginLeft: spacing.sm,
        lineHeight: 20,
    },
    footer: {
        width: '100%',
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
});
