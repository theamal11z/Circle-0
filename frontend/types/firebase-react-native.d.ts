declare module 'firebase/auth/react-native' {
  import type { FirebaseApp } from 'firebase/app';
  import type { Auth } from 'firebase/auth';

  export function initializeAuth(app: FirebaseApp, deps?: { persistence?: any }): Auth;
  export function getReactNativePersistence(storage: any): any;
}
