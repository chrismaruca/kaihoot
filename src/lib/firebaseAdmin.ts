// filepath: /home/chris/kaihoot/src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Or use a service account key
    databaseURL: process.env.FIREBASE_DATABASE_URL, // Ensure this is set in your environment variables
  });
}

export const db = admin.database();