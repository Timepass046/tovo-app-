import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { storageService } from '../services/storage/storage.service';
import { syncService } from '../services/sync/sync.service';
import { notificationService } from '../services/notifications/notification.service';
import { analyticsService } from '../services/analytics/analytics.service';
import { sound } from '../lib/audio';
import { useAuth } from './AuthContext';
import {
  Task,
  Subtask,
  Habit,
  HabitLog,
  UserPreferences,
  TaskBucket,
  TaskStatus,
  TaskPriority,
} from '../types';
import { SyncState } from '../services/sync/sync.interface';
import { advanceRecurringTask } from '../services/planner/recurrence';

interface TaskContextType {
  // Tasks
  tasks: Task[];
  loading: boolean;
  quickCapture: (title: string, bucket?: TaskBucket, priority?: TaskPriority) => Promise<Task>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  moveTaskBucket: (taskId: string, bucket: TaskBucket) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;

  // Habits
  habits: Habit[];
  habitLogs: HabitLog[];
  createHabit: (data: Partial<Habit>) => Promise<Habit>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitToday: (habitId: string) => Promise<void>;
  isHabitCompletedToday: (habitId: string) => boolean;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;

  // Focus Session
  focusActive: boolean;
  focusPaused: boolean;
  focusSecondsLeft: number;
  focusTotalSeconds: number;
  focusLinkedTaskId: string | null;
  startFocusSession: (taskId?: string, minutes?: number) => void;
  pauseFocusSession: () => void;
  resumeFocusSession: () => void;
  resetFocusSession: () => void;

  // Sync & Offline
  isOnline: boolean;
  syncState: SyncState;
  syncPendingCount: number;
  forceSync: () => Promise<void>;

  // Preferences
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;

