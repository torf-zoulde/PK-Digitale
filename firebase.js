// ===================================
// CONFIGURATION FIREBASE
// ===================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// ⚡ Remplacez avec vos vraies informations Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC0BEXAMPLE_1234567890abcdef",
    authDomain: "sk-digitale.firebaseapp.com",
    projectId: "sk-digitale",
    storageBucket: "sk-digitale.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };