require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');

// ─── Firebase Admin Init ────────────────────────────────────────
let db = null;
let firebaseReady = false;

try {
  const fs = require('fs');
  if (fs.existsSync(path.join(__dirname, 'serviceAccountKey.json'))) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    firebaseReady = true;
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    throw new Error('File not found');
  }
} catch (err) {
  console.warn('⚠️  serviceAccountKey.json not found!');
  console.warn('   The server will run in DEMO MODE (UI only, no backend features).');
  console.warn('   To enable full functionality:');
  console.warn('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.warn('   2. Click "Generate New Private Key"');
  console.warn('   3. Save the file as serviceAccountKey.json in this folder');
  console.warn('');
}

// ─── Express + Socket.io ────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(express.json());

// Fix Cross-Origin-Opener-Policy for Firebase Auth popups
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── Test endpoint ──────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: Date.now() });
});

// ─── Helper: Verify Firebase Token ──────────────────────────────
async function verifyToken(token) {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    return null;
  }
}

// ─── Auth Middleware for REST ────────────────────────────────────
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split('Bearer ')[1];
  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = decoded;
  next();
}

// ─── REST: Create Organization ──────────────────────────────────
app.post('/api/org/create', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured. Add serviceAccountKey.json and restart.' });
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Org name is required' });

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const userDocRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data().orgId) {
      return res.status(400).json({ error: 'You are already in an organization. You can only join one organization.' });
    }

    const orgRef = await db.collection('organizations').add({
      name,
      adminId: req.user.uid,
      inviteCode,
      members: [req.user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update the admin user doc
    await userDocRef.set({
      orgId: orgRef.id,
      role: 'admin',
      isOnline: false,
      currentMood: '',
      currentActivity: '',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ orgId: orgRef.id, inviteCode });
  } catch (err) {
    console.error('Create org error:', err);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// ─── REST: Join Organization ────────────────────────────────────
app.post('/api/org/join', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured. Add serviceAccountKey.json and restart.' });
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });

    const userDocRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data().orgId) {
      return res.status(400).json({ error: 'You are already in an organization. You can only join one organization.' });
    }

    const snapshot = await db.collection('organizations')
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const orgDoc = snapshot.docs[0];

    await userDocRef.set({
      orgId: orgDoc.id,
      role: 'member',
      isOnline: false,
      currentMood: '',
      currentActivity: '',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.collection('organizations').doc(orgDoc.id).update({
      members: admin.firestore.FieldValue.arrayUnion(req.user.uid)
    });

    res.json({ orgId: orgDoc.id, orgName: orgDoc.data().name });
  } catch (err) {
    console.error('Join org error:', err);
    res.status(500).json({ error: 'Failed to join organization' });
  }
});

// ─── REST: Verify & Sync User Organization ────────────────────────
app.get('/api/user/verify-org', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured.' });
  try {
    const uid = req.user.uid;
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    let orgId = null;
    if (userDoc.exists) {
      const data = userDoc.data();
      // Treat empty string as no org
      const rawOrgId = data.orgId || (data.orgIds && data.orgIds.length > 0 ? data.orgIds[0] : null);
      orgId = (rawOrgId && rawOrgId.trim() !== '') ? rawOrgId : null;
    }

    // If orgId wasn't properly synced in user doc, query organization's members array
    if (!orgId) {
      const orgsSnap = await db.collection('organizations')
        .where('members', 'array-contains', uid)
        .limit(1)
        .get();

      if (!orgsSnap.empty) {
        orgId = orgsSnap.docs[0].id;
        await userDocRef.set({ orgId }, { merge: true });
      }
    }

    // Ensure user doc actually exists in database if no org found either
    if (!userDoc.exists) {
      await userDocRef.set({
        email: req.user.email || '',
        displayName: '',
        username: '',
        orgId: '',
        role: '',
        isOnline: false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return res.json({ orgId: null, hasUsername: false });
    }

    const userData = userDoc.data() || {};
    const hasUsername = !!(userData.username && userData.username.trim() !== '');

    console.log(`🔍 [VERIFY] uid: ${uid} | hasName: ${hasUsername} | orgId: ${orgId}`);

    res.json({
      orgId,
      hasUsername,
      username: userData.username || '',
      reminderSettings: userData.reminderSettings || null
    });

  } catch (err) {
    console.error('Verify org error:', err);
    res.status(500).json({ error: 'Failed to verify organization' });
  }
});

// ─── REST: Check Username Availability ──────────────────────────
app.get('/api/user/check-username', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured.' });
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const snapshot = await db.collection('users')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();

    res.json({ available: snapshot.empty });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check username' });
  }
});

app.post('/api/user/set-username', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured.' });
  try {
    const { username } = req.body;
    const uid = req.user.uid;
    console.log(`📝 Attempting to set username for ${uid}: "${username}"`);

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Invalid username (min 3 chars)' });
    }

    // Check availability again for safety
    const snapshot = await db.collection('users')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      if (snapshot.docs[0].id !== uid) {
        console.log(`❌ Username "${username}" is already taken.`);
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    await db.collection('users').doc(uid).set({
      username: username.toLowerCase(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Username "${username}" saved for ${uid}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Set username error:', err);
    res.status(500).json({ error: 'Failed to set username' });
  }
});

// ─── REST: Update Reminder Settings ─────────────────────────────
app.post('/api/user/reminder-settings', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured.' });
  try {
    const { enabled, time } = req.body;
    const uid = req.user.uid;
    console.log(`⏰ Updating reminder settings for ${uid}:`, { enabled, time });

    // Validate input
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value' });
    }

    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'Invalid time format (expected HH:MM)' });
    }

    const reminderSettings = {
      enabled,
      time: time || '09:00'
    };

    await db.collection('users').doc(uid).set({
      reminderSettings,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Reminder settings saved for ${uid}`);
    res.json({ success: true, reminderSettings });
  } catch (err) {
    console.error('❌ Update reminder settings error:', err);
    res.status(500).json({ error: 'Failed to update reminder settings' });
  }
});


// ─── REST: Get Org Members ──────────────────────────────────────
app.get('/api/org/members', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured. Add serviceAccountKey.json and restart.' });
  try {
    const orgId = req.query.orgId;

    // Fallback: check if the user belongs to exactly one org
    const userDocRef = await db.collection('users').doc(req.user.uid).get();
    const userData = userDocRef.exists ? userDocRef.data() : {};
    const fallbackOrgId = userData.orgId || (userData.orgIds && userData.orgIds.length > 0 ? userData.orgIds[0] : null);
    const activeOrgId = orgId || fallbackOrgId;

    if (!activeOrgId) return res.status(400).json({ error: 'User not in any organization' });
    if (fallbackOrgId !== activeOrgId) return res.status(403).json({ error: 'Not a member of this organization' });

    const membersSnap = await db.collection('users').where('orgId', '==', activeOrgId).get();
    const members = [];
    membersSnap.forEach(doc => members.push({ uid: doc.id, ...doc.data() }));

    // Get org info
    const orgDoc = await db.collection('organizations').doc(activeOrgId).get();

    res.json({
      org: { id: activeOrgId, ...orgDoc.data() },
      members,
    });
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// ─── REST: Get Mood Stats (last 7 days) ──────────────────────────
app.get('/api/org/mood-stats', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const orgId = req.query.orgId;
    const userDocRef = await db.collection('users').doc(req.user.uid).get();
    const userData = userDocRef.exists ? userDocRef.data() : {};
    const fallbackOrgId = userData.orgId || (userData.orgIds && userData.orgIds.length > 0 ? userData.orgIds[0] : null);
    const activeOrgId = orgId || fallbackOrgId;

    if (!activeOrgId) return res.status(400).json({ error: 'User not in any organization' });
    if (fallbackOrgId !== activeOrgId) return res.status(403).json({ error: 'Not a member of this organization' });

    const daysAgo = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);

    const logsSnap = await db.collection('moodLogs')
      .where('orgId', '==', activeOrgId)
      .where('timestamp', '>=', since)
      .get();

    let logs = [];
    logsSnap.forEach(doc => {
      const d = doc.data();
      logs.push({
        mood: d.mood,
        activity: d.activity,
        userId: d.userId,
        timestamp: d.timestamp?.toDate?.() || d.timestamp,
      });
    });

    // Sort locally
    logs.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp;
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp;
      return timeB - timeA;
    });

    res.json({ logs: logs.slice(0, 500) });
  } catch (err) {
    console.error('Mood stats error:', err);
    res.status(500).json({ error: 'Failed to get mood stats' });
  }
});

// ─── REST: Get User Calendar Logs ───────────────────────────────
app.get('/api/user/calendar-logs', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const logsSnap = await db.collection('moodLogs')
      .where('userId', '==', req.user.uid)
      .get(); // no orderBy to avoid needing a composite index

    let logs = [];
    logsSnap.forEach(doc => {
      const d = doc.data();
      logs.push({
        id: doc.id,
        mood: d.mood,
        activity: d.activity || '',
        timestamp: d.timestamp?.toDate?.() || d.timestamp,
      });
    });

    // sort locally
    logs.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ logs });
  } catch (err) {
    console.error('Calendar logs error:', err);
    res.status(500).json({ error: 'Failed to get calendar logs' });
  }
});

// ─── REST: Delete Mood Entry ────────────────────────────────────
app.delete('/api/mood/delete', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { entryId } = req.body;

    if (!entryId) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    // Get the entry to verify ownership
    const entryRef = db.collection('moodLogs').doc(entryId);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entryData = entryDoc.data();

    // Verify that the user owns this entry
    if (entryData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only delete your own entries' });
    }

    // Delete the entry
    await entryRef.delete();

    console.log(`🗑️  Entry ${entryId} deleted by ${req.user.email}`);

    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Delete entry error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ─── REST: Update Mood Entry ────────────────────────────────────
app.put('/api/mood/update', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { entryId, mood, moodLabel, moodEmoji, moodColor, activity, note, timestamp } = req.body;

    if (!entryId) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    // Get the entry to verify ownership
    const entryRef = db.collection('moodLogs').doc(entryId);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entryData = entryDoc.data();

    // Verify that the user owns this entry
    if (entryData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only edit your own entries' });
    }

    // Update the entry
    const updateData = {
      mood: mood || entryData.mood,
      moodLabel: moodLabel || entryData.moodLabel,
      moodEmoji: moodEmoji || entryData.moodEmoji,
      moodColor: moodColor || entryData.moodColor,
      activity: activity !== undefined ? activity : entryData.activity,
      note: note !== undefined ? note : entryData.note,
    };

    // Support arrays if provided
    if (req.body.activities) updateData.activities = req.body.activities;
    if (req.body.emotions) updateData.emotions = req.body.emotions;

    if (timestamp) {
      updateData.timestamp = admin.firestore.Timestamp.fromMillis(timestamp);
    }

    await entryRef.update(updateData);

    console.log(`✏️  Entry ${entryId} updated by ${req.user.email}`);

    res.json({ success: true, message: 'Entry updated successfully' });
  } catch (err) {
    console.error('Update entry error:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// ─── REST: Create Goal ──────────────────────────────────────────
app.post('/api/goals/create', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { title, description, type, orgId, reminderFrequency, reminderDays, reminderTime } = req.body;

    console.log('📝 Creating goal:', { title, type, reminderFrequency, reminderDays, reminderTime });

    if (!title) {
      return res.status(400).json({ error: 'Goal title is required' });
    }

    const goalData = {
      title,
      description: description || '',
      type: type || 'personal',
      orgId: orgId || '',
      userId: req.user.uid,
      userName: req.user.name || req.user.email,
      reminderFrequency: reminderFrequency || null,
      reminderDays: reminderDays || [],
      reminderTime: reminderTime || null,
      userNotificationSettings: reminderFrequency ? {
        [req.user.uid]: {
          enabled: true
        }
      } : {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const goalRef = await db.collection('goals').add(goalData);

    console.log(`✅ Goal created: ${title} (ID: ${goalRef.id})`);

    // Broadcast team goals to all members in the org
    if (type === 'team' && orgId) {
      const roomName = `org_${orgId}`;
      io.to(roomName).emit('new_team_goal', {
        id: goalRef.id,
        ...goalData,
        createdAt: Date.now()
      });
      console.log(`📢 Broadcasting team goal to room: ${roomName}`);
    }

    res.json({ success: true, goalId: goalRef.id });
  } catch (err) {
    console.error('❌ Create goal error:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to create goal: ' + err.message });
  }
});

// ─── REST: Update Goal ──────────────────────────────────────────
app.put('/api/goals/update', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { goalId, title, description, type, reminderFrequency, reminderDays, reminderTime } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'Goal ID is required' });
    }

    const goalRef = db.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();

    // Verify ownership for personal goals
    if (goalData.type === 'personal' && goalData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only edit your own personal goals' });
    }

    const updateData = {
      title,
      description: description || '',
      type: type || 'personal',
      reminderFrequency: reminderFrequency || null,
      reminderDays: reminderDays || [],
      reminderTime: reminderTime || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update user's notification settings
    if (reminderFrequency) {
      const userSettings = goalData.userNotificationSettings || {};
      userSettings[req.user.uid] = { enabled: true };
      updateData.userNotificationSettings = userSettings;
    }

    await goalRef.update(updateData);

    console.log(`✏️ Goal updated: ${title}`);

    res.json({ success: true });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// ─── REST: Toggle Goal Notifications ────────────────────────────
app.put('/api/goals/toggle-notifications', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { goalId, enabled } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'Goal ID is required' });
    }

    const goalRef = db.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();
    const userSettings = goalData.userNotificationSettings || {};

    // Update only this user's notification setting
    userSettings[req.user.uid] = {
      ...(userSettings[req.user.uid] || {}),
      enabled: enabled !== undefined ? enabled : true,
    };

    await goalRef.update({
      userNotificationSettings: userSettings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`🔔 ${req.user.email} ${enabled ? 'enabled' : 'disabled'} notifications for goal ${goalId}`);

    res.json({ success: true });
  } catch (err) {
    console.error('Toggle notifications error:', err);
    res.status(500).json({ error: 'Failed to toggle notifications' });
  }
});

// ─── REST: Get Goals ────────────────────────────────────────────
app.get('/api/goals/list', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { orgId, type } = req.query;

    let goals = [];

    if (type === 'personal') {
      // Personal goals: only show user's own goals
      let query = db.collection('goals').where('userId', '==', req.user.uid).where('type', '==', 'personal');

      try {
        const goalsSnap = await query.orderBy('createdAt', 'desc').get();
        goalsSnap.forEach(doc => {
          const data = doc.data();
          goals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        });
      } catch (err) {
        console.warn('⚠️ Firestore index missing for personal goals. Using client-side sorting.');
        const goalsSnap = await query.get();
        goalsSnap.forEach(doc => {
          const data = doc.data();
          goals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        });
        goals.sort((a, b) => {
          const timeA = a.createdAt?.getTime?.() || 0;
          const timeB = b.createdAt?.getTime?.() || 0;
          return timeB - timeA;
        });
      }
    } else if (type === 'team' && orgId) {
      // Team goals: show all team goals in the org
      let query = db.collection('goals').where('orgId', '==', orgId).where('type', '==', 'team');

      try {
        const goalsSnap = await query.orderBy('createdAt', 'desc').get();
        goalsSnap.forEach(doc => {
          const data = doc.data();
          goals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        });
      } catch (err) {
        console.warn('⚠️ Firestore index missing for team goals. Using client-side sorting.');
        const goalsSnap = await query.get();
        goalsSnap.forEach(doc => {
          const data = doc.data();
          goals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        });
        goals.sort((a, b) => {
          const timeA = a.createdAt?.getTime?.() || 0;
          const timeB = b.createdAt?.getTime?.() || 0;
          return timeB - timeA;
        });
      }
    } else if (orgId) {
      // Get all goals for the org (both personal user's goals and all team goals)
      let personalQuery = db.collection('goals').where('userId', '==', req.user.uid).where('type', '==', 'personal');
      let teamQuery = db.collection('goals').where('orgId', '==', orgId).where('type', '==', 'team');

      try {
        const [personalSnap, teamSnap] = await Promise.all([
          personalQuery.get(),
          teamQuery.get()
        ]);

        personalSnap.forEach(doc => {
          const data = doc.data();
          goals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        });

        teamSnap.forEach(doc => {
          const data = doc.data();
          goals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        });

        goals.sort((a, b) => {
          const timeA = a.createdAt?.getTime?.() || 0;
          const timeB = b.createdAt?.getTime?.() || 0;
          return timeB - timeA;
        });
      } catch (err) {
        console.warn('⚠️ Error fetching goals:', err);
      }
    }

    console.log(`📋 Returning ${goals.length} goals for user ${req.user.email} (type: ${type || 'all'})`);

    res.json({ goals });
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Failed to get goals' });
  }
});

// ─── REST: Delete Goal ──────────────────────────────────────────
app.delete('/api/goals/delete', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'Goal ID is required' });
    }

    const goalRef = db.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Verify ownership
    if (goalDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only delete your own goals' });
    }

    await goalRef.delete();

    res.json({ success: true });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// ─── REST: Create Important Day ─────────────────────────────────
app.post('/api/important-days/create', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { title, date, time, notes, orgId, type, emoji, color, reminderBefore } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const importantDayData = {
      title: String(title),
      date: String(date),
      time: time || null,
      type: type || 'personal',
      emoji: emoji || '🎉',
      color: color || '#ec4899',
      notes: notes || '',
      orgId: orgId || '',
      userId: req.user.uid,
      userName: req.user.name || req.user.email || 'Unknown',
      reminderBefore: reminderBefore || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const dayRef = await db.collection('importantDays').add(importantDayData);

    console.log(`⭐ Important day created by ${req.user.email}: ${title} (Type: ${type || 'personal'})`);

    res.json({ success: true, dayId: dayRef.id });
  } catch (err) {
    console.error('Create important day error:', err);
    res.status(500).json({ error: 'Failed to create important day' });
  }
});

// ─── REST: Get Important Days ───────────────────────────────────
app.get('/api/important-days/list', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const orgId = req.query.orgId || '';
    const type = req.query.type || 'personal';
    const uid = req.user.uid;

    let days = [];

    if (type === 'team' && orgId) {
      // For team view, fetch all days for the org and filter by type 'team' in memory
      // to avoid requiring a composite index (orgId + type)
      try {
        const snap = await db.collection('importantDays').where('orgId', '==', orgId).get();
        snap.forEach(doc => {
          const d = doc.data() || {};
          if (d.type === 'team') {
            days.push({
              id: doc.id,
              title: d.title || '',
              date: d.date || '',
              time: d.time || null,
              notes: d.notes || '',
              type: 'team',
              category: d.category || 'event',
              emoji: d.emoji || '🎉',
              color: d.color || '#ec4899',
              userName: d.userName || '',
              userId: d.userId || '',
              orgId: d.orgId || '',
              reminderBefore: d.reminderBefore || null,
            });
          }
        });
      } catch (e) {
        console.warn('Team days fetch error:', e.message);
      }
    } else {
      // For personal view, fetch user's days and filter by type 'personal'
      try {
        const snap = await db.collection('importantDays').where('userId', '==', uid).get();
        snap.forEach(doc => {
          const d = doc.data() || {};
          const docType = d.type || 'personal';
          if (docType === 'personal') {
            days.push({
              id: doc.id,
              title: d.title || '',
              date: d.date || '',
              time: d.time || null,
              notes: d.notes || '',
              type: 'personal',
              category: d.category || 'event',
              emoji: d.emoji || '🎉',
              color: d.color || '#ec4899',
              userName: d.userName || '',
              userId: d.userId || '',
              orgId: d.orgId || '',
              reminderBefore: d.reminderBefore || null,
            });
          }
        });
      } catch (e) {
        console.warn('Personal days fetch error:', e.message);
      }
    }

    // Sort by date ascending
    days.sort((a, b) => {
      try { return new Date(a.date) - new Date(b.date); } catch (e) { return 0; }
    });

    res.json({ days });
  } catch (err) {
    console.error('Get important days error:', err.message);
    res.status(500).json({ error: 'Failed to get important days', details: err.message });
  }
});

// ─── REST: Delete Important Day ─────────────────────────────────
app.post('/api/important-days/delete', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { dayId } = req.body;
    if (!dayId) return res.status(400).json({ error: 'Day ID is required' });

    // Verify ownership
    const dayDoc = await db.collection('importantDays').doc(dayId).get();
    if (!dayDoc.exists) return res.status(404).json({ error: 'Event not found' });

    const dayData = dayDoc.data();
    if (dayData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only delete your own events' });
    }

    await db.collection('importantDays').doc(dayId).delete();
    console.log(`🗑️ Important day deleted by ${req.user.email}: ${dayData.title}`);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete important day error:', err);
    res.status(500).json({ error: 'Failed to delete important day' });
  }
});

// ─── REST: Update Important Day ─────────────────────────────────
app.post('/api/important-days/update', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { dayId, title, date, time, notes, type, emoji, color, reminderBefore } = req.body;
    if (!dayId) return res.status(400).json({ error: 'Day ID is required' });
    if (!title || !date) return res.status(400).json({ error: 'Title and date are required' });

    // Verify ownership
    const dayDoc = await db.collection('importantDays').doc(dayId).get();
    if (!dayDoc.exists) return res.status(404).json({ error: 'Event not found' });

    const dayData = dayDoc.data();
    if (dayData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only edit your own events' });
    }

    await db.collection('importantDays').doc(dayId).update({
      title: String(title),
      date: String(date),
      time: time || null,
      notes: notes || '',
      type: type || 'personal',
      emoji: emoji || '🎉',
      color: color || '#ec4899',
      reminderBefore: reminderBefore || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✏️ Important day updated by ${req.user.email}: ${title}`);

    res.json({ success: true });
  } catch (err) {
    console.error('Update important day error:', err);
    res.status(500).json({ error: 'Failed to update important day' });
  }
});

