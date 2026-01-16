// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBg3EZmgwuWHRe-WSnjLtAzbD0iReB6KJU",
  authDomain: "dance-library-5c23g.firebaseapp.com",
  projectId: "dance-library-5c23g",
  storageBucket: "dance-library-5c23g.firebasestorage.app",
  messagingSenderId: "202380657736",
  appId: "1:202380657736:web:1de718c7316db60c64047d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
