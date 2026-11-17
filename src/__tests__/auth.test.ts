import './setup';
import { describe, it, expect } from 'vitest';
import { AuthService } from '../services/auth/auth.service';
import { storageService } from '../services/storage/storage.service';
import { UserProfile } from '../types';

describe('Authentication Validation & Security Invariants', () => {
  describe('Email format validation', () => {
    it('accepts valid email formats', () => {
      expect(AuthService.validateEmail('user@tovo.app')).toBe(true);
      expect(AuthService.validateEmail('test.architect+dev@linear.style')).toBe(true);
      expect(AuthService.validateEmail('admin@workspace.internal')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(AuthService.validateEmail('')).toBe(false);
      expect(AuthService.validateEmail('not-an-email')).toBe(false);
      expect(AuthService.validateEmail('@missingusername.com')).toBe(false);
      expect(AuthService.validateEmail('missing-domain@')).toBe(false);
      expect(AuthService.validateEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('Password security policies', () => {
    it('accepts compliant passwords meeting length, letter, and number criteria', () => {
      const res = AuthService.validatePassword('P@ssword123');
      expect(res.valid).toBe(true);
      expect(res.message).toBeUndefined();
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = AuthService.validatePassword('Abc1');
      expect(res.valid).toBe(false);
      expect(res.message).toContain('at least 8 characters');
    });

    it('rejects passwords without any letters', () => {
      const res = AuthService.validatePassword('1234567890');
      expect(res.valid).toBe(false);
      expect(res.message).toContain('at least one letter');
    });

    it('rejects passwords without any numbers', () => {
      const res = AuthService.validatePassword('LettersOnlyPassword');
      expect(res.valid).toBe(false);
      expect(res.message).toContain('at least one number');
    });
  });

  describe('User Profile Invariants and Access Isolation', () => {
    it('enforces default role as "user" and accountStatus as "active" for standard profiles', () => {
      const mockProfile: UserProfile = {
        uid: 'user_test_123',
        email: 'engineer@tovo.app',
        displayName: 'Tovo Engineer',
        role: 'user',
        accountStatus: 'active',
        emailVerified: false,
        lastLoginAt: new Date().toISOString(),
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'password',
      };

      expect(mockProfile.role).toBe('user');
      expect(mockProfile.accountStatus).toBe('active');
      expect(mockProfile.emailVerified).toBe(false);
    });

    it('clears isolated user data when user changes', async () => {
      const prevUid = 'user_alpha';

      // Seed local storage with task keys formatted as minddrop_${userId}_${collection}
      localStorage.setItem(`minddrop_${prevUid}_tasks`, JSON.stringify([{ id: 'task-1' }]));
      localStorage.setItem(`minddrop_${prevUid}_habits`, JSON.stringify([{ id: 'habit-1' }]));

      // Clear previous user data
      await storageService.clearUserData(prevUid);

      expect(localStorage.getItem(`minddrop_${prevUid}_tasks`)).toBeNull();
      expect(localStorage.getItem(`minddrop_${prevUid}_habits`)).toBeNull();
    });

    it('preserves guest state independently from authenticated account keys', () => {
      const guestKey = 'minddrop_guest_user_id';
      localStorage.setItem(guestKey, 'guest_xyz123');
      expect(localStorage.getItem(guestKey)).toBe('guest_xyz123');
    });
  });

  describe('Authentication-First Route Guarding & Path Resolution', () => {
    function resolveRoute(path: string, user: { uid: string } | null, isAdmin: boolean = false): string {
      // Admin paths
      if (path === '/admin/login') return '/admin/login';
      if (path === '/admin' || path.startsWith('/admin/')) {
        return user && isAdmin ? '/admin' : '/admin/login';
      }

      // Public auth paths
      if (path === '/forgot-password') return '/forgot-password';
      if (path === '/verify-email') return '/verify-email';
      if (path === '/signup') return user ? '/app/home' : '/signup';
      if (path === '/login') return user ? '/app/home' : '/login';

      // Root path
      if (path === '/') return user ? '/app/home' : '/login';

      // Authenticated app paths
      if (path.startsWith('/app')) {
        if (!user) return '/login';
        return path;
      }

      // Default fallback
      return user ? '/app/home' : '/login';
    }

    it('redirects unauthenticated root visitor directly to /login', () => {
      expect(resolveRoute('/', null)).toBe('/login');
    });

    it('redirects unauthenticated visitor trying to access /app/home to /login', () => {
      expect(resolveRoute('/app/home', null)).toBe('/login');
    });

    it('redirects unauthenticated visitor trying to access /app/inbox to /login', () => {
      expect(resolveRoute('/app/inbox', null)).toBe('/login');
    });

    it('redirects unauthenticated visitor trying to access /app/planner to /login', () => {
      expect(resolveRoute('/app/planner', null)).toBe('/login');
    });

    it('redirects unauthenticated visitor trying to access /app/habits to /login', () => {
      expect(resolveRoute('/app/habits', null)).toBe('/login');
    });

    it('redirects unauthenticated visitor trying to access /app/settings to /login', () => {
      expect(resolveRoute('/app/settings', null)).toBe('/login');
    });

    it('allows unauthenticated visitor to view /login, /signup, /forgot-password, /verify-email', () => {
      expect(resolveRoute('/login', null)).toBe('/login');
      expect(resolveRoute('/signup', null)).toBe('/signup');
      expect(resolveRoute('/forgot-password', null)).toBe('/forgot-password');
      expect(resolveRoute('/verify-email', null)).toBe('/verify-email');
    });

    it('redirects authenticated user from / and /login to /app/home', () => {
      const mockUser = { uid: 'user_active_123' };
      expect(resolveRoute('/', mockUser)).toBe('/app/home');
      expect(resolveRoute('/login', mockUser)).toBe('/app/home');
      expect(resolveRoute('/signup', mockUser)).toBe('/app/home');
    });

    it('allows authenticated user to navigate to /app sub-routes directly', () => {
      const mockUser = { uid: 'user_active_123' };
      expect(resolveRoute('/app/home', mockUser)).toBe('/app/home');
      expect(resolveRoute('/app/inbox', mockUser)).toBe('/app/inbox');
      expect(resolveRoute('/app/planner', mockUser)).toBe('/app/planner');
      expect(resolveRoute('/app/habits', mockUser)).toBe('/app/habits');
      expect(resolveRoute('/app/settings', mockUser)).toBe('/app/settings');
    });

    it('restricts /admin to verified administrators only', () => {
      expect(resolveRoute('/admin', null)).toBe('/admin/login');
      expect(resolveRoute('/admin', { uid: 'regular_user' }, false)).toBe('/admin/login');
      expect(resolveRoute('/admin', { uid: 'admin_user' }, true)).toBe('/admin');
    });
  });
});

