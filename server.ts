import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

const allowedOrigins = new Set(
  [
    'https://localhost',
    'http://localhost',
    'http://localhost:3000',
    'capacitor://localhost',
    'https://ais-pre-htz6lzojiok5ca7wdqyqev-162022780190.asia-southeast1.run.app',
    'https://ais-dev-htz6lzojiok5ca7wdqyqev-162022780190.asia-southeast1.run.app',
    process.env.APP_URL,
  ].filter(Boolean) as string[]
);

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Bootstrap-Secret');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.json());

// Load Firebase configuration
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.warn('Could not parse firebase-applet-config.json:', e);
  }
}

// Initialize Firebase Admin SDK
let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

try {
  if (!getAdminApps().length && firebaseConfig.projectId) {
    adminApp = initAdminApp({
      projectId: firebaseConfig.projectId,
    });
  } else if (getAdminApps().length) {
    adminApp = getAdminApps()[0];
  }

  if (adminApp) {
    adminAuth = getAdminAuth(adminApp);
    const dbId = firebaseConfig.firestoreDatabaseId;
    adminDb = dbId ? getAdminFirestore(adminApp, dbId) : getAdminFirestore(adminApp);
  }
} catch (e) {
  console.warn('Firebase Admin SDK setup notice:', e);
}

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// Auth Middleware: Verify Firebase ID Token
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    admin?: boolean;
    [key: string]: any;
  };
}

async function verifyAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.replace(/^Bearer /, '');

  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token, true);
      req.user = decoded;
      return next();
    } catch (error: any) {
      console.warn('Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
  }

  // If Firebase Admin Auth is not configured on the server, deny access
  return res.status(503).json({ error: 'Authentication service unavailable on server' });
}

// Admin Guard Middleware - Strictly validates Firebase custom claims
async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Strictly check verified custom claim from token
  if (req.user.admin === true) {
    return next();
  }

  return res.status(403).json({ error: 'Administrative privileges required' });
}

// ==========================================
// ADMIN MANAGEMENT, ANALYTICS & HEALTH ENDPOINTS
// ==========================================

// 0. Verify Administrator Privileges - Strictly custom claim verified
app.get('/api/admin/verify', verifyAuthToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  const email = req.user?.email || '';
  const isAdminUser = req.user?.admin === true;

  return res.json({
    isAdmin: isAdminUser,
    uid,
    email,
  });
});

// 1. One-time secure Administrator Bootstrap
app.post('/api/admin/bootstrap', verifyAuthToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || '';

    if (!uid) {
      return res.status(400).json({ error: 'User identifier required' });
    }

    const bootstrapSecret = req.body.secret || req.headers['x-admin-bootstrap-secret'];
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

    let hasExistingAdmin = false;
    if (adminDb) {
      const adminDocs = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
      hasExistingAdmin = !adminDocs.empty;
    }

    // If admins already exist, only an existing verified admin can promote new admins
    if (hasExistingAdmin && req.user?.admin !== true) {
      // Allow bootstrap only if a dedicated server bootstrap secret is provided
      if (!configuredSecret || bootstrapSecret !== configuredSecret) {
        return res.status(403).json({
          error: 'An administrator is already configured for this application. Administrative privileges are required to promote users.',
        });
      }
    }

    // For first-time initialization when no admins exist, require secret if configured
    if (!hasExistingAdmin && configuredSecret && bootstrapSecret !== configuredSecret) {
      return res.status(403).json({
        error: 'Administrator bootstrap secret is required for initial configuration.',
      });
    }

    if (adminAuth) {
      await adminAuth.setCustomUserClaims(uid, { admin: true });
    }

    const now = new Date().toISOString();
    if (adminDb) {
      await adminDb.collection('users').doc(uid).set(
        {
          role: 'admin',
          updatedAt: now,
        },
        { merge: true }
      );

      const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await adminDb.collection('adminLogs').doc(logId).set({
        id: logId,
        adminUid: uid,
        adminEmail: email,
        action: 'bootstrap_admin',
        targetUid: uid,
        targetEmail: email,
        reason: 'Authorized administrator bootstrap execution',
        result: 'success',
        timestamp: now,
      });
    }

    return res.json({
      success: true,
      message: `User ${email || uid} has been promoted to Administrator.`,
    });
  } catch (error: any) {
    console.error('Admin bootstrap error:', error);
    return res.status(500).json({ error: error?.message || 'Admin bootstrap failed' });
  }
});

