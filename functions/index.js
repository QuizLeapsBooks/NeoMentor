const { onRequest } = require('firebase-functions/v2/https');
const { app } = require('../server');

// Same Express API, deployed inside the existing NeoBranium Firebase project.
// CORS is handled in Express so the wrapper does not expose a broad origin policy.
exports.mentorApi = onRequest({ region: 'asia-south1', cors: false, secrets: ['GEMINI_API_KEY'] }, app);
