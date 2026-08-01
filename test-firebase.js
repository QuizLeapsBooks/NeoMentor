const admin = require('firebase-admin');
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'test-project',
      clientEmail: 'test@test.com',
      privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIB\n-----END PRIVATE KEY-----\n'
    })
  });
  const db = admin.firestore();
  console.log('SUCCESS');
} catch (e) {
  console.error('ERROR:', e.message);
}
