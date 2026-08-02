const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

let admin = null;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    } else {
      throw new Error("Missing Firebase credentials in environment. Falling back to client context.");
    }
  }
} catch (error) {
  console.error("Firebase initialization failed:", error.message);
  admin = null;
}

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'https://neomentor.onrender.com',
  'https://quizleapsbooks.github.io',
  'https://neomentor.web.app',
  'https://neomentor.firebaseapp.com'
];

const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMaxRequests = 100;
const rateLimitStore = new Map();

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, start: now };

  if (now - entry.start > rateLimitWindowMs) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);

  if (entry.count > rateLimitMaxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.start > rateLimitWindowMs) {
      rateLimitStore.delete(ip);
    }
  }
}, rateLimitWindowMs);

function verifyFirebaseIdToken(req, res, next) {
  if (!process.env.GEMINI_API_KEY) {
    return next();
  }

  if (!admin) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Server authentication is not configured.' });
    }
    console.warn('Firebase Admin unavailable; allowing local development request without token.');
    return next();
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required.' });
  }

  admin.auth().verifyIdToken(token)
    .then(decoded => {
      req.uid = decoded.uid;
      next();
    })
    .catch(error => {
      console.error('[auth] token verify failed:', error.message);
      res.status(401).json({ error: 'Invalid authentication token.' });
    });
}

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    console.error('CORS policy violation for origin:', origin);
    return callback(new Error('CORS policy violation: ' + origin), false);
  }
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimitMiddleware);

function createFallbackGoalSuggestion(profile = {}) {
  const subject = profile.favoriteSubject || profile.subject || 'your main subject';
  return {
    title: `Focus on ${subject}`,
    description: `Spend 20-30 minutes reviewing ${subject} today. Keep it simple and work with full attention.`,
    rationale: 'A short, steady study block is easier to follow and helps build progress over time.'
  };
}

function normalizeGoalSuggestion(parsed = {}, profile = {}) {
  const fallback = createFallbackGoalSuggestion(profile);
  
  return {
    title: (typeof parsed.title === 'string' && parsed.title.trim()) ? parsed.title.trim() : fallback.title,
    description: (typeof parsed.description === 'string' && parsed.description.trim()) ? parsed.description.trim() : fallback.description,
    rationale: (typeof parsed.rationale === 'string' && parsed.rationale.trim()) ? parsed.rationale.trim() : fallback.rationale,
  };
}

