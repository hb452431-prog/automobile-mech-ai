import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyANes49BmFXG7KvaIyBooWUFT-Mx6RqPlM",
  authDomain: "mechgo-7d989.firebaseapp.com",
  projectId: "mechgo-7d989",
  storageBucket: "mechgo-7d989.firebasestorage.app",
  messagingSenderId: "203093703187",
  appId: "1:203093703187:web:463453e0bae61b30751de6",
  measurementId: "G-67KMY4PDZL"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  type FirebaseUser
};
