// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBPm0pKb9VVMZHr-euOUaOej3Dg8zcU36g",
    authDomain: "login-mybro.firebaseapp.com",
    databaseURL: "https://login-mybro-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "login-mybro",
    storageBucket: "login-mybro.appspot.com",
    messagingSenderId: "378425735650",
    appId: "1:378425735650:web:b66212a1aaac98e104a1bb",
    measurementId: "G-J8N9EPY623",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
export { database, app };
