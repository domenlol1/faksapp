// 🔥 Firebase inicializacija
// ZAMENJAJ s svojimi podatki iz Firebase konzole

import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
