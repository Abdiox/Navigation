// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsxF7NsgmkYO3u10zTpxKqJa5uGaBW3rk",
  authDomain: "myprojectnote-512bf.firebaseapp.com",
  projectId: "myprojectnote-512bf",
  storageBucket: "myprojectnote-512bf.appspot.com",
  messagingSenderId: "521710627912",
  appId: "1:521710627912:web:158f2c73ad65723551bc7d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getFirestore(app);

export { app, database };
