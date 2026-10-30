import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';

let auth;
export function accountAuth() {
  if (auth) return auth;
  const bindings = { API_KEY:import.meta.env.VITE_FIREBASE_API_KEY, AUTH_DOMAIN:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, PROJECT_ID:import.meta.env.VITE_FIREBASE_PROJECT_ID, APP_ID:import.meta.env.VITE_FIREBASE_APP_ID };
  for (const [key,value] of Object.entries(bindings)) if (!value) throw new Error(`Account configuration requires VITE_FIREBASE_${key}.`);
  const app = getApps()[0] || initializeApp({ apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID });
  return (auth = getAuth(app));
}
export const observeIdentity = callback => onAuthStateChanged(accountAuth(), callback);
export const googleSignIn = () => signInWithPopup(accountAuth(), new GoogleAuthProvider());
export const emailSignIn = (email, password) => signInWithEmailAndPassword(accountAuth(), email, password);
export const emailCreate = (email, password) => createUserWithEmailAndPassword(accountAuth(), email, password);
export const emailReset = email => sendPasswordResetEmail(accountAuth(), email);
export const acceptDeviceToken = token => signInWithCustomToken(accountAuth(), token);
export const accountSignOut = () => signOut(accountAuth());
