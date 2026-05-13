import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCxAHAUArgFCYsbW93AFJCsgYcCvatuZqk",
  authDomain: "cherify-2dd24.firebaseapp.com",
  projectId: "cherify-2dd24",
  storageBucket: "cherify-2dd24.firebasestorage.app",
  messagingSenderId: "680066994707",
  appId: "1:680066994707:web:b84fde9542b2986b99e5e6",
  measurementId: "G-95FQP22B2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