// ─── REST: Get Notifications (Real-time group logs) ──────────
app.get('/api/notifications/list', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { orgId } = req.query;
    const userDocRef = await db.collection('users').doc(req.user.uid).get();
    const userData = userDocRef.exists ? userDocRef.data() : {};
    const fallbackOrgId = userData.orgId || (userData.orgIds && userData.orgIds.length > 0 ? userData.orgIds[0] : null);
    const activeOrgId = orgId || fallbackOrgId;

    if (!activeOrgId) return res.status(400).json({ error: 'User not in any organization' });

    const notificationsSnap = await db.collection('notifications')
      .where('orgId', '==', activeOrgId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    // Because some records might lack timestamp if they are just created, handle it gracefully
    const notifications = notificationsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        timestamp: d.timestamp ? (d.timestamp.toMillis ? d.timestamp.toMillis() : Date.now()) : Date.now()
      };
    });
    res.json({ success: true, notifications });
  } catch (err) {
    if (err.message && err.message.includes('index')) {
      res.json({
        success: true,
        notifications: [],
        warning: 'Index building currently...'
      });
      return;
    }
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ─── REST: Get Org Feed (Real-time dashboard entries) ──────────
app.get('/api/org/feed', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { orgId, before, month, year } = req.query;
    const userDocRef = await db.collection('users').doc(req.user.uid).get();
    const userData = userDocRef.exists ? userDocRef.data() : {};
    const fallbackOrgId = userData.orgId || (userData.orgIds && userData.orgIds.length > 0 ? userData.orgIds[0] : null);
    const activeOrgId = orgId || fallbackOrgId;

    if (!activeOrgId) return res.status(400).json({ error: 'User not in any organization' });

    const limit = 30; // Increased limit since we filter by month
    let logs = [];
    let hasMore = false;

    // Calculate time range if month/year provided
    let startTime = null;
    let endTime = null;
    if (month && year) {
      startTime = new Date(parseInt(year), parseInt(month), 1);
      endTime = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999);
    }

    try {
      let query = db.collection('moodLogs').where('orgId', '==', activeOrgId);

      if (startTime && endTime) {
        query = query.where('timestamp', '>=', startTime).where('timestamp', '<=', endTime);
      }

      query = query.orderBy('timestamp', 'desc');

      if (before && before !== 'undefined') {
        const beforeTimestamp = admin.firestore.Timestamp.fromDate(new Date(parseInt(before)));
        query = query.startAfter(beforeTimestamp);
      }

      const logsSnap = await query.limit(limit).get();
      logsSnap.forEach(doc => {
        const d = doc.data();
        logs.push({
          id: doc.id,
          uid: d.userId,
          name: d.userName || 'Unknown User',
          mood: d.mood,
          activity: d.activity || '',
          note: d.note || '',
          timestamp: d.timestamp?.toDate?.() || d.timestamp,
        });
      });
      hasMore = logs.length === limit;
    } catch (err) {
      // Fallback if index missing or other error
      if (err.message.includes('requires an index') || err.code === 9) {
        console.warn('⚠️ Firestore index missing. Using memory-side filtering.');
        const logsSnap = await db.collection('moodLogs').where('orgId', '==', activeOrgId).get();
        let allLogs = [];
        logsSnap.forEach(doc => {
          const d = doc.data();
          const ts = d.timestamp?.toDate?.() || new Date(d.timestamp);
          const time = ts.getTime();

          // Filter by month in memory if requested
          if (startTime && endTime) {
            if (time < startTime.getTime() || time > endTime.getTime()) return;
          }

          allLogs.push({
            id: doc.id,
            uid: d.userId,
            name: d.userName || 'Unknown User',
            mood: d.mood,
            activity: d.activity || '',
            note: d.note || '',
            timestamp: ts,
          });
        });

        // Convert timestamps for sorting
        const getTime = (ts) => ts.getTime();
        allLogs.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));

        let startIndex = 0;
        if (before && before !== 'undefined') {
          const beforeTime = parseInt(before);
          startIndex = allLogs.findIndex(l => getTime(l.timestamp) < beforeTime);
          if (startIndex === -1) startIndex = allLogs.length;
        }

        logs = allLogs.slice(startIndex, startIndex + limit);
        hasMore = (startIndex + limit) < allLogs.length;
      } else {
        throw err;
      }
    }

    res.json({ logs, hasMore });
  } catch (err) {

    console.error('Org feed error:', err);
    res.status(500).json({ error: 'Failed to fetch org feed' });
  }
});

