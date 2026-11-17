import { Task, TaskBucket, TaskPriority } from '../../types';

export interface ProposedTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  bucket: TaskBucket;
  category?: string;
  estimatedMinutes?: number;
  subtasks?: string[];
  suggestedReminderISO?: string;
}

export interface ProposedPlanItem {
  taskId: string;
  order: number;
  timeSlot: string;
  recommendation: string;
}

export interface IAiService {
  isAvailable(): Promise<boolean>;
  brainDump(text: string): Promise<ProposedTask[]>;
  breakdownTask(title: string, description?: string): Promise<string[]>;
  optimizeDailyPlan(tasks: Task[]): Promise<{ plan: ProposedPlanItem[]; summary: string }>;
  voiceToTask(dictation: string): Promise<ProposedTask>;
}
