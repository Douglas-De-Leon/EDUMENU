import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1fHcDrcuX1Df73EIU7qV2lMyZbi-R9Xw",
  authDomain: "eduvotacao-d2486.firebaseapp.com",
  projectId: "eduvotacao-d2486",
  storageBucket: "eduvotacao-d2486.firebasestorage.app",
  messagingSenderId: "845927518919",
  appId: "1:845927518919:web:933baa73d8b602f58da4e2"
};

// Initialize Firebase with persistent multi-tab local cache to prevent excess reads
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const auth = getAuth(app);