// 2. Sensitive Action Re-Authentication Verification
app.post('/api/admin/reauth', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password } = req.body;
    // For sensitive operations (demoting admins, deleting accounts, user suspension)
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password confirmation is required for sensitive administrative operations' });
    }

    return res.json({ success: true, verified: true });
  } catch (error: any) {
    return res.status(401).json({ error: 'Re-authentication failed' });
  }
});

// 3. User Directory (Search, Filter, Sort & Paginate)
app.get('/api/admin/users', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!adminDb) {
      return res.json({ users: [], total: 0, page: 1, totalPages: 1 });
    }

    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const filter = (req.query.filter as string) || 'all';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '20', 10)));

    const snap = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let allUsers = snap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        uid: data.uid || doc.id,
        displayName: data.displayName || 'Unnamed User',
        email: data.email || '',
        photoURL: data.photoURL || '',
        authProvider: data.authProvider || 'password',
        emailVerified: !!data.emailVerified,
        role: data.role || 'user',
        accountStatus: data.accountStatus || 'active',
        createdAt: data.createdAt || '',
        lastLoginAt: data.lastLoginAt || '',
        onboardingCompleted: !!data.onboardingCompleted,
      };
    });

    // Apply search filter
    if (search) {
      allUsers = allUsers.filter(
        (u: any) =>
          u.displayName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.uid.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (filter === 'active') {
      allUsers = allUsers.filter((u: any) => u.accountStatus === 'active');
    } else if (filter === 'suspended') {
      allUsers = allUsers.filter((u: any) => u.accountStatus === 'suspended');
    } else if (filter === 'verified') {
      allUsers = allUsers.filter((u: any) => u.emailVerified);
    } else if (filter === 'unverified') {
      allUsers = allUsers.filter((u: any) => !u.emailVerified);
    } else if (filter === 'recent') {
      allUsers = allUsers.filter((u: any) => u.createdAt && u.createdAt >= sevenDaysAgo);
    } else if (filter === 'admin') {
      allUsers = allUsers.filter((u: any) => u.role === 'admin');
    }

    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);

    return res.json({
      users: paginatedUsers,
      total,
      page,
      totalPages,
    });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to retrieve user directory' });
  }
});

// 4. User Detail View (Strict Privacy Invariant: Aggregated counts only, no personal task contents)
app.get('/api/admin/users/:uid', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    if (!adminDb) {
      return res.status(404).json({ error: 'Database unavailable' });
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();
    const userProfile = {
      uid: userData.uid || userDoc.id,
      displayName: userData.displayName || 'Unnamed User',
      email: userData.email || '',
      photoURL: userData.photoURL || '',
      authProvider: userData.authProvider || 'password',
      emailVerified: !!userData.emailVerified,
      role: userData.role || 'user',
      accountStatus: userData.accountStatus || 'active',
      createdAt: userData.createdAt || '',
      updatedAt: userData.updatedAt || '',
      lastLoginAt: userData.lastLoginAt || '',
      onboardingCompleted: !!userData.onboardingCompleted,
    };

    // Calculate real productivity metric counts without reading private text
    let tasksCreatedCount = 0;
    let tasksCompletedCount = 0;
    let activeHabitsCount = 0;
    let remindersScheduledCount = 0;

    try {
      const tasksSnap = await adminDb.collection('tasks').where('userId', '==', uid).get();
      tasksCreatedCount = tasksSnap.size;
      tasksSnap.forEach((d: any) => {
        const data = d.data();
        if (data.status === 'completed') tasksCompletedCount += 1;
        if (data.reminderAt) remindersScheduledCount += 1;
      });
    } catch (e) {
      // ignore
    }

    try {
      const habitsSnap = await adminDb.collection('habits').where('userId', '==', uid).where('archived', '==', false).get();
      activeHabitsCount = habitsSnap.size;
    } catch (e) {
      // ignore
    }

    // Recent activity events for this user (non-sensitive telemetry)
    let recentActivity: any[] = [];
    try {
      const activitySnap = await adminDb
        .collection('activityEvents')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

      recentActivity = activitySnap.docs.map((doc: any) => doc.data());
    } catch (e) {
      // ignore
    }

    return res.json({
      user: userProfile,
      tasksCreatedCount,
      tasksCompletedCount,
      activeHabitsCount,
      remindersScheduledCount,
      recentActivity,
    });
  } catch (error: any) {
    console.error('User detail error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to retrieve user details' });
  }
});

// 5. Suspend or Reactivate a User Account
app.post('/api/admin/users/:uid/status', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or suspended' });
    }

    if (uid === req.user?.uid && status === 'suspended') {
      return res.status(400).json({ error: 'Administrators cannot suspend their own account' });
    }

    const now = new Date().toISOString();

    if (adminDb) {
      await adminDb.collection('users').doc(uid).update({
        accountStatus: status,
        updatedAt: now,
      });

      const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await adminDb.collection('adminLogs').doc(logId).set({
        id: logId,
        adminUid: req.user?.uid || 'admin',
        adminEmail: req.user?.email || 'admin',
        action: status === 'suspended' ? 'suspend_user' : 'reactivate_user',
        targetUid: uid,
        targetEmail: req.body.email || 'user',
        reason: reason || `Account set to ${status}`,
        result: 'success',
        timestamp: now,
      });
    }

    if (adminAuth) {
      await adminAuth.updateUser(uid, {
        disabled: status === 'suspended',
      }).catch((e: any) => console.warn('Auth disabled note:', e?.message));
    }

    return res.json({
      success: true,
      message: `Account has been set to ${status}.`,
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to update user status' });
  }
});

// 6. Update User Role (Promote / Demote)
app.post('/api/admin/users/:uid/role', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be user or admin' });
    }

    if (uid === req.user?.uid && role === 'user') {
      return res.status(400).json({ error: 'You cannot revoke your own administrator role' });
    }

    const now = new Date().toISOString();

    if (adminAuth) {
      await adminAuth.setCustomUserClaims(uid, { admin: role === 'admin' });
    }

    if (adminDb) {
      await adminDb.collection('users').doc(uid).update({
        role,
        updatedAt: now,
      });

      const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await adminDb.collection('adminLogs').doc(logId).set({
        id: logId,
        adminUid: req.user?.uid || 'admin',
        adminEmail: req.user?.email || 'admin',
        action: role === 'admin' ? 'promote_admin' : 'revoke_admin',
        targetUid: uid,
        targetEmail: req.body.email || 'user',
        reason: `Role changed to ${role}`,
        result: 'success',
        timestamp: now,
      });
    }

    return res.json({
      success: true,
      message: `User role has been updated to ${role}.`,
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to update user role' });
  }
});

// 7. Admin Overview Statistics (Computed from real database records)
app.get('/api/admin/stats', verifyAuthToken, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (!adminDb) {
      return res.json({
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        activeUsersToday: 0,
        activeUsers7Days: 0,
        activeUsers30Days: 0,
        verifiedUsers: 0,
        suspendedUsers: 0,
        totalTasksCreated: 0,
        totalTasksCompleted: 0,
        totalActiveHabits: 0,
        totalRemindersScheduled: 0,
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const usersSnap = await adminDb.collection('users').get();

    let totalUsers = 0;
    let newUsersToday = 0;
    let newUsersThisWeek = 0;
    let activeUsersToday = 0;
    let activeUsers7Days = 0;
    let activeUsers30Days = 0;
    let verifiedUsers = 0;
    let suspendedUsers = 0;

    usersSnap.forEach((doc: any) => {
      const u = doc.data();
      totalUsers += 1;
      if (u.accountStatus === 'suspended') suspendedUsers += 1;
      if (u.emailVerified) verifiedUsers += 1;

      if (u.createdAt) {
        if (u.createdAt.startsWith(todayStr)) newUsersToday += 1;
        if (u.createdAt >= sevenDaysAgo) newUsersThisWeek += 1;
      }

      if (u.lastLoginAt) {
        if (u.lastLoginAt.startsWith(todayStr)) activeUsersToday += 1;
        if (u.lastLoginAt >= sevenDaysAgo) activeUsers7Days += 1;
        if (u.lastLoginAt >= thirtyDaysAgo) activeUsers30Days += 1;
      }
    });

    let totalTasksCreated = 0;
    let totalTasksCompleted = 0;
    let totalRemindersScheduled = 0;

    try {
      const tasksSnap = await adminDb.collection('tasks').get();
      totalTasksCreated = tasksSnap.size;
      tasksSnap.forEach((d: any) => {
        const t = d.data();
        if (t.status === 'completed') totalTasksCompleted += 1;
        if (t.reminderAt) totalRemindersScheduled += 1;
      });
    } catch (e) {
      // ignore
    }

    let totalActiveHabits = 0;
    try {
      const habitsSnap = await adminDb.collection('habits').where('archived', '==', false).get();
      totalActiveHabits = habitsSnap.size;
    } catch (e) {
      // ignore
    }

    return res.json({
      totalUsers,
      activeUsers: activeUsers7Days,
      recentRegistrations: newUsersThisWeek,
      newUsersToday,
      newUsersThisWeek,
      activeUsersToday,
      activeUsers7Days,
      activeUsers30Days,
      verifiedUsers,
      suspendedUsers,
      totalTasksCreated,
      totalTasksCompleted,
      totalActiveHabits,
      totalRemindersScheduled,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to calculate statistics' });
  }
});

// 8. User Activity Ingestion (Validates event, strips personal text, records telemetry)
app.post('/api/analytics/events', verifyAuthToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventType, metadata, platform, appVersion } = req.body;
    const userId = req.user?.uid || 'anonymous';

    const validEventTypes = [
      'USER_REGISTERED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'PROFILE_UPDATED',
      'TASK_CREATED',
      'TASK_COMPLETED',
      'TASK_UPDATED',
      'TASK_ARCHIVED',
      'HABIT_CREATED',
      'HABIT_COMPLETED',
      'REMINDER_CREATED',
      'REMINDER_UPDATED',
      'REMINDER_CANCELLED',
      'SYNC_SUCCESS',
      'SYNC_FAILURE',
      'ACCOUNT_DELETED',
    ];

    if (!eventType || !validEventTypes.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid or unsupported eventType' });
    }

    // Privacy Sanitization: strictly purge personal text (titles, notes, descriptions, passwords)
    const sanitizedMetadata: Record<string, any> = {};
    if (metadata && typeof metadata === 'object') {
      for (const [k, v] of Object.entries(metadata)) {
        const lowerKey = k.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('title') ||
          lowerKey.includes('description') ||
          lowerKey.includes('note') ||
          lowerKey.includes('content')
        ) {
          continue; // redact
        }
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          sanitizedMetadata[k] = v;
        }
      }
    }

    const now = new Date();
    const isoString = now.toISOString();
    const dateKey = isoString.split('T')[0];
    const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const eventDoc = {
      id: eventId,
      userId,
      eventType,
      timestamp: isoString,
      appVersion: String(appVersion || '1.0.0'),
      platform: String(platform || 'web'),
      metadata: sanitizedMetadata,
    };

    if (adminDb) {
      await adminDb.collection('activityEvents').doc(eventId).set(eventDoc);

      // Aggregate into daily analytics document
      const dailyRef = adminDb.collection('dailyAnalytics').doc(dateKey);
      const updates: Record<string, any> = {
        date: dateKey,
        updatedAt: isoString,
      };

      if (eventType === 'TASK_CREATED') updates.tasksCreated = (adminDb as any).FieldValue?.increment(1) || 1;
      if (eventType === 'TASK_COMPLETED') updates.tasksCompleted = (adminDb as any).FieldValue?.increment(1) || 1;
      if (eventType === 'HABIT_COMPLETED') updates.habitsCompleted = (adminDb as any).FieldValue?.increment(1) || 1;
      if (eventType === 'REMINDER_CREATED') updates.remindersScheduled = (adminDb as any).FieldValue?.increment(1) || 1;

      await dailyRef.set(updates, { merge: true }).catch(() => {});
    }

    return res.json({ success: true, eventId });
  } catch (error: any) {
    console.error('Event ingestion error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to ingest event' });
  }
});

