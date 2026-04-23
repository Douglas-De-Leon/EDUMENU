import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLadD0S9JLKvOH-Qe2eRin-T25lZb0Uxk",
  authDomain: "edumenu-7310d.firebaseapp.com",
  projectId: "edumenu-7310d",
  storageBucket: "edumenu-7310d.firebasestorage.app",
  messagingSenderId: "550246472437",
  appId: "1:550246472437:web:086e9aafe4486f5b2643bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