// ─── REST: Get Available Months (for month picker) ──────────────
app.get('/api/org/available-months', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { orgId } = req.query;
    const userDocRef = await db.collection('users').doc(req.user.uid).get();
    const userData = userDocRef.exists ? userDocRef.data() : {};
    const fallbackOrgId = userData.orgId || (userData.orgIds && userData.orgIds.length > 0 ? userData.orgIds[0] : null);
    const activeOrgId = orgId || fallbackOrgId;

    if (!activeOrgId) return res.status(400).json({ error: 'User not in any organization' });

    // Fetch all mood logs for this org
    const logsSnap = await db.collection('moodLogs').where('orgId', '==', activeOrgId).get();

    const monthsSet = new Set();
    logsSnap.forEach(doc => {
      const d = doc.data();
      const ts = d.timestamp?.toDate?.() || new Date(d.timestamp);
      const monthKey = `${ts.getFullYear()}-${ts.getMonth()}`;
      monthsSet.add(monthKey);
    });

    const months = Array.from(monthsSet);
    res.json({ months });
  } catch (err) {
    console.error('Available months error:', err);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
});



// ─── Socket.io Auth Middleware ───────────────────────────────────
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  const decoded = await verifyToken(token);
  if (!decoded) {
    return next(new Error('Invalid token'));
  }
  socket.userId = decoded.uid;
  socket.userEmail = decoded.email;
  next();
});

