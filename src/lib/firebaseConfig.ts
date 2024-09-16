// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlCjiW5Mef8yObR2RqMxa36QkjClcQmnA",
  authDomain: "video-transcript-b010e.firebaseapp.com",
  projectId: "video-transcript-b010e",
  storageBucket: "video-transcript-b010e.appspot.com",
  messagingSenderId: "546522535137",
  appId: "1:546522535137:web:9ed6ac89f5458aa5b853a0",
  measurementId: "G-72EQPYC2DH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);