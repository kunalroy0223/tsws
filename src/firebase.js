import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBgo6flyAIZd3coVlpxC8uUM2pdEb22YVI",
  authDomain: "mentorship-app-4e61d.firebaseapp.com",
  projectId: "mentorship-app-4e61d",
  storageBucket: "mentorship-app-4e61d.firebasestorage.app",
  messagingSenderId: "550971301378",
  appId: "1:550971301378:web:10c8676beb8d3e154c111b",
  measurementId: "G-3YHJCCH0NQ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
