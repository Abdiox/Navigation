// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBx6ZfIxvMSh2eXc3oztGu0xThoq16wC-0",
  authDomain: "my-audio-project-2c5c2.firebaseapp.com",
  projectId: "my-audio-project-2c5c2",
  storageBucket: "my-audio-project-2c5c2.firebasestorage.app",
  messagingSenderId: "794685289152",
  appId: "1:794685289152:web:d7a24c069224ed7178f325",
  measurementId: "G-QBYYPSBTHR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getFirestore(app);

export { app, database };
