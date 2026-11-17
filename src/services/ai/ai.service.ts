import { IAiService, ProposedTask, ProposedPlanItem } from './ai.interface';
import { Task, TaskPriority, TaskBucket } from '../../types';
import { apiUrl } from '../../lib/api';

class GeminiAiService implements IAiService {
  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(apiUrl('/api/ai/braindump'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ping' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Sanitize and validate untrusted AI priority string
  private sanitizePriority(p: any): TaskPriority {
    if (p === 'high' || p === 'medium' || p === 'low') return p;
    return 'medium';
  }

  // Sanitize and validate untrusted AI bucket string
  private sanitizeBucket(b: any): TaskBucket {
    if (b === 'inbox' || b === 'today' || b === 'upcoming' || b === 'someday') return b;
    return 'inbox';
  }

  public async brainDump(text: string): Promise<ProposedTask[]> {
    if (!text.trim()) return [];

    try {
      const res = await fetch(apiUrl('/api/ai/braindump'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (data.tasks && Array.isArray(data.tasks)) {
        return data.tasks.map((t: any) => ({
          title: String(t.title || 'Untitled task').slice(0, 150),
          description: t.description ? String(t.description).slice(0, 500) : '',
          priority: this.sanitizePriority(t.priority),
          bucket: this.sanitizeBucket(t.bucket),
          category: t.category ? String(t.category).slice(0, 50) : 'General',
          estimatedMinutes: typeof t.estimatedMinutes === 'number' ? Math.max(5, Math.min(240, t.estimatedMinutes)) : 25,
          subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s: any) => String(s).slice(0, 80)) : [],
        }));
      }
    } catch (e) {
      console.warn('AI Brain dump network request failed, using local extraction fallback:', e);
    }

    // Heuristic fallback if network fails
    const sentences = text.split(/[\n.;]+/).map(s => s.trim()).filter(s => s.length > 2);
    return sentences.slice(0, 8).map(s => ({
      title: s.slice(0, 80),
      priority: 'medium',
      bucket: 'inbox',
      category: 'General',
      estimatedMinutes: 25,
      subtasks: [],
    }));
  }

  public async breakdownTask(title: string, description?: string): Promise<string[]> {
    if (!title.trim()) return [];

    try {
      const res = await fetch(apiUrl('/api/ai/breakdown'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        return data.subtasks.map((s: any) => String(s).slice(0, 80));
      }
    } catch (e) {
      console.warn('AI Breakdown network request failed:', e);
    }

    // Fallback steps
    return [
      `Review requirements and clear scope for ${title}`,
      `Execute primary draft and working iteration`,
      `Verify outcomes and review deliverable`,
      `Finalize and mark complete`,
    ];
  }

  public async optimizeDailyPlan(tasks: Task[]): Promise<{ plan: ProposedPlanItem[]; summary: string }> {
    const todayTasks = tasks.filter(t => !t.archived && t.status !== 'completed');
    if (todayTasks.length === 0) {
      return { plan: [], summary: 'No pending tasks for today.' };
    }

    try {
      const res = await fetch(apiUrl('/api/ai/plan-today'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: todayTasks }),
      });
      const data = await res.json();
      if (data.plan && Array.isArray(data.plan)) {
        return {
          summary: data.summary || 'Prioritized order based on deadlines and energy.',
          plan: data.plan.map((p: any) => ({
            taskId: String(p.taskId),
            order: Number(p.order) || 1,
            timeSlot: String(p.timeSlot || '09:00 AM'),
            recommendation: String(p.recommendation || 'Focus block'),
          })),
        };
      }
    } catch (e) {
      console.warn('AI Plan today failed:', e);
    }

    // Fallback ordering: High priority first, then medium, then low
    const priorityWeight: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
    const sorted = [...todayTasks].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    return {
      summary: 'Sorted in descending priority order to tackle high-impact items first.',
      plan: sorted.map((t, idx) => ({
        taskId: t.id,
        order: idx + 1,
        timeSlot: `${9 + idx}:00 AM`,
        recommendation: `Dedicated ${t.estimatedMinutes || 25}m session for ${t.title}`,
      })),
    };
  }

  public async voiceToTask(dictation: string): Promise<ProposedTask> {
    const trimmed = dictation.trim();
    const tasks = await this.brainDump(trimmed);
    if (tasks.length > 0) {
      return tasks[0];
    }
    return {
      title: trimmed.slice(0, 80),
      priority: 'medium',
      bucket: 'inbox',
      category: 'Voice Note',
      estimatedMinutes: 15,
      subtasks: [],
    };
  }
}

export const aiService = new GeminiAiService();
