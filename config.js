// config.js
// Centralized configuration for Neo Mentor AI

const currentHost = window.location.hostname;
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
const isFirebaseHosted = currentHost === 'neomentor.web.app' || currentHost === 'neomentor.firebaseapp.com';

const CONFIG = {
    API_BASE_URL: isLocalhost
        ? 'http://localhost:3000'
        : isFirebaseHosted
            ? window.location.origin
            : 'https://neomentor.onrender.com'
};

// Make it globally available for the frontend scripts
window.NEOMENTOR_CONFIG = CONFIG;
