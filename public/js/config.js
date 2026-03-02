// ─── Firebase Client Config ─────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBobhek9X2bAfLf29vaIRvsFr8XWikXqS8",
    authDomain: "psyc-app.firebaseapp.com",
    projectId: "psyc-app",
    storageBucket: "psyc-app.firebasestorage.app",
    messagingSenderId: "850502892481",
    appId: "1:850502892481:web:69515e2cfebaf7ec648d40",
    measurementId: "G-NXH9F15YYP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

// Server URL (change for production)
const SERVER_URL = window.location.origin;
