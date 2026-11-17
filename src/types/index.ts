export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';
export type TaskBucket = 'inbox' | 'today' | 'upcoming' | 'someday';
export type TaskRecurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  bucket: TaskBucket;
  category?: string;
  tags?: string[];
  subtasks?: Subtask[];
  estimatedMinutes?: number;
  startDate?: string;
  dueDate?: string;
  reminderAt?: string;
  recurrence?: TaskRecurrence;
  archived: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  _deleted?: boolean; // Tombstone for conflict-safe sync
}

export type HabitFrequency = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: HabitFrequency;
  targetDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  streak: number;
  bestStreak: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  _deleted?: boolean;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  focusSessionDuration: number; // minutes, default 25
  breakDuration: number; // minutes, default 5
  updatedAt?: string;
}

export interface SyncOperation {
  id: string;
  collection: 'tasks' | 'habits' | 'habitLogs' | 'userPreferences';
  docId: string;
  action: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export type SyncItem = SyncOperation;

export interface ScheduledReminder {
  id: number; // Numeric ID for Capacitor LocalNotifications
  taskOrHabitId: string;
  title: string;
  body: string;
  triggerAt: string; // ISO string
  recurrence?: TaskRecurrence;
}

export type UserRole = 'user' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type AuthProviderType = 'password' | 'google.com' | 'guest';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  authProvider: AuthProviderType;
  emailVerified: boolean;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  preferences?: Partial<UserPreferences>;
  onboardingCompleted: boolean;
}

export interface AdminLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: 'suspend_user' | 'reactivate_user' | 'delete_user' | 'promote_admin' | 'revoke_admin' | 'bootstrap_admin' | 'admin_login' | 'settings_change';
  targetUid: string;
  targetEmail: string;
  reason?: string;
  timestamp: string;
  result?: 'success' | 'failure';
  metadata?: Record<string, any>;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers?: number;
  recentRegistrations?: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  verifiedUsers: number;
  suspendedUsers: number;
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalActiveHabits: number;
  totalRemindersScheduled: number;
}

export type ActivityEventType =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'PROFILE_UPDATED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_UPDATED'
  | 'TASK_ARCHIVED'
  | 'HABIT_CREATED'
  | 'HABIT_COMPLETED'
  | 'REMINDER_CREATED'
  | 'REMINDER_UPDATED'
  | 'REMINDER_CANCELLED'
  | 'SYNC_SUCCESS'
  | 'SYNC_FAILURE'
  | 'ACCOUNT_DELETED';

export interface ActivityEvent {
  id: string;
  userId: string;
  eventType: ActivityEventType;
  timestamp: string;
  appVersion: string;
  platform: string;
  metadata?: Record<string, any>;
}

export type HealthErrorType =
  | 'auth_failure'
  | 'sync_failure'
  | 'db_error'
  | 'notification_failure'
  | 'app_error';

export interface HealthError {
  id: string;
  errorType: HealthErrorType;
  message: string;
  timestamp: string;
  userId?: string;
  platform?: string;
  resolved?: boolean;
}

export interface DailyAnalyticsRecord {
  date: string; // YYYY-MM-DD
  tasksCreated: number;
  tasksCompleted: number;
  activeUsers: number;
  habitsCompleted: number;
  remindersScheduled: number;
}

export interface UserDetailMetrics {
  user: UserProfile;
  tasksCreatedCount: number;
  tasksCompletedCount: number;
  activeHabitsCount: number;
  remindersScheduledCount: number;
  recentActivity: ActivityEvent[];
}
