// Firebase Firestore Integration
// Initialized as ES module via compat SDK loaded in index.html

// Obfuscated Firebase Config (Base64)
const _keys = [
    "QUl6YVN5QUpGd1h1b0dQazRZTTBSVTVoNkhmVVpST09vaFhtOUgw", // apiKey
    "ZWR1aGVyby1yZWNvZGluZy1zeXN0ZW0uZmlyZWJhc2VhcHAuY29t", // authDomain
    "ZWR1aGVyby1yZWNvZGluZy1zeXN0ZW0=",                   // projectId
    "ZWR1aGVyby1yZWNvZGluZy1zeXN0ZW0uZmlyZWJhc2VzdG9yYWdlLmFwcA==", // storageBucket
    "NDE5MjkxNDE5MTE4",                                     // messagingSenderId
    "MTo0MTkyOTE0MTkxMTg6d2ViOjJhNDE0MzViNGM1NjI5ZjM3MzNlZmY="    // appId
];

const firebaseConfig = {
    apiKey: atob(_keys[0]),
    authDomain: atob(_keys[1]),
    projectId: atob(_keys[2]),
    storageBucket: atob(_keys[3]),
    messagingSenderId: atob(_keys[4]),
    appId: atob(_keys[5])
};

// Initialize Firebase (compat SDK)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Enable offline persistence for better UX
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence unavailable (multiple tabs open).');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser.');
    }
});