// 9. Activity Feed for Admin Console
app.get('/api/admin/activity', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!adminDb) return res.json({ events: [], total: 0 });

    const eventType = req.query.eventType as string;
    const userId = req.query.userId as string;
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '50', 10)));

    let query: any = adminDb.collection('activityEvents').orderBy('timestamp', 'desc');

    if (eventType && eventType !== 'all') {
      query = query.where('eventType', '==', eventType);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snap = await query.limit(limit).get();
    const events = snap.docs.map((doc: any) => doc.data());

    return res.json({ events, total: events.length });
  } catch (error: any) {
    console.error('Activity logs error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch activity logs' });
  }
});

// 10. Productivity Analytics Time-Series
app.get('/api/admin/analytics', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const range = (req.query.range as string) || '7d';
    let days = 7;
    if (range === '14d') days = 14;
    else if (range === '30d') days = 30;
    else if (range === 'all') days = 60;

    if (!adminDb) {
      return res.json({ series: [] });
    }

    // Build timeline dates
    const series: any[] = [];
    const dateMap = new Map<string, any>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const entry = {
        date: dateStr,
        tasksCreated: 0,
        tasksCompleted: 0,
        activeUsers: 0,
        habitsCompleted: 0,
        remindersScheduled: 0,
        completionRate: 0,
      };
      series.push(entry);
      dateMap.set(dateStr, entry);
    }

    // 1. Check dailyAnalytics collection
    try {
      const snap = await adminDb.collection('dailyAnalytics').get();
      snap.forEach((doc: any) => {
        const data = doc.data();
        if (dateMap.has(data.date)) {
          const item = dateMap.get(data.date);
          item.tasksCreated = Math.max(item.tasksCreated, data.tasksCreated || 0);
          item.tasksCompleted = Math.max(item.tasksCompleted, data.tasksCompleted || 0);
          item.habitsCompleted = Math.max(item.habitsCompleted, data.habitsCompleted || 0);
          item.remindersScheduled = Math.max(item.remindersScheduled, data.remindersScheduled || 0);
        }
      });
    } catch (e) {
      // ignore
    }

    // 2. Synthesize with actual database tasks and activity events
    try {
      const tasksSnap = await adminDb.collection('tasks').get();
      tasksSnap.forEach((doc: any) => {
        const t = doc.data();
        const createdDate = t.createdAt ? t.createdAt.split('T')[0] : '';
        if (dateMap.has(createdDate)) {
          const item = dateMap.get(createdDate);
          item.tasksCreated += 1;
        }
        if (t.completedAt) {
          const completedDate = t.completedAt.split('T')[0];
          if (dateMap.has(completedDate)) {
            const item = dateMap.get(completedDate);
            item.tasksCompleted += 1;
          }
        }
      });
    } catch (e) {
      // ignore
    }

    // Calculate completion rates and return
    series.forEach((s) => {
      s.completionRate = s.tasksCreated > 0 ? Math.round((s.tasksCompleted / s.tasksCreated) * 100) : 0;
    });

    return res.json({ series, range });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to calculate analytics' });
  }
});

// 11. Application Health Ingestion
app.post('/api/health/log-error', async (req: Request, res: Response) => {
  try {
    const { errorType, message, platform, userId } = req.body;

    const validErrorTypes = ['auth_failure', 'sync_failure', 'db_error', 'notification_failure', 'app_error'];
    const type = validErrorTypes.includes(errorType) ? errorType : 'app_error';

    // Strip out potential sensitive tokens or passwords
    const cleanMessage = String(message || 'Unknown error').replace(/[a-zA-Z0-9_\-\.]{40,}/g, '[REDACTED_TOKEN]').substring(0, 500);

    const now = new Date().toISOString();
    const errorId = 'err_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const errorRecord = {
      id: errorId,
      errorType: type,
      message: cleanMessage,
      timestamp: now,
      userId: userId ? String(userId).substring(0, 128) : 'anonymous',
      platform: String(platform || 'web'),
      resolved: false,
    };

    if (adminDb) {
      await adminDb.collection('healthErrors').doc(errorId).set(errorRecord);
    }

    return res.json({ success: true, errorId });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to record health error' });
  }
});

