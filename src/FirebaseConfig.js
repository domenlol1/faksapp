// 🔥 Firebase inicializacija
// ZAMENJAJ s svojimi podatki iz Firebase konzole

import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "faksapp-35376630-47413",
  appId: "1:473280044617:web:eccc67c1d3b288e57ae998",
  storageBucket: "faksapp-35376630-47413.firebasestorage.app",
  apiKey: "AIzaSyD0C24Xm65MPjOzGxDUzTxbDlfhM7co3bs",
  authDomain: "faksapp-35376630-47413.firebaseapp.com",
  messagingSenderId: "473280044617",
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
export const db = getFirestore(app);
