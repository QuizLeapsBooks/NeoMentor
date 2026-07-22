# NeoMentor

## Running the current app

1. In Firebase Authentication, enable Email/Password and (if you use the buttons) Google and GitHub providers.
2. Because NeoMentor shares NeoBranium's Firebase project, do **not** replace its Firestore rules. Add the blocks from [mentor-firestore-rules.snippet](mentor-firestore-rules.snippet) inside NeoBranium's existing rules, then deploy the merged rules. These grant each signed-in user access only to their own Mentor data.
3. Create a `.env` file beside `server.js` with `GEMINI_API_KEY=your_key` (optionally `GEMINI_MODEL=gemini-2.0-flash`), then run `node server.js`.
4. Serve the project over HTTP (not `file://`) and open `index.html`. The dashboard calls the local API at port 3000.

Neo Mentor is a NeoBranium module and uses the existing Firebase Authentication UID. Firestore is the single source of truth: `mentor_profiles`, `mentor_goals/{uid}/items`, `mentor_settings`, `mentor_activity`, `mentor_chat/{uid}/messages`, and server-managed `mentor_memory`. Each live Firestore listener updates every signed-in session without a refresh.

For the API to securely read the authenticated user's Mentor context and write the short AI-memory summary, deploy the provided `functions/mentorApi` module through NeoBranium's existing Firebase configuration. Set the production key once with `firebase functions:secrets:set GEMINI_API_KEY`. Merge the function and `/api/**` Hosting rewrite into NeoBranium's existing `firebase.json`; never replace the platform configuration. For local use, run `npm install && npm start`; the dashboard uses port 3000 only on localhost.
 
I want to build an AI-powered SaaS platform called Neo Mentor AI.

This is not just an AI chatbot. It is a long-term AI mentor for students.

The goal is to create an AI that behaves like a real mentor, similar to an ALLEN mentor, but available 24/7.

The AI should guide students, monitor their progress, motivate them, remind them about goals, and continuously help them improve.

=========================
HOW THE SYSTEM SHOULD WORK
=========================

The application will be deployed on a cloud server.

The developer's PC will NOT stay on all the time.

Everything must run independently using cloud services.

The backend should be designed so scheduled tasks continue working even when nobody is online.

=========================
USER FLOW
=========================

User creates an account.

↓

Completes profile.

↓

Sets academic goals.

↓

Uses dashboard daily.

↓

Chats with AI mentor.

↓

AI learns about the student over time.

↓

Dashboard updates automatically.

=========================
FUTURE FEATURES
=========================

In future premium versions, the AI should be able to:

• Send WhatsApp reminders
• Send motivational messages
• Send daily study plans
• Send weekly reports
• Call students using AI voice
• Remind students about unfinished goals
• Congratulate students when they complete milestones

These actions must happen automatically from the cloud without requiring my computer to be running.

=========================
AUTOMATION
=========================

The backend should support scheduled jobs.

Example:

Every morning at 5:00 AM

↓

Check today's schedule

↓

Generate personalized study plan

↓

Send WhatsApp reminder

Example:

Every Sunday

↓

Generate weekly performance report

↓

Send report to student

Example:

If student misses goals for 3 consecutive days

↓

AI generates motivational message

↓

(Optional Premium)

AI schedules a voice call

=========================
ARCHITECTURE
=========================

Design the backend using modular services.

Example:

Authentication Service

Profile Service

Goal Service

AI Service

Notification Service

Scheduler Service

WhatsApp Service

Voice Call Service

Analytics Service

Memory Service

Each service should be independent and scalable.

=========================
DASHBOARD
=========================

Dashboard should automatically stay synchronized with Firestore.

Whenever goals, profile or AI updates change, the dashboard should update without manual refresh.

=========================
PREMIUM MODEL
=========================

Since AI APIs, WhatsApp APIs and Voice APIs have operational costs, these advanced features will only be available for Premium users.

Free users should receive basic dashboard features and limited AI interactions.

Premium users should receive:

• Unlimited AI Mentor
• Smart Study Plans
• AI Progress Analysis
• WhatsApp Mentor
• AI Voice Calls
• Long-Term Memory
• Weekly Reports
• Advanced Analytics

=========================
IMPORTANT
=========================

Do not design this as a simple chatbot.

Design it as a scalable AI mentoring platform that can eventually serve thousands of students, schools and coaching institutes.

The architecture should be production-ready, cloud-native, modular and easy to extend in future versions.




# NeoBranium

## Overview

NeoBranium is an AI-powered educational platform designed to help students learn, stay consistent, and achieve their academic goals.

Neo Mentor AI is one module inside the NeoBranium ecosystem.

This project is actively under development.

---

# IMPORTANT INSTRUCTIONS FOR AI AGENTS

If you are an AI assistant editing this project, read these instructions carefully before making any changes.

## DO NOT

- Do NOT redesign the UI.
- Do NOT change the project architecture.
- Do NOT create a new Firebase project.
- Do NOT replace the authentication system.
- Do NOT create duplicate user profiles.
- Do NOT create duplicate user accounts.
- Do NOT rename existing collections unless explicitly requested.
- Do NOT remove existing functionality.
- Do NOT delete code without confirmation.
- Do NOT refactor large parts of the project unless asked.
- Do NOT introduce unnecessary dependencies.
- Do NOT convert the project to another framework.
- Do NOT change the folder structure unnecessarily.
- Do NOT modify working features just to improve code style.

---

# ALWAYS

- Extend the existing architecture.
- Reuse existing components whenever possible.
- Keep code modular.
- Write clean and well-commented code.
- Preserve backwards compatibility.
- Maintain existing design language.
- Fix bugs without breaking other modules.
- Keep future scalability in mind.

---

# PROJECT ARCHITECTURE

Platform

NeoBranium

Modules

- Neo Mentor AI
- Dashboard
- Goals
- Profile
- Settings
- AI Chat (Coming Soon)

Future

- WhatsApp Mentor
- Voice Mentor
- Long-Term Memory
- Institute Dashboard
- Analytics

---

# FIREBASE

Use the existing Firebase project.

Authentication must always use the same Firebase UID.

Never create duplicate user accounts.

Collections

users

mentor_profiles

mentor_settings

mentor_goals

mentor_activity

mentor_chat

mentor_memory

---

# DESIGN LANGUAGE

- Dark Theme
- Glassmorphism
- Blue/Purple Accent
- Premium SaaS Style
- Responsive
- Smooth Animations

Never redesign completed pages.

---

# CODING RULES

- Prefer editing existing files.
- Avoid creating unnecessary new files.
- Keep functions small and reusable.
- Add comments for important logic.
- Use meaningful variable names.
- Preserve compatibility with future modules.

---

# VERSION

Current Version

Neo Mentor AI v1

Current Scope

- Dashboard
- Goals
- Profile
- Settings

Coming Soon

- AI Chat
- Voice AI
- WhatsApp
- Memory System
- Analytics

---

# BEFORE MAKING CHANGES

If the requested modification could break existing functionality, ask for confirmation first.

If unsure about architecture, preserve the current implementation instead of replacing it.

When possible, improve the existing code instead of rewriting it.

The goal is to build a scalable, production-ready educational platform.
