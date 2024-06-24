import { getFirestore } from 'firebase/firestore';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyCifFfmc_eq2aLfHfQn9Zunx6fx8K4zwxI",
    authDomain: "solm-human-eval-interactive.firebaseapp.com",
    databaseURL: "https://solm-human-eval-interactive-default-rtdb.firebaseio.com",
    projectId: "solm-human-eval-interactive",
    storageBucket: "solm-human-eval-interactive.appspot.com",
    messagingSenderId: "402747185470",
    appId: "1:402747185470:web:eefd826c1535cf3eea346f"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };




