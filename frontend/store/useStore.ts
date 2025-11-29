import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface AppState {
  user: User | null;
  currentCircle: Circle | null;
  messages: Message[];
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setUser: (user: User | null) => void;
  setCurrentCircle: (circle: Circle | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentCircle: null,
  messages: [],
  isLoading: false,
  hasCompletedOnboarding: false,
  setUser: (user) => set({ user }),
  setCurrentCircle: (circle) => set({ currentCircle: circle }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  completeOnboarding: async () => {
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    set({ hasCompletedOnboarding: true });
  },
  reset: () => set({ user: null, currentCircle: null, messages: [], isLoading: false }),
}));

// Load onboarding status on app start
export const loadOnboardingStatus = async () => {
  const status = await AsyncStorage.getItem('hasCompletedOnboarding');
  if (status === 'true') {
    useStore.setState({ hasCompletedOnboarding: true });
  }
};
