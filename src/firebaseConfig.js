import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD1cVuVxgiNt3NSsGfdO74rUZU1HoQNAiQ",
    authDomain: "solm-human-eval-b3bfb.firebaseapp.com",
    projectId: "solm-human-eval-b3bfb",  
    storageBucket: "solm-human-eval-b3bfb.appspot.com",  
    messagingSenderId: "272800487127",
    appId: "1:272800487127:web:a12a709ece0a8d278f0292"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };