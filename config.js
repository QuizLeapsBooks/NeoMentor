// config.js
// Centralized configuration for Neo Mentor AI

const CONFIG = {
    // Automatically switch between local development and Render production URLs
    API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://neomentor.onrender.com'
};

// Make it globally available for the frontend scripts
window.NEOMENTOR_CONFIG = CONFIG;
