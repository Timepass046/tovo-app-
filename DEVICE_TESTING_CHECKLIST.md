# MindDrop — Physical Device Testing Checklist

This checklist defines rigorous test scenarios to validate offline resilience, native notifications, multi-user isolation, and synchronization on physical iOS and Android devices.

---

### 1. Installation & Cold Boot
- [ ] **Fresh Installation**: Install on device without pre-existing data. App initializes default state without crashing.
- [ ] **Cold Boot Reconciliation**: Set a reminder 15 minutes ahead. Force quit the app (`kill`). Relaunch after 1 minute; verify the pending notification is reconciled and still scheduled in the OS.
- [ ] **Device Reboot Reconciliation**: Reboot device. Verify alarms and scheduled reminders are restored by the OS boot receiver.

---

### 2. Offline Task Capture & Recovery
- [ ] **Airplane Mode Capture**: Enable Airplane Mode. Quick-drop a thought into the Inbox.
  - [ ] App immediately persists task locally (verified by closing and reopening the app in Airplane mode).
  - [ ] Top bar displays "Offline" badge.
  - [ ] Pending sync queue records 1 operation.
- [ ] **Recovery & Flush**: Turn off Airplane Mode.
  - [ ] Sync engine automatically detects network reconnection.
  - [ ] Pending operations are flushed to Firestore without user intervention.
  - [ ] No duplicate task is created.

---

### 3. Notification Permissions & Background Alerts
- [ ] **Permission Prompt**: On first launch, permission dialog is displayed cleanly.
- [ ] **Denied Permission**: If user denies notification permissions:
  - [ ] App displays honest status explanation in Planner and Settings.
  - [ ] App does NOT crash or continuously spam prompts.
  - [ ] Provides guidance on how to enable in OS Settings.
- [ ] **Background Reminder Trigger**: Schedule a task reminder for 2 minutes from now. Put the app in background or lock screen.
  - [ ] Native notification pops up at exact time with vibration/sound.
  - [ ] Tapping notification opens MindDrop directly to the specific task details sheet.

---

### 4. Subtask & Status Invariants
- [ ] **Partial Completion**: Create a task with 4 subtasks. Check off 2 subtasks.
  - [ ] Card displays "2 of 4 steps completed".
  - [ ] Progress bar shows 50%.
  - [ ] Parent task remains `in_progress` (never auto-marked complete).
- [ ] **Full Subtask Completion**: Check off all 4 subtasks.
  - [ ] Card displays "4 of 4 steps completed".
  - [ ] Parent task can now be marked complete without conflict.

---

### 5. Multi-Device & Account Hygiene
- [ ] **Sign-Out Cache Purge**: Sign out of user account.
  - [ ] Cached private documents are purged from local storage adapter.
  - [ ] Another user signing in on the same device sees only their own data.
- [ ] **Concurrent Edit Conflict Resolution**: Edit task title on Device A and mark completed on Device B.
  - [ ] Sync engine applies updates with timestamp-based conflict resolution without throwing fatal schema errors.
- [ ] **Tombstone Sync**: Delete task on Device A while Device B is offline. When Device B comes online, the task is removed and not resurrected.

---

### 6. Habits & Non-Shaming Streak
- [ ] **Habit Check-In**: Tap habit circle; celebration chime plays and streak increments.
- [ ] **Day Rollover**: Advance device calendar date by 1 day. Missed day does not insult user; supportive "Every day is a fresh drop" banner is displayed.