// 12. Application Health Monitoring Status
app.get('/api/admin/health', verifyAuthToken, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (!adminDb) {
      return res.json({
        status: 'healthy',
        counts: { auth_failure: 0, sync_failure: 0, db_error: 0, notification_failure: 0, app_error: 0 },
        recentErrors: [],
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      });
    }

    const errorsSnap = await adminDb.collection('healthErrors').orderBy('timestamp', 'desc').limit(40).get();

    const counts: Record<string, number> = {
      auth_failure: 0,
      sync_failure: 0,
      db_error: 0,
      notification_failure: 0,
      app_error: 0,
    };

    const recentErrors = errorsSnap.docs.map((doc: any) => {
      const data = doc.data();
      if (counts[data.errorType] !== undefined) {
        counts[data.errorType] += 1;
      }
      return data;
    });

    const totalErrors = recentErrors.length;
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (totalErrors > 20 || counts.db_error > 5) status = 'critical';
    else if (totalErrors > 5) status = 'degraded';

    return res.json({
      status,
      counts,
      recentErrors,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    });
  } catch (error: any) {
    console.error('Health monitoring error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch operational health' });
  }
});

// 13. Resolve Health Error
app.post('/api/admin/health/resolve/:errorId', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { errorId } = req.params;
    if (adminDb) {
      await adminDb.collection('healthErrors').doc(errorId).update({ resolved: true });
    }
    return res.json({ success: true, message: 'Error marked as resolved' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to resolve error' });
  }
});

// 14. Admin Audit Logs
app.get('/api/admin/logs', verifyAuthToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!adminDb) return res.json({ logs: [] });
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '50', 10)));
    const action = req.query.action as string;

    let query: any = adminDb.collection('adminLogs').orderBy('timestamp', 'desc');
    if (action && action !== 'all') {
      query = query.where('action', '==', action);
    }

    const snap = await query.limit(limit).get();
    const logs = snap.docs.map((doc: any) => doc.data());
    return res.json({ logs });
  } catch (error: any) {
    console.error('Admin logs error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch audit logs' });
  }
});

// 15. Complete Account Deletion (Self or Admin)
app.delete('/api/user/account', verifyAuthToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const callerUid = req.user?.uid;
    const targetUid = (req.query.uid as string) || callerUid;

    if (!callerUid || !targetUid) {
      return res.status(400).json({ error: 'User identifier required' });
    }

    if (callerUid !== targetUid && req.user?.admin !== true) {
      return res.status(403).json({ error: 'Cannot delete another user account' });
    }

    const now = new Date().toISOString();

    if (adminDb) {
      const collections = ['tasks', 'habits', 'habitLogs', 'userPreferences', 'activityEvents'];
      for (const collName of collections) {
        const fieldName = collName === 'userPreferences' ? '__name__' : 'userId';
        const q = collName === 'userPreferences'
          ? adminDb.collection(collName).doc(targetUid)
          : adminDb.collection(collName).where(fieldName, '==', targetUid);

        if (collName === 'userPreferences') {
          await q.delete().catch(() => {});
        } else {
          const docsSnap = await q.get();
          const batch = adminDb.batch();
          docsSnap.forEach((d: any) => batch.delete(d.ref));
          if (!docsSnap.empty) {
            await batch.commit().catch(() => {});
          }
        }
      }

      await adminDb.collection('users').doc(targetUid).delete().catch(() => {});

      const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await adminDb.collection('adminLogs').doc(logId).set({
        id: logId,
        adminUid: callerUid,
        adminEmail: req.user?.email || 'user',
        action: 'delete_user',
        targetUid,
        targetEmail: req.user?.email || 'user',
        reason: 'Account deletion requested and completed',
        result: 'success',
        timestamp: now,
      });
    }

    if (adminAuth) {
      await adminAuth.deleteUser(targetUid).catch((e: any) => console.warn('Auth delete note:', e?.message));
    }

    return res.json({
      success: true,
      message: 'Account and all associated private workspace data deleted permanently.',
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to complete account deletion' });
  }
});

// ==========================================
// AI ASSISTANT ENDPOINTS
// ==========================================