app.post('/api/goal-suggest', verifyFirebaseIdToken, async (req, res) => {
  try {
    const { profile = {}, prompt = '', existingGoal = '' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = createFallbackGoalSuggestion(profile);
      return res.json({
        ...fallback,
        rationale: `${fallback.rationale} (AI service is currently unavailable)`
      });
    }

    const systemPrompt = `You are Neo Mentor AI, a supportive study coach for students. Create one simple, realistic daily goal that a normal student can actually follow. Keep it short, friendly, and easy to understand. Make it one small task, not a full plan. Avoid exam jargon, multiple steps, time blocks, technical wording, or overly intense language. Output JSON with title, description, rationale.`;
    const userPrompt = `Student profile: ${JSON.stringify(profile)}\nExisting goal: ${existingGoal || 'None'}\nUser request: ${prompt || 'Suggest a practical daily study goal.'}\nPlease make the suggestion beginner-friendly, realistic, and easy to complete today.`;

    let data;
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
        })
      });

      data = await geminiResponse.json();
      if (!geminiResponse.ok) {
        throw new Error(data?.error?.message || 'Request failed.');
      }
    } catch (error) {
      const fallback = createFallbackGoalSuggestion(profile);
      return res.json({
        ...fallback,
        rationale: `${fallback.rationale} (AI service fallback)`
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = { title: 'Study Focus Block', description: text, rationale: 'Generated by NeoMentor.' };
    }

    const suggestion = normalizeGoalSuggestion(parsed, profile);

    return res.json(suggestion);
  } catch (error) {
    console.error('[goal-suggest] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

function createFallbackChatReply(message, profile = {}) {
  const subject = profile.favoriteSubject || profile.exam || 'your studies';
  const cleanMessage = String(message || '').trim();
  if (!cleanMessage) return `Hi! What would you like help with in ${subject} today?`;
  return `Let’s work through that step by step. For ${subject}, start with one small, focused task: identify the part of “${cleanMessage.slice(0, 90)}” that feels hardest, then spend 20 minutes on it. Tell me what you get stuck on and I’ll help you from there.`;
}

app.post('/api/chat', verifyFirebaseIdToken, async (req, res) => {
  try {
    const { message = '', history = [], profile = {}, uid: requestedUid = '' } = req.body || {};
    const cleanMessage = String(message).trim();
    if (!cleanMessage) return res.status(400).json({ error: 'A message is required.' });
    if (cleanMessage.length > 4000) return res.status(400).json({ error: 'Please keep messages under 4,000 characters.' });

    let uid = requestedUid;
    let mentorData = { profile, goals: [], settings: {}, activity: [], messages: history, memory: {} };
    if (admin && req.uid) {
      uid = req.uid;
      const db = admin.firestore();
      const [profileDoc, settingsDoc, activityDoc, memoryDoc, goalsSnapshot, messagesSnapshot] = await Promise.all([
        db.collection('mentor_profiles').doc(uid).get(),
        db.collection('mentor_settings').doc(uid).get(),
        db.collection('mentor_activity').doc(uid).get(),
        db.collection('mentor_memory').doc(uid).get(),
        db.collection('mentor_goals').doc(uid).collection('items').get(),
        db.collection('mentor_chat').doc(uid).collection('messages').orderBy('createdAt', 'desc').limit(30).get()
      ]);
      mentorData = {
        profile: profileDoc.exists ? profileDoc.data() : profile,
        settings: settingsDoc.exists ? settingsDoc.data() : {},
        activity: activityDoc.exists ? activityDoc.data().events || [] : [],
        messages: messagesSnapshot.empty ? history : messagesSnapshot.docs.map(doc => doc.data()).reverse(),
        memory: memoryDoc.exists ? memoryDoc.data() : {},
        goals: goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ reply: createFallbackChatReply(cleanMessage, mentorData.profile), fallback: true });

    const mentorContext = {
      ...mentorData.profile,
      goals: mentorData.goals.map(goal => ({ title: goal.title, description: goal.description, completed: goal.completed })),
      settings: mentorData.settings,
      recentActivity: mentorData.activity.slice(0, 5),
      memorySummary: mentorData.memory.summary || ''
    };
    const recentHistory = Array.isArray(mentorData.messages) ? mentorData.messages.slice(-12).map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(item.content || '').slice(0, 2000) }]
    })) : [];
    const system = `You are Neo Mentor AI, a supportive long-term academic mentor. Use this student profile: ${JSON.stringify(mentorContext)}. Give practical, accurate study guidance in the student's preferred explanation style. Be concise (under 220 words), encouraging, and do not pretend to have completed work or know facts not provided. Ask one useful follow-up question when needed.`;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [...recentHistory, { role: 'user', parts: [{ text: cleanMessage }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 500 }
      })
    });
    const data = await geminiResponse.json();
    if (!geminiResponse.ok) throw new Error(data?.error?.message || 'AI request failed.');
    const reply = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    const finalReply = reply || createFallbackChatReply(cleanMessage, mentorData.profile);
    if (admin && uid) {
      const summary = `Student: ${mentorData.profile.name || 'Student'}. Goal focus: ${mentorData.goals.filter(goal => !goal.completed).slice(0, 3).map(goal => goal.title).join(', ') || 'no active goals'}. Recent discussion: ${[...mentorData.messages.slice(-4), { role: 'user', content: cleanMessage }, { role: 'assistant', content: finalReply }].map(item => `${item.role}: ${String(item.content || '').slice(0, 180)}`).join(' | ')}`;
      await admin.firestore().collection('mentor_memory').doc(uid).set({ uid, summary, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    return res.json({ reply: finalReply });
  } catch (error) {
    console.error('[chat] Error:', error.message);
    return res.json({ reply: createFallbackChatReply(req.body?.message, req.body?.profile), fallback: true });
  }
});

// POST /api/notify/whatsapp
// Lightweight queue endpoint to prepare architecture for future WhatsApp integration.
// Currently enqueues request to Firestore collection `whatsapp_queue` when Admin SDK is available.
app.post('/api/notify/whatsapp', verifyFirebaseIdToken, async (req, res) => {
  try {
    const { phone, message, meta = {} } = req.body || {};
    if (!phone || !message) return res.status(400).json({ error: 'phone and message are required' });

    if (!admin) {
      console.warn('[notify/whatsapp] Firebase Admin not initialized; cannot persist queue.');
      return res.status(202).json({ success: true, queued: false, message: 'Received (admin unavailable). Persist when configured.' });
    }

    const db = admin.firestore();
    await db.collection('whatsapp_queue').add({
      phone: String(phone),
      message: String(message),
      meta,
      uid: req.uid || null,
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ success: true, queued: true });
  } catch (error) {
    console.error('[notify/whatsapp] Error:', error.message || error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/healthz', (req, res) => {
  res.json({ ok: true, message: 'Neo Mentor API is running' });
});

const port = Number(process.env.PORT || 3000);

function startServer() {
  const candidatePorts = [Number(process.env.PORT || 3000), 3001, 3002, 3003, 3004, 3005];
  let attempt = 0;

  const tryListen = (port) => {
    const server = app.listen(port, () => {
      console.log(`Neo Mentor API listening on port ${port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && attempt < candidatePorts.length - 1) {
        attempt += 1;
        console.warn(`Port ${port} is busy. Trying ${candidatePorts[attempt]} instead.`);
        tryListen(candidatePorts[attempt]);
      } else {
        throw error;
      }
    });
  };

  tryListen(candidatePorts[attempt]);
}

if (require.main === module) {
  startServer();
}

module.exports = { app, createFallbackGoalSuggestion, normalizeGoalSuggestion, startServer };
