import { describe, it, expect } from 'vitest';
import { aiService } from '../services/ai/ai.service';

describe('AI Service Schema Protection & Fallback', () => {
  it('falls back safely to structured heuristics if network is disconnected', async () => {
    const rawBrainDump = 'Pick up packages at post office; schedule quarterly dentist checkup; email Sarah re: design sprint';
    const result = await aiService.brainDump(rawBrainDump);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('priority');
    expect(result[0]).toHaveProperty('bucket');
    expect(['low', 'medium', 'high']).toContain(result[0].priority);
  });

  it('generates atomic actionable subtasks for task breakdown', async () => {
    const steps = await aiService.breakdownTask('Redesign user onboarding flow');

    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    steps.forEach(step => {
      expect(typeof step).toBe('string');
      expect(step.length).toBeGreaterThan(0);
    });
  });
});