  // Selected Task triggered by notification tap
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  userId: '',
  theme: 'system',
  notificationsEnabled: true,
  soundEnabled: true,
  focusSessionDuration: 25,
  breakDuration: 5,
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeUserId } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Sync state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncState, setSyncState] = useState<SyncState>('synchronized');
  const [syncPendingCount, setSyncPendingCount] = useState<number>(0);

  // Selected task via notification tap
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Focus Session State
  const [focusActive, setFocusActive] = useState<boolean>(false);
  const [focusPaused, setFocusPaused] = useState<boolean>(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState<number>(25 * 60);
  const [focusTotalSeconds, setFocusTotalSeconds] = useState<number>(25 * 60);
  const [focusLinkedTaskId, setFocusLinkedTaskId] = useState<string | null>(null);

  // Subscribe to sync service
  useEffect(() => {
    syncService.setUserId(activeUserId);
    const unsub = syncService.subscribeState((state, count) => {
      setSyncState(state);
      setSyncPendingCount(count);
      setIsOnline(state !== 'offline');
    });

    // Listen to native notification taps
    const unsubNotif = notificationService.onNotificationTap((taskId) => {
      setSelectedTaskId(taskId);
    });

    return () => {
      unsub();
      unsubNotif();
    };
  }, [activeUserId]);

  // Theme application & native Android system bar icon contrast sync
  useEffect(() => {
    const theme = preferences.theme;
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.style.colorScheme = isDark ? 'dark' : 'light';

      if (Capacitor.isNativePlatform()) {
        SystemBars.setStyle({
          style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
        }).catch(() => {});
      }
    };

    applyTheme();
    sound.setEnabled(preferences.soundEnabled);

    if (theme === 'system' && typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [preferences.theme, preferences.soundEnabled]);

  // Load from local storage service on startup
  useEffect(() => {
    if (!activeUserId) {
      setTasks([]);
      setHabits([]);
      setHabitLogs([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadLocal = async () => {
      const cachedTasks = await storageService.getTasks(activeUserId);
      const cachedHabits = await storageService.getHabits(activeUserId);
      const cachedLogs = await storageService.getHabitLogs(activeUserId);
      const cachedPrefs = await storageService.getPreferences(activeUserId);

      if (!mounted) return;

      setTasks(cachedTasks);
      setHabits(cachedHabits);
      setHabitLogs(cachedLogs);
      if (cachedPrefs) {
        setPreferences(cachedPrefs);
      } else {
        const initPrefs = { ...DEFAULT_PREFERENCES, userId: activeUserId };
        await storageService.savePreferences(initPrefs);
        setPreferences(initPrefs);
      }

      setLoading(false);

      // Reconcile reminders on boot
      await notificationService.reconcileScheduledReminders(cachedTasks);
    };

    loadLocal();

    return () => {
      mounted = false;
    };
  }, [activeUserId]);

  // Firestore Real-Time Listeners (only when authenticated)
  useEffect(() => {
    if (!user || !user.uid) return;

    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubTasks = onSnapshot(
      tasksQuery,
      async (snapshot) => {
        const remoteTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Task;
          if (!data._deleted) {
            remoteTasks.push({ ...data, id: docSnap.id });
          }
        });
        if (remoteTasks.length > 0) {
          setTasks(remoteTasks);
          for (const t of remoteTasks) {
            await storageService.saveTask(t);
          }
          await notificationService.reconcileScheduledReminders(remoteTasks);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'tasks');
      }
    );

    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubHabits = onSnapshot(
      habitsQuery,
      async (snapshot) => {
        const remoteHabits: Habit[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Habit;
          if (!data._deleted) {
            remoteHabits.push({ ...data, id: docSnap.id });
          }
        });
        if (remoteHabits.length > 0) {
          setHabits(remoteHabits);
          for (const h of remoteHabits) {
            await storageService.saveHabit(h);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'habits');
      }
    );

    const logsQuery = query(collection(db, 'habitLogs'), where('userId', '==', user.uid));
    const unsubLogs = onSnapshot(
      logsQuery,
      async (snapshot) => {
        const remoteLogs: HabitLog[] = [];
        snapshot.forEach((docSnap) => {
          remoteLogs.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setHabitLogs(remoteLogs);
        for (const l of remoteLogs) {
          await storageService.saveHabitLog(l);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'habitLogs');
      }
    );

    return () => {
      unsubTasks();
      unsubHabits();
      unsubLogs();
    };
  }, [user]);

  // Focus Session Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (focusActive && !focusPaused && focusSecondsLeft > 0) {
      interval = setInterval(() => {
        setFocusSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            sound.playCelebration();
            notificationService.scheduleReminder({
              id: 9999,
              taskOrHabitId: 'focus_complete',
              title: 'Tovo Focus Complete!',
              body: 'Well done! You completed your focus session.',
              triggerAt: new Date(Date.now() + 100),
            });
            setFocusActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusActive, focusPaused, focusSecondsLeft]);

  const startFocusSession = (taskId?: string, minutes: number = 25) => {
    const secs = minutes * 60;
    setFocusTotalSeconds(secs);
    setFocusSecondsLeft(secs);
    setFocusLinkedTaskId(taskId || null);
    setFocusActive(true);
    setFocusPaused(false);
    sound.playDrop();
  };

  const pauseFocusSession = () => setFocusPaused(true);
  const resumeFocusSession = () => setFocusPaused(false);
  const resetFocusSession = () => {
    setFocusActive(false);
    setFocusPaused(false);
    setFocusSecondsLeft(focusTotalSeconds);
    setFocusLinkedTaskId(null);
  };

  // Persist task with local-first storage and durable sync
  const persistTask = async (task: Task, action: 'create' | 'update' | 'delete') => {
    // 1. Persist locally first before confirming
    if (action === 'delete') {
      await storageService.deleteTask(task.id, task.userId);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      await notificationService.cancelReminder(task.id);
    } else {
      await storageService.saveTask(task);
      setTasks(prev => {
        const idx = prev.findIndex(t => t.id === task.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = task;
          return updated;
        }
        return [task, ...prev];
      });

      // Notification reconciliation
      if (task.status === 'completed' || task.archived || !task.reminderAt) {
        await notificationService.cancelReminder(task.id);
      } else if (task.reminderAt) {
        await notificationService.scheduleReminder({
          id: 0,
          taskOrHabitId: task.id,
          title: `Task Reminder: ${task.title}`,
          body: task.description || 'Time to complete your scheduled task.',
          triggerAt: new Date(task.reminderAt),
        });
      }
    }

    // 2. Enqueue durable cloud sync operation if authenticated
    if (user) {
      await syncService.enqueueOperation({
        collection: 'tasks',
        docId: task.id,
        action,
        data: action === 'delete' ? { _deleted: true, updatedAt: new Date().toISOString() } : task,
      });
    }
  };

  // Quick Capture
  const quickCapture = async (
    title: string,
    bucket: TaskBucket = 'inbox',
    priority: TaskPriority = 'medium'
  ): Promise<Task> => {
    const now = new Date().toISOString();
    const id = 'task_' + Math.random().toString(36).substring(2, 10);
    const newTask: Task = {
      id,
      userId: activeUserId,
      title: title.trim(),
      priority,
      status: 'not_started',
      bucket,
      archived: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    sound.playDrop();
    await persistTask(newTask, 'create');
    analyticsService.trackTaskCreated(id, priority, bucket);
    return newTask;
  };

  // Detailed Task Creation
  const createTask = async (data: Partial<Task>): Promise<Task> => {
    const now = new Date().toISOString();
    const id = data.id || 'task_' + Math.random().toString(36).substring(2, 10);
    const newTask: Task = {
      id,
      userId: activeUserId,
      title: data.title?.trim() || 'Untitled Task',
      description: data.description || '',
      priority: data.priority || 'medium',
      status: data.status || 'not_started',
      bucket: data.bucket || 'inbox',
      category: data.category || '',
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      estimatedMinutes: data.estimatedMinutes,
      startDate: data.startDate,
      dueDate: data.dueDate,
      reminderAt: data.reminderAt,
      recurrence: data.recurrence || 'none',
      archived: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    sound.playDrop();
    await persistTask(newTask, 'create');
    analyticsService.trackTaskCreated(id, newTask.priority, newTask.bucket);
    if (newTask.reminderAt) {
      analyticsService.trackReminderCreated(id);
    }
    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const updated: Task = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (target.version || 1) + 1,
    };
    if (updates.status === 'completed' && target.status !== 'completed') {
      updated.completedAt = new Date().toISOString();
      sound.playComplete();
      analyticsService.trackTaskCompleted(taskId);

      // If task has recurrence, schedule next cycle automatically
      if (target.recurrence && target.recurrence !== 'none') {
        const nextCycle = advanceRecurringTask(updated);
        if (nextCycle) {
          await persistTask(nextCycle, 'create');
        }
      }
    }
    if (updates.reminderAt && updates.reminderAt !== target.reminderAt) {
      analyticsService.trackReminderCreated(taskId);
    }
    await persistTask(updated, 'update');
  };

  const deleteTask = async (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    await persistTask(target, 'delete');
  };

  const toggleTaskStatus = async (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const newStatus: TaskStatus = target.status === 'completed' ? 'not_started' : 'completed';
    await updateTask(taskId, { status: newStatus });
  };

  const moveTaskBucket = async (taskId: string, bucket: TaskBucket) => {
    await updateTask(taskId, { bucket });
  };

  const addSubtask = async (taskId: string, title: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const subtask: Subtask = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const newSubtasks = [...(target.subtasks || []), subtask];
    await updateTask(taskId, { subtasks: newSubtasks });
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || !target.subtasks) return;
    const newSubtasks = target.subtasks.map(s => {
      if (s.id === subtaskId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });

    // Subtask invariant: Completing one subtask does NOT automatically complete parent task
    // unless all required subtasks are complete or explicitly confirmed.
    sound.playComplete();
    await updateTask(taskId, { subtasks: newSubtasks });
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || !target.subtasks) return;
    const newSubtasks = target.subtasks.filter(s => s.id !== subtaskId);
    await updateTask(taskId, { subtasks: newSubtasks });
  };

  const archiveTask = async (taskId: string) => {
    await updateTask(taskId, { archived: true });
  };

  const restoreTask = async (taskId: string) => {
    await updateTask(taskId, { archived: false });
  };

  // Habits operations
  const persistHabit = async (habit: Habit, action: 'create' | 'update' | 'delete') => {
    if (action === 'delete') {
      await storageService.deleteHabit(habit.id, habit.userId);
      setHabits(prev => prev.filter(h => h.id !== habit.id));
    } else {
      await storageService.saveHabit(habit);
      setHabits(prev => {
        const idx = prev.findIndex(h => h.id === habit.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = habit;
          return updated;
        }
        return [habit, ...prev];
      });
    }

    if (user) {
      await syncService.enqueueOperation({
        collection: 'habits',
        docId: habit.id,
        action,
        data: action === 'delete' ? { _deleted: true, updatedAt: new Date().toISOString() } : habit,
      });
    }
  };

  const createHabit = async (data: Partial<Habit>): Promise<Habit> => {
    const now = new Date().toISOString();
    const id = 'habit_' + Math.random().toString(36).substring(2, 10);
    const newHabit: Habit = {
      id,
      userId: activeUserId,
      title: data.title?.trim() || 'New Habit',
      description: data.description || '',
      icon: data.icon || 'Sparkles',
      color: data.color || 'blue',
      frequency: data.frequency || 'daily',
      targetDays: data.targetDays || [0, 1, 2, 3, 4, 5, 6],
      streak: 0,
      bestStreak: 0,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    sound.playDrop();
    await persistHabit(newHabit, 'create');
    return newHabit;
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    const target = habits.find(h => h.id === habitId);
    if (!target) return;
    const updated: Habit = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await persistHabit(updated, 'update');
  };

  const deleteHabit = async (habitId: string) => {
    const target = habits.find(h => h.id === habitId);
    if (!target) return;
    await persistHabit(target, 'delete');
  };

  const isHabitCompletedToday = (habitId: string): boolean => {
    const today = getTodayKey();
    return habitLogs.some(l => l.habitId === habitId && l.date === today && l.completed);
  };

  const toggleHabitToday = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = getTodayKey();
    const existingLog = habitLogs.find(l => l.habitId === habitId && l.date === today);
    const isNowCompleted = existingLog ? !existingLog.completed : true;

    const logId = existingLog ? existingLog.id : `log_${habitId}_${today}`;
    const newLog: HabitLog = {
      id: logId,
      userId: activeUserId,
      habitId,
      date: today,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    };

    let newStreak = habit.streak;
    let newBest = habit.bestStreak;
    if (isNowCompleted) {
      newStreak += 1;
      if (newStreak > newBest) newBest = newStreak;
      sound.playCelebration();
      analyticsService.trackHabitCompleted(habitId);
    } else {
      newStreak = Math.max(0, newStreak - 1);
    }

    await storageService.saveHabitLog(newLog);
    setHabitLogs(prev => {
      const idx = prev.findIndex(l => l.id === logId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newLog;
        return copy;
      }
      return [...prev, newLog];
    });

    await updateHabit(habitId, { streak: newStreak, bestStreak: newBest });

    if (user) {
      await syncService.enqueueOperation({
        collection: 'habitLogs',
        docId: logId,
        action: 'create',
        data: newLog,
      });
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const updated: UserPreferences = {
      ...preferences,
      ...updates,
      userId: activeUserId,
      updatedAt: new Date().toISOString(),
    };
    setPreferences(updated);
    await storageService.savePreferences(updated);

    if (user) {
      await syncService.enqueueOperation({
        collection: 'userPreferences',
        docId: activeUserId,
        action: 'update',
        data: updated,
      });
    }
  };

  const forceSync = async () => {
    await syncService.flushQueue();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        quickCapture,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        moveTaskBucket,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        archiveTask,
        restoreTask,
        habits,
        habitLogs,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleHabitToday,
        isHabitCompletedToday,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        focusActive,
        focusPaused,
        focusSecondsLeft,
        focusTotalSeconds,
        focusLinkedTaskId,
        startFocusSession,
        pauseFocusSession,
        resumeFocusSession,
        resetFocusSession,
        isOnline,
        syncState,
        syncPendingCount,
        forceSync,
        preferences,
        updatePreferences,
        selectedTaskId,
        setSelectedTaskId,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within a TaskProvider');
  return ctx;
};
