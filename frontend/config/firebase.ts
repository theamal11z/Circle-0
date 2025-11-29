import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyADCdw-9v7TrXoIBmn7elKzQGPUAkETcIs",
  authDomain: "circle-0-95ef1.firebaseapp.com",
  projectId: "circle-0-95ef1",
  storageBucket: "circle-0-95ef1.firebasestorage.app",
  messagingSenderId: "759817644020",
  appId: "1:759817644020:android:d325f1963fcc50cbbabba1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);

export const signInAnonymous = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw error;
  }
};