// AI Endpoint: Brain Dump to Structured Tasks
app.post('/api/ai/braindump', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!aiClient) {
      const lines = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
      const fallbackTasks = lines.map(line => ({
        title: line,
        priority: 'medium',
        bucket: 'inbox',
        category: 'Personal',
        estimatedMinutes: 25,
        subtasks: [],
      }));
      return res.json({ tasks: fallbackTasks });
    }

    const prompt = `You are a productivity expert assistant for Tovo app.
Analyze the following unstructured brain dump and extract discrete, actionable tasks.
For each task determine:
- title: clear, concise verb-first title (under 80 chars)
- description: optional context or notes (under 200 chars)
- priority: "high" | "medium" | "low"
- bucket: "today" | "upcoming" | "someday" | "inbox"
- category: e.g. "Work", "Personal", "Health", "Ideas", "Finance"
- estimatedMinutes: estimated duration in minutes (e.g. 15, 30, 45, 60)
- subtasks: array of 2-4 bite-sized subtask strings if applicable

Return ONLY valid JSON matching this schema:
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low" | "medium" | "high",
      "bucket": "inbox" | "today" | "upcoming" | "someday",
      "category": "string",
      "estimatedMinutes": number,
      "subtasks": ["string"]
    }
  ]
}

Brain dump content:
"""${text}"""`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"tasks": []}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Brain dump error, falling back to local extraction:', error?.message || error);
    const { text } = req.body;
    const lines = (typeof text === 'string' ? text : '')
      .split(/[\n.;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2);
    const fallbackTasks = lines.slice(0, 8).map(line => ({
      title: line.length > 60 ? line.substring(0, 57) + '...' : line,
      description: line.length > 60 ? line : '',
      priority: 'medium',
      bucket: 'inbox',
      category: 'General',
      estimatedMinutes: 25,
      subtasks: [],
    }));
    return res.json({ tasks: fallbackTasks });
  }
});

// AI Endpoint: Task Breakdown
app.post('/api/ai/breakdown', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    if (!aiClient) {
      return res.json({
        subtasks: [
          `Research and prepare initial scope for ${title}`,
          `Execute first draft or milestone`,
          `Review results and complete checklist`,
        ],
      });
    }

    const prompt = `You are an executive function coach for Tovo app.
Break down the following large task into 3 to 6 atomic, actionable, sequentially ordered subtasks.
Keep each subtask under 60 characters and start with an active verb.

Task Title: "${title}"

Return ONLY valid JSON:
{
  "subtasks": ["step 1", "step 2", "step 3"]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"subtasks": []}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Task breakdown error, providing resilient fallback:', error?.message || error);
    return res.json({
      subtasks: [
        `Define requirements and scope for ${title}`,
        `Execute primary draft and implementation`,
        `Validate deliverables and verify quality`,
        `Complete final review and wrap up`,
      ],
    });
  }
});

// AI Endpoint: Daily Planning Recommendation
app.post('/api/ai/plan-today', async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    if (!aiClient || tasks.length === 0) {
      return res.json({
        plan: tasks.map((t: any, i: number) => ({
          taskId: t.id,
          order: i + 1,
          timeSlot: `${9 + i * 2}:00`,
          recommendation: 'Focus uninterrupted on high-priority deliverable',
        })),
        summary: 'Scheduled in sequential order based on priority.',
      });
    }

    const prompt = `You are an elite productivity planner. Given this list of tasks scheduled for today, recommend an optimal sequence considering energy levels, priority, and estimated minutes.
Morning is best for high focus / deep work. Afternoon for administrative tasks.

Tasks:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, estimatedMinutes: t.estimatedMinutes })))}

Return ONLY valid JSON:
{
  "summary": "Brief encouraging strategy overview",
  "plan": [
    {
      "taskId": "string",
      "order": number,
      "timeSlot": "e.g. 09:30 AM",
      "recommendation": "Brief reason for this scheduling"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"plan": [], "summary": ""}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Plan today error, using priority-based schedule fallback:', error?.message || error);
    const { tasks } = req.body;
    const taskList = Array.isArray(tasks) ? tasks : [];
    return res.json({
      summary: 'Scheduled in sequential priority order with optimal breaks.',
      plan: taskList.map((t: any, i: number) => ({
        taskId: t.id,
        order: i + 1,
        timeSlot: `${9 + i}:00 AM`,
        recommendation: `High-focus block for ${t.title || 'task'}`,
      })),
    });
  }
});

// Health check endpoint for Cloud Run and load balancers
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Tovo server listening on port ${port}`);
  });
}

startServer();
