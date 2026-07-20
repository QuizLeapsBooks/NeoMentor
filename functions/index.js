const { onRequest } = require('firebase-functions/v2/https');
const { app } = require('../server');

// Same Express API, deployed inside the existing NeoBranium Firebase project.
exports.mentorApi = onRequest({ region: 'asia-south1', cors: true, secrets: ['GEMINI_API_KEY'] }, app);