// ─── Socket.io Connection Handler ───────────────────────────────
io.on('connection', async (socket) => {
  console.log(`🟢 User connected: ${socket.userEmail}`);

  try {
    // Fetch user data
    const userDoc = await db.collection('users').doc(socket.userId).get();
    if (!userDoc.exists) {
      console.log(`⚠️ User ${socket.userEmail} not found`);
      socket.emit('error_msg', { message: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const fallbackOrgId = userData.orgId || (userData.orgIds && userData.orgIds.length > 0 ? userData.orgIds[0] : null);

    if (!fallbackOrgId) {
      console.log(`⚠️ User ${socket.userEmail} has no valid org`);
      socket.emit('error_msg', { message: 'You are not in any organization' });
      return;
    }

    const passedOrgId = socket.handshake.auth.orgId;
    const orgId = passedOrgId || fallbackOrgId;

    if (fallbackOrgId !== orgId) {
      console.log(`⚠️ User ${socket.userEmail} has wrong orgId: expected ${fallbackOrgId}, got ${orgId}`);
      socket.emit('error_msg', { message: 'You are not in this organization' });
      return;
    }

    const roomName = `org_${orgId}`;

    // Join the org room
    socket.join(roomName);
    socket.orgRoom = roomName;
    socket.orgId = orgId;

    // Mark user online
    await db.collection('users').doc(socket.userId).update({
      isOnline: true,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Broadcast to room that this user is online
    io.to(roomName).emit('user_online', {
      uid: socket.userId,
      email: socket.userEmail,
      displayName: userData.username || userData.displayName || socket.userEmail,
      photoURL: userData.photoURL || '',
      currentMood: userData.currentMood || '',
      currentActivity: userData.currentActivity || '',
    });


    // Send current org members state to the connecting user
    const membersSnap = await db.collection('users')
      .where('orgId', '==', orgId)
      .get();
    const members = [];
    membersSnap.forEach(doc => {
      const memberData = doc.data();
      members.push({
        uid: doc.id,
        email: memberData.email || '',
        displayName: memberData.username || memberData.displayName || memberData.email || '',
        photoURL: memberData.photoURL || '',
        role: memberData.role || 'member',
        isOnline: memberData.isOnline || false,
        currentMood: memberData.currentMood || '',
        currentActivity: memberData.currentActivity || '',
        lastUpdated: memberData.lastUpdated || null
      });
    });
    console.log(`📤 Sending initial_state with ${members.length} members`);
    socket.emit('initial_state', { members });

    // ─── Handle mood update ───────────────────────────────
    socket.on('mood_update', async (data) => {
      const { mood, moodLabel, moodEmoji, moodColor, activity, activities, emotions, note } = data;
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Allow overriding timestamp for backlogged calendar entries
      let entryTimestamp = now;
      let isBackdated = false;
      if (data.timestamp) {
        entryTimestamp = admin.firestore.Timestamp.fromMillis(data.timestamp);

        // Detect if it's actually today's entry (allow status update if so)
        const today = new Date();
        const entryDate = new Date(data.timestamp);
        const isActuallyToday =
          today.getFullYear() === entryDate.getFullYear() &&
          today.getMonth() === entryDate.getMonth() &&
          today.getDate() === entryDate.getDate();

        if (!isActuallyToday) {
          isBackdated = true;
        }
      }

      try {
        // Fetch fresh user data just in case it was updated (e.g. joined org recently)
        const freshUserDoc = await db.collection('users').doc(socket.userId).get();
        const freshData = freshUserDoc.exists ? freshUserDoc.data() : userData;

        // 1. Log to MoodLogs (Permanent Storage)
        const logData = {
          userId: socket.userId,
          userName: freshData.username || freshData.displayName || socket.userEmail || 'Anonymous User',
          userPhoto: freshData.photoURL || '',

          orgId: orgId || '',
          mood: mood || '',
          moodLabel: moodLabel || '',
          moodEmoji: moodEmoji || '',
          moodColor: moodColor || '',
          activity: activity || '',
          activities: activities || [],
          emotions: emotions || [],
          note: note || '',
          timestamp: entryTimestamp,
        };

        const newLogRef = await db.collection('moodLogs').add(logData);

        // 2. Broadcast to room as a "Live Feed" item
        // Even backdated entries should show up in feed if they were just created
        io.to(roomName).emit('new_feed_entry', {
          id: newLogRef.id,
          uid: socket.userId,
          name: freshData.username || freshData.displayName || socket.userEmail || 'Anonymous User',

          mood: mood || '',
          moodLabel: moodLabel || '',
          moodEmoji: moodEmoji || '',
          moodColor: moodColor || '',
          activity: activity || '',
          activities: activities || [],
          emotions: emotions || [],
          note: note || '',
          timestamp: data.timestamp || Date.now(),
        });

        // 3. Update current user status if not backdated
        if (!isBackdated) {
          await db.collection('users').doc(socket.userId).update({
            currentMood: mood || '',
            currentActivity: activity || '',
            lastUpdated: now,
          });

          // Broadcast status change for Team Grid
          io.to(roomName).emit('status_update', {
            uid: socket.userId,
            mood: mood || '',
            activity: activity || '',
            timestamp: Date.now(),
          });
        }

        console.log(`🎭 ${socket.userEmail || 'FB User'} (${freshData.displayName || 'Unknown'}) → ${mood} ${isBackdated ? '(Backdated)' : ''}`);
      } catch (err) {
        console.error('Mood update error:', err);
        socket.emit('error_msg', { message: 'Failed to update mood: ' + err.message });
      }
    });

    // ─── Handle createNotification ───────────────────────────────
    socket.on('createNotification', async (data) => {
      const { title, body, type, category, linkId } = data;
      const now = admin.firestore.FieldValue.serverTimestamp();

      try {
        const freshUserDoc = await db.collection('users').doc(socket.userId).get();
        const freshData = freshUserDoc.exists ? freshUserDoc.data() : userData;

        const notifData = {
          orgId: orgId || '',
          userId: socket.userId,
          userName: freshData.username || freshData.displayName || socket.userEmail || 'Anonymous',
          userPhoto: freshData.photoURL || '',
          title: title || '',
          body: body || '',
          type: type || 'general',
          category: category || 'general',
          linkId: linkId || '',
          timestamp: now
        };

        const newNotifRef = await db.collection('notifications').add(notifData);

        io.to(roomName).emit('new_group_notification', {
          id: newNotifRef.id,
          ...notifData,
          timestamp: Date.now()
        });
        console.log(`🔔 New Group Notification: [${type}] ${title} by ${notifData.userName}`);
      } catch (err) {
        console.error('Notification creation error:', err);
      }
    });

    // ─── Handle disconnect ────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.userEmail}`);
      try {
        await db.collection('users').doc(socket.userId).update({
          isOnline: false,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
        io.to(roomName).emit('user_offline', { uid: socket.userId });
      } catch (err) {
        console.error('Disconnect update error:', err);
      }
    });

  } catch (err) {
    console.error('Connection handler error:', err);
    socket.emit('error_msg', { message: 'Server error during connection' });
  }
});

// ─── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sonder server running on http://localhost:${PORT}`);
});


// ─── REST: Get Org Settings (Admin only) ────────────────────────
app.get('/api/org/settings', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orgId = userData.orgId;
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const orgData = orgDoc.data();

    res.json({
      orgCode: orgData.inviteCode || orgId,
      membersCanInvite: orgData.membersCanInvite || false,
      memberInviteCode: orgData.inviteCode || orgId  // Same code as org inviteCode
    });
  } catch (err) {
    console.error('Get org settings error:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// ─── REST: Toggle Members Can Invite (Admin only) ────────────────
app.post('/api/org/settings/members-can-invite', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { enabled } = req.body;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orgId = userData.orgId;
    const orgRef = db.collection('organizations').doc(orgId);
    const orgDoc = await orgRef.get();
    const orgData = orgDoc.data();

    await orgRef.update({
      membersCanInvite: enabled,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      membersCanInvite: enabled,
      memberInviteCode: orgData.inviteCode || orgId  // Return same org inviteCode
    });
  } catch (err) {
    console.error('Toggle members can invite error:', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ─── REST: Make Member Admin (Admin only) ────────────────────────
app.post('/api/org/make-admin', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { uid } = req.body;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orgId = userData.orgId;

    // Update target user to admin
    await db.collection('users').doc(uid).update({
      role: 'admin',
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Make admin error:', err);
    res.status(500).json({ error: 'Failed to make admin' });
  }
});

// ─── REST: Remove Member (Admin only) ────────────────────────────
app.post('/api/org/remove-member', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { uid } = req.body;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Don't allow removing self
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Remove user from org
    await db.collection('users').doc(uid).update({
      orgId: null,
      role: 'member',
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ─── REST: Leave Organization (Member only) ──────────────────────
app.post('/api/org/leave', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const { orgId } = req.body;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.orgId) {
      return res.status(400).json({ error: 'Not in an organization' });
    }

    // Don't allow admin to leave (they should transfer ownership first)
    if (userData.role === 'admin' || userData.role === 'owner') {
      return res.status(403).json({ error: 'Admins cannot leave. Please transfer ownership first or delete the organization.' });
    }

    // Verify orgId matches
    if (userData.orgId !== orgId) {
      return res.status(400).json({ error: 'Organization mismatch' });
    }

    // Remove user from org (keep mood logs for history when they rejoin)
    await db.collection('users').doc(req.user.uid).update({
      orgId: '',
      role: 'member',
      isOnline: false,
      currentMood: '',
      currentActivity: '',
      updatedAt: new Date().toISOString()
    });

    console.log(`🔍 Updated user ${req.user.uid} - orgId set to empty string`);

    // IMPORTANT: Remove user from organization's members array
    await db.collection('organizations').doc(orgId).update({
      members: admin.firestore.FieldValue.arrayRemove(req.user.uid)
    });

    console.log(`🔍 Removed user ${req.user.uid} from org ${orgId} members array`);

    // Notify other members that this user left
    io.to(orgId).emit('member:left', {
      uid: req.user.uid,
      name: userData.displayName || userData.email || 'Unknown',
      timestamp: Date.now()
    });

    console.log(`👋 User ${req.user.uid} (${userData.displayName || userData.email}) left organization ${orgId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Leave organization error:', err);
    res.status(500).json({ error: 'Failed to leave organization' });
  }
});

// Helper function to generate invite codes
function generateInviteCode(type = 'admin') {
  // Generate 6-character code (same as org inviteCode)
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


// ─── REST: Get Team Statistics (Admin only) ──────────────────────
app.get('/api/org/team-stats', authMiddleware, async (req, res) => {
  if (!firebaseReady) return res.status(503).json({ error: 'Firebase not configured' });

  try {
    const { range = '30' } = req.query;
    console.log(`📊 Team stats requested by: ${req.user.uid} (Range: ${range})`);

    // Get user data
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orgId = userData.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'User not in an organization' });
    }

    // Get all members for names and photos
    const membersSnap = await db.collection('users').where('orgId', '==', orgId).get();
    const totalMembers = membersSnap.size;
    const memberDetails = {};
    membersSnap.forEach(doc => {
      const d = doc.data();
      memberDetails[doc.id] = {
        name: d.username || d.displayName || d.email || 'Unknown',
        photoURL: d.photoURL || ''
      };
    });

    // Calculate time threshold
    let thresholdDate = new Date();
    let numDays = parseInt(range);

    if (range === 'all') {
      thresholdDate = new Date(0); // Epoch
      numDays = 365; // Default for average calculation if "all"
    } else {
      thresholdDate.setDate(thresholdDate.getDate() - numDays);
    }
    const thresholdTimestamp = thresholdDate.getTime();

    // Fetch logs
    let logsSnap;
    try {
      logsSnap = await db.collection('moodLogs')
        .where('orgId', '==', orgId)
        .get();
    } catch (err) {
      console.warn('⚠️ Fetching logs by orgId failed, falling back to member-by-member fetch');
      const allDocs = [];
      const memberUids = Object.keys(memberDetails);
      for (const uid of memberUids) {
        const userLogs = await db.collection('moodLogs').where('userId', '==', uid).get();
        userLogs.forEach(doc => allDocs.push(doc));
      }
      logsSnap = { docs: allDocs };
    }

    // Process logs
    const logs = [];
    const memberStatsMap = {};
    const moodCounts = { rad: 0, good: 0, meh: 0, bad: 0, awful: 0 };
    const activityCounts = {};
    const memberHistoryMap = {}; // uid -> { dateStr: { mood, ts } }
    const moodScoreMap = { rad: 5, good: 4, meh: 3, bad: 2, awful: 1 };

    logsSnap.docs?.forEach(doc => {
      const data = doc.data();
      let timestamp = data.timestamp;
      if (timestamp?.toMillis) timestamp = timestamp.toMillis();
      else if (timestamp?.toDate) timestamp = timestamp.toDate().getTime();
      else if (typeof timestamp === 'string') timestamp = new Date(timestamp).getTime();

      if (timestamp >= thresholdTimestamp) {
        logs.push({ ...data, timestamp });

        // Team Mood Dist
        if (data.mood && moodCounts[data.mood] !== undefined) {
          moodCounts[data.mood]++;
        }

        // Team Activities
        const acts = data.activities || data.activity || [];
        const actArray = Array.isArray(acts) ? acts : [acts];
        actArray.forEach(act => {
          if (act && act.trim()) {
            activityCounts[act] = (activityCounts[act] || 0) + 1;
          }
        });

        // Member Breakdown
        const uid = data.userId || data.uid;
        if (uid) {
          if (!memberStatsMap[uid]) {
            memberStatsMap[uid] = {
              uid,
              name: memberDetails[uid]?.name || data.userName || 'Unknown',
              photoURL: memberDetails[uid]?.photoURL || data.userPhoto || '',
              entryCount: 0,
              totalMoodScore: 0,
              moodWeights: 0
            };
          }
          memberStatsMap[uid].entryCount++;

          // Member 7-day history tracking
          const logDate = new Date(timestamp);
          const dateKey = `${logDate.getFullYear()}-${logDate.getMonth() + 1}-${logDate.getDate()}`;
          if (!memberHistoryMap[uid]) memberHistoryMap[uid] = {};
          if (!memberHistoryMap[uid][dateKey] || timestamp > memberHistoryMap[uid][dateKey].ts) {
            memberHistoryMap[uid][dateKey] = { mood: data.mood, ts: timestamp };
          }

          if (data.mood && moodScoreMap[data.mood]) {
            memberStatsMap[uid].totalMoodScore += moodScoreMap[data.mood];
            memberStatsMap[uid].moodWeights++;
          }
        }
      }
    });

    // Finalize stats
    const totalEntries = logs.length;
    const avgEntriesPerDay = numDays > 0 ? (totalEntries / numDays).toFixed(1) : totalEntries;
    const activeMembers = Object.keys(memberStatsMap).length;

    const topActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));

    const memberBreakdown = Object.values(memberStatsMap)
      .map(m => {
        const avgScore = m.moodWeights > 0 ? (m.totalMoodScore / m.moodWeights) : 0;
        let avgMoodLabel = 'N/A';
        if (avgScore >= 4.5) avgMoodLabel = 'Rad';
        else if (avgScore >= 3.5) avgMoodLabel = 'Good';
        else if (avgScore >= 2.5) avgMoodLabel = 'Meh';
        else if (avgScore >= 1.5) avgMoodLabel = 'Bad';
        else if (avgScore > 0) avgMoodLabel = 'Awful';

        // Calculate 7-day streak dots
        const streak = [];
        const todayIdx = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(todayIdx);
          d.setDate(d.getDate() - i);
          const dKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          const log = memberHistoryMap[m.uid] ? memberHistoryMap[m.uid][dKey] : null;
          streak.push(log ? log.mood : null);
        }

        // Calculate current consecutive streak
        let streakCount = 0;
        const sToday = new Date();
        const sYesterday = new Date();
        sYesterday.setDate(sYesterday.getDate() - 1);

        const sTodayKey = `${sToday.getFullYear()}-${sToday.getMonth() + 1}-${sToday.getDate()}`;
        const sYesterdayKey = `${sYesterday.getFullYear()}-${sYesterday.getMonth() + 1}-${sYesterday.getDate()}`;

        // Start counting back if present today or yesterday
        let sCheck = (memberHistoryMap[m.uid] && memberHistoryMap[m.uid][sTodayKey]) ? sToday : (memberHistoryMap[m.uid] && memberHistoryMap[m.uid][sYesterdayKey] ? sYesterday : null);

        if (sCheck) {
          let sSafety = 0;
          while (sSafety < 100) {
            const k = `${sCheck.getFullYear()}-${sCheck.getMonth() + 1}-${sCheck.getDate()}`;
            if (memberHistoryMap[m.uid] && memberHistoryMap[m.uid][k]) {
              streakCount++;
              sCheck.setDate(sCheck.getDate() - 1);
              sSafety++;
            } else {
              break;
            }
          }
        }

        return {
          uid: m.uid,
          name: m.name,
          photoURL: m.photoURL,
          entryCount: m.entryCount,
          avgMood: avgMoodLabel,
          streak: streak,
          streakCount: streakCount
        };
      })
      .sort((a, b) => b.entryCount - a.entryCount);

    // Mood data for chart
    // We'll show the last 7 time units (either days or buckets)
    // For simplicity, let's keep it daily for 7, 30, 90. For "all", maybe weekly?
    // Let's stick to last 7-10 data points on the x-axis for visual clarity.
    const moodData = {};
    const chartLookback = range === 'all' ? 30 : (range === '90' ? 14 : 7);

    for (let i = 0; i < chartLookback; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      moodData[dateStr] = { rad: 0, good: 0, meh: 0, bad: 0, awful: 0 };
    }

    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (moodData[dateStr] && log.mood && moodData[dateStr][log.mood] !== undefined) {
        moodData[dateStr][log.mood]++;
      }
    });

    // Calculate Team Streak
    // Get unique days with entries (sorted descending)
    const uniqueDays = [...new Set(logs.map(log => {
      const d = new Date(log.timestamp);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    if (uniqueDays.length > 0) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

      // If the most recent entry is today or yesterday, we can have a streak
      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
        currentStreak = 1;
        for (let i = 0; i < uniqueDays.length - 1; i++) {
          const d1 = new Date(uniqueDays[i]);
          const d2 = new Date(uniqueDays[i + 1]);
          const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      totalEntries,
      avgEntriesPerDay: parseFloat(avgEntriesPerDay),
      activeMembers,
      totalMembers,
      moodDistribution: moodCounts,
      topActivities,
      memberBreakdown,
      teamStreak: currentStreak,
      moodData
    });

  } catch (err) {
    console.error('❌ Get team stats error:', err);
    res.status(500).json({ error: 'Failed to get team stats', details: err.message });
  }
});
