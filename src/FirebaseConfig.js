// 🔥 Firebase inicializacija
// ZAMENJAJ s svojimi podatki iz Firebase konzole

import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBHJjzIol6VOpyFFJMhdGEbDFjd16IVtZo",
  authDomain: "faksapp-a6407.firebaseapp.com",
  projectId: "faksapp-a6407",
  storageBucket: "faksapp-a6407.firebasestorage.app",
  messagingSenderId: "411157253911",
  appId: "1:411157253911:web:75e9d6271a684817503152",
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
