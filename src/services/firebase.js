import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGV3GEyBT0PLJpEzTDGyCMhcXczGbTMRs",
  authDomain: "roadsafe-wildlife.firebaseapp.com",
  projectId: "roadsafe-wildlife",
  storageBucket: "roadsafe-wildlife.firebasestorage.app",
  messagingSenderId: "575726012868",
  appId: "1:575726012868:web:d1be0f6b7326a16ab27c91",
  measurementId: "G-Z191DPQLC5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db};