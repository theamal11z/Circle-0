import { Platform } from 'react-native';

// Dynamically require the platform-specific Firebase module so web builds do not
// attempt to resolve the React Native subpath.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mod = Platform.OS === 'web' ? require('./firebase.web') : require('./firebase.native');

export const auth = mod.auth;
export const storage = mod.storage;
export const firestore = mod.firestore;
export const signInAnonymous = mod.signInAnonymous;
export const signUpWithEmail = mod.signUpWithEmail;
export const signInWithEmail = mod.signInWithEmail;
export const signOut = mod.signOut;
