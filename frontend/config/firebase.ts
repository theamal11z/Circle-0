import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDNbOcA2qy2G6lmdR-zHGBgO2h2wZ3-rKg",
  authDomain: "aura-circles-app.firebaseapp.com",
  projectId: "aura-circles-app",
  storageBucket: "aura-circles-app.firebasestorage.app",
  messagingSenderId: "1040890806838",
  appId: "1:1040890806838:web:d15fe8e25bbb43bd6c0eb3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const signInAnonymous = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};
