import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@circle0_user';
const ONBOARDING_STORAGE_KEY = '@circle0_onboarding';
const VOICE_MASK_STORAGE_KEY = '@circle0_voice_mask';
const SETTINGS_STORAGE_KEY = '@circle0_settings';

interface User {
  id: string;
  anonymousId: string;
  createdAt: string;
}

interface Circle {
  _id: string;
  circleId: string;
  day: number;
  status: string;
  participants: string[];
  createdAt: string;
}

interface Message {
  _id: string;
  circleId: string;
  authorId: string;
  segmentIndex: number;
  audioUrl: string;
  durationMs: number;
  createdAt: string;
  hasNew?: boolean;
}

interface UserSettings {
  anonymousMode: boolean;
  audioRetention: boolean;
  notificationsEnabled: boolean;
}

type VoiceMask = 'raw' | 'soft-echo' | 'warm-blur' | 'deep-calm' | 'synthetic-whisper';

interface AppState {
  user: User | null;
  currentCircle: Circle | null;
  messages: Message[];
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  sessionRestored: boolean;
  voiceMask: VoiceMask;
  settings: UserSettings;
  setUser: (user: User | null) => void;
  setCurrentCircle: (circle: Circle | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  completeOnboarding: () => void;
  setVoiceMask: (mask: VoiceMask) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentCircle: null,
  messages: [],
  isLoading: false,
  hasCompletedOnboarding: false,
  sessionRestored: false,
  voiceMask: 'raw',
  settings: {
    anonymousMode: true,
    audioRetention: true,
    notificationsEnabled: true,
  },
  setUser: async (user) => {
    set({ user });
    // Persist user to AsyncStorage
    if (user) {
      await persistUser(user);
    } else {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  },
  setCurrentCircle: (circle) => set({ currentCircle: circle }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },
  setVoiceMask: async (mask) => {
    set({ voiceMask: mask });
    await AsyncStorage.setItem(VOICE_MASK_STORAGE_KEY, mask);
  },
  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    const currentSettings = useStore.getState().settings;
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
  },
  reset: async () => {
    await AsyncStorage.multiRemove([
      USER_STORAGE_KEY,
      VOICE_MASK_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
    ]);
    set({
      user: null,
      currentCircle: null,
      messages: [],
      isLoading: false,
      voiceMask: 'raw',
      settings: {
        anonymousMode: true,
        audioRetention: true,
        notificationsEnabled: true,
      },
    });
  },
}));

// Persist user to AsyncStorage
export const persistUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error persisting user:', error);
  }
};

// Load user session from AsyncStorage
export const loadUserSession = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
      const user = JSON.parse(userJson);
      useStore.setState({ user, sessionRestored: true });
      return user;
    }
    useStore.setState({ sessionRestored: true });
    return null;
  } catch (error) {
    console.error('Error loading user session:', error);
    useStore.setState({ sessionRestored: true });
    return null;
  }
};

// Load onboarding status on app start
export const loadOnboardingStatus = async () => {
  try {
    const status = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (status === 'true') {
      useStore.setState({ hasCompletedOnboarding: true });
    }
  } catch (error) {
    console.error('Error loading onboarding status:', error);
  }
};

// Load voice mask preference
export const loadVoiceMask = async () => {
  try {
    const mask = await AsyncStorage.getItem(VOICE_MASK_STORAGE_KEY);
    if (mask) {
      useStore.setState({ voiceMask: mask as VoiceMask });
    }
  } catch (error) {
    console.error('Error loading voice mask:', error);
  }
};

// Load user settings
export const loadUserSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      useStore.setState({ settings });
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
  }
};
