// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPQiHMVcHxnWY7c3amCtJAKSm1gbtsyTE",
  authDomain: "kaihoot.firebaseapp.com",
  databaseURL: "https://kaihoot-default-rtdb.firebaseio.com",
  projectId: "kaihoot",
  storageBucket: "kaihoot.firebasestorage.app",
  messagingSenderId: "813249949571",
  appId: "1:813249949571:web:1cdc0bb0cae338934490b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const auth = getAuth(app);
