import './setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  nativeSignInWithGoogle: vi.fn(),
  nativeSignOut: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithCredential: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  linkWithCredential: vi.fn(),
  linkWithPopup: vi.fn(),
  reload: vi.fn(),
  setPersistence: vi.fn(),
  signOut: vi.fn(),
  credential: vi.fn((idToken: string) => ({ providerId: 'google.com', idToken })),
  credentialFromError: vi.fn(),
  setCustomParameters: vi.fn(),
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  mockAuthInstance: { name: '[DEFAULT]', currentUser: null as any },
  mockDbInstance: { app: '[DEFAULT]' },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mocks.isNativePlatform,
  },
}));

vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: {
    signInWithGoogle: mocks.nativeSignInWithGoogle,
    signOut: mocks.nativeSignOut,
  },
}));

vi.mock('firebase/auth', () => {
  class MockGoogleAuthProvider {
    static credential = mocks.credential;
    static credentialFromError = mocks.credentialFromError;
    setCustomParameters = mocks.setCustomParameters;
  }

  return {
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
    signInWithPopup: mocks.signInWithPopup,
    signInWithCredential: mocks.signInWithCredential,
    linkWithCredential: mocks.linkWithCredential,
    linkWithPopup: mocks.linkWithPopup,
    GoogleAuthProvider: MockGoogleAuthProvider,
    signOut: mocks.signOut,
    sendEmailVerification: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    updateProfile: vi.fn(),
    setPersistence: mocks.setPersistence,
    browserLocalPersistence: {},
    browserSessionPersistence: {},
    reload: mocks.reload,
    getIdToken: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  updateDoc: mocks.updateDoc,
}));

vi.mock('../lib/firebase', () => ({
  auth: mocks.mockAuthInstance,
  db: mocks.mockDbInstance,
  handleFirestoreError: vi.fn((err: unknown) => {
    throw err;
  }),
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write',
  },
}));

import { AuthService, GoogleAccountConflictError } from '../services/auth/auth.service';

function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

describe('Google Sign-In & Account Linking (Web vs Capacitor Android Native Bridge)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockAuthInstance.currentUser = null;
    mocks.isNativePlatform.mockReturnValue(false);
    mocks.nativeSignOut.mockResolvedValue(undefined);
    mocks.signOut.mockResolvedValue(undefined);
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.updateDoc.mockResolvedValue(undefined);
    mocks.reload.mockResolvedValue(undefined);
    mocks.setPersistence.mockResolvedValue(undefined);
    mocks.credentialFromError.mockReturnValue(null);
  });

  it('uses native Google Sign-In with skipNativeAuth: true on Capacitor and authenticates single Firebase JS auth instance', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockResolvedValue({
      user: null,
      credential: {
        providerId: 'google.com',
        idToken: 'mock-google-id-token-123',
      },
    });
    const fakeFirebaseUser = {
      uid: 'uid_native_1',
      displayName: 'Alex Android',
      email: 'alex@tovo.app',
      photoURL: 'https://example.com/photo.png',
      providerData: [{ providerId: 'google.com' }],
    };
    mocks.signInWithCredential.mockResolvedValue({ user: fakeFirebaseUser });
    mocks.getDoc.mockResolvedValue({ exists: () => false });

    const res = await AuthService.signInWithGoogle();

    expect(mocks.nativeSignInWithGoogle).toHaveBeenCalledWith({ skipNativeAuth: true });
    expect(mocks.signInWithPopup).not.toHaveBeenCalled();
    expect(mocks.credential).toHaveBeenCalledWith('mock-google-id-token-123');
    expect(mocks.signInWithCredential).toHaveBeenCalledWith(
      mocks.mockAuthInstance,
      { providerId: 'google.com', idToken: 'mock-google-id-token-123' }
    );
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    expect(res.user).toEqual(fakeFirebaseUser);
    expect(res.profile.authProvider).toBe('google.com');
    expect(res.profile.role).toBe('user');
    expect(res.profile.accountStatus).toBe('active');
    expect(res.profile.emailVerified).toBe(true);
  });

  it('falls back to legacy Play Services Google Sign-In only when Credential Manager is unsupported', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle
      .mockRejectedValueOnce(new Error('GetCredentialUnsupportedException: Credential Manager is not supported'))
      .mockResolvedValueOnce({
        user: null,
        credential: { providerId: 'google.com', idToken: 'fallback-id-token' },
      });

    const fakeUser = {
      uid: 'uid_legacy_android',
      displayName: 'Legacy Device',
      email: 'legacy@tovo.app',
      photoURL: '',
      providerData: [{ providerId: 'google.com' }],
    };
    mocks.signInWithCredential.mockResolvedValue({ user: fakeUser });
    mocks.getDoc.mockResolvedValue({ exists: () => false });

    const res = await AuthService.signInWithGoogle();

    expect(mocks.nativeSignInWithGoogle).toHaveBeenNthCalledWith(1, { skipNativeAuth: true });
    expect(mocks.nativeSignInWithGoogle).toHaveBeenNthCalledWith(2, {
      skipNativeAuth: true,
      useCredentialManager: false,
    });
    expect(res.user.uid).toBe('uid_legacy_android');
  });

  it('rejects suspended native Google accounts and signs out both JS and native sessions', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockResolvedValue({
      user: null,
      credential: { idToken: 'valid-id-token' },
    });
    mocks.signInWithCredential.mockResolvedValue({
      user: { uid: 'uid_suspended', email: 'blocked@tovo.app', providerData: [{ providerId: 'google.com' }] },
    });
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'uid_suspended',
        role: 'user',
        accountStatus: 'suspended',
      }),
    });

    await expect(AuthService.signInWithGoogle()).rejects.toThrow(/suspended/i);
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.mockAuthInstance);
    expect(mocks.nativeSignOut).toHaveBeenCalledTimes(1);
  });

  it('handles native user cancellation gracefully without calling signInWithCredential or fallback', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockRejectedValue(
      new Error('activity is cancelled by the user')
    );

    let caught: any;
    try {
      await AuthService.signInWithGoogle();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught.code).toBe('auth/popup-closed-by-user');
    expect(mocks.nativeSignInWithGoogle).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithCredential).not.toHaveBeenCalled();
  });

  it('handles missing Google account on device safely without calling signInWithCredential', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockRejectedValue(
      new Error('No credentials available')
    );

    await expect(AuthService.signInWithGoogle()).rejects.toThrow(
      /No Google account is available on this device/i
    );
    expect(mocks.signInWithCredential).not.toHaveBeenCalled();
  });

  it('handles missing Android Firebase / SHA-1 config safely', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockRejectedValue(
      new Error('GetCredentialProviderConfigurationException: WILL_BE_OVERRIDDEN')
    );

    await expect(AuthService.signInWithGoogle()).rejects.toThrow(
      /google-services\.json/i
    );
    expect(mocks.signInWithCredential).not.toHaveBeenCalled();
  });

  it('handles native network failures safely', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockRejectedValue(
      new Error('7: Network error while contacting Google')
    );

    await expect(AuthService.signInWithGoogle()).rejects.toThrow(/Network error/i);
    expect(mocks.signInWithCredential).not.toHaveBeenCalled();
  });

  it('rejects invalid native authentication response missing idToken', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignInWithGoogle.mockResolvedValue({
      user: null,
      credential: { providerId: 'google.com', idToken: null },
    });

    await expect(AuthService.signInWithGoogle()).rejects.toThrow(/missing ID token/i);
    expect(mocks.signInWithCredential).not.toHaveBeenCalled();
  });

  it('detects account-exists-with-different-credential on Android and preserves the pending Google credential', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const idToken = makeFakeJwt({ email: 'existing.user@tovo.app' });
    mocks.nativeSignInWithGoogle.mockResolvedValue({
      user: null,
      credential: { providerId: 'google.com', idToken },
    });

    const conflictErr: any = new Error('auth/account-exists-with-different-credential');
    conflictErr.code = 'auth/account-exists-with-different-credential';
    mocks.signInWithCredential.mockRejectedValue(conflictErr);

    let caught: any;
    try {
      await AuthService.signInWithGoogle();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(GoogleAccountConflictError);
    expect(caught.code).toBe('auth/account-exists-with-different-credential');
    expect(caught.email).toBe('existing.user@tovo.app');
    expect(caught.pendingCredential).toEqual({ providerId: 'google.com', idToken });
  });

  it('detects account-exists-with-different-credential on Web via GoogleAuthProvider.credentialFromError', async () => {
    mocks.isNativePlatform.mockReturnValue(false);
    const pendingCred = { providerId: 'google.com', idToken: 'web-pending-token' };
    const webConflict: any = new Error('Account exists');
    webConflict.code = 'auth/account-exists-with-different-credential';
    webConflict.customData = { email: 'web.existing@tovo.app' };
    mocks.signInWithPopup.mockRejectedValue(webConflict);
    mocks.credentialFromError.mockReturnValue(pendingCred);

    let caught: any;
    try {
      await AuthService.signInWithGoogle();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(GoogleAccountConflictError);
    expect(caught.email).toBe('web.existing@tovo.app');
    expect(caught.pendingCredential).toEqual(pendingCred);
  });

  it('links pending Google credential after email/password authentication without overwriting existing profile fields', async () => {
    const existingUser: any = {
      uid: 'uid_email_user',
      displayName: 'Google Alias Name',
      email: 'existing@tovo.app',
      photoURL: 'https://google.example/avatar.png',
      emailVerified: true,
      providerData: [{ providerId: 'password' }, { providerId: 'google.com' }],
      getIdToken: vi.fn().mockResolvedValue('refreshed-jwt'),
    };
    const pendingCred: any = { providerId: 'google.com', idToken: 'verified-google-token' };

    mocks.linkWithCredential.mockResolvedValue({ user: existingUser });
    mocks.mockAuthInstance.currentUser = existingUser;
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'uid_email_user',
        displayName: 'Original Custom Name',
        email: 'existing@tovo.app',
        photoURL: 'https://tovo.example/custom-avatar.png',
        authProvider: 'password',
        role: 'user',
        accountStatus: 'active',
        emailVerified: false,
      }),
    });

    const res = await AuthService.linkPendingGoogleCredential(existingUser, pendingCred);

    expect(mocks.linkWithCredential).toHaveBeenCalledWith(existingUser, pendingCred);
    expect(mocks.reload).toHaveBeenCalledWith(existingUser);
    expect(existingUser.getIdToken).toHaveBeenCalledWith(true);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      { path: 'users/uid_email_user' },
      expect.objectContaining({
        displayName: 'Original Custom Name',
        photoURL: 'https://tovo.example/custom-avatar.png',
        emailVerified: true,
      })
    );
    expect(res.profile.displayName).toBe('Original Custom Name');
    expect(res.profile.authProvider).toBe('password');
  });

  it('maps credential-already-in-use cleanly during account linking', async () => {
    const existingUser: any = { uid: 'uid_email_user' };
    const pendingCred: any = { providerId: 'google.com', idToken: 'taken-google-token' };
    const err: any = new Error('Credential already in use');
    err.code = 'auth/credential-already-in-use';
    mocks.linkWithCredential.mockRejectedValue(err);

    await expect(
      AuthService.linkPendingGoogleCredential(existingUser, pendingCred)
    ).rejects.toThrow(/already associated with a different Tovo account/i);
  });

  it('links Google to currently signed-in email/password user via native bridge on Capacitor', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const idToken = makeFakeJwt({ email: 'mobile@tovo.app' });
    mocks.nativeSignInWithGoogle.mockResolvedValue({
      user: null,
      credential: { providerId: 'google.com', idToken },
    });

    const signedInUser: any = {
      uid: 'uid_mobile_email',
      displayName: 'Mobile User',
      email: 'mobile@tovo.app',
      photoURL: '',
      emailVerified: true,
      providerData: [{ providerId: 'password' }, { providerId: 'google.com' }],
      getIdToken: vi.fn().mockResolvedValue('jwt'),
    };
    mocks.linkWithCredential.mockResolvedValue({ user: signedInUser });
    mocks.mockAuthInstance.currentUser = signedInUser;
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'uid_mobile_email',
        displayName: 'Mobile User',
        email: 'mobile@tovo.app',
        photoURL: '',
        authProvider: 'password',
        role: 'user',
        accountStatus: 'active',
        emailVerified: true,
      }),
    });

    const res = await AuthService.linkCurrentUserWithGoogle(signedInUser);

    expect(mocks.nativeSignInWithGoogle).toHaveBeenCalledWith({ skipNativeAuth: true });
    expect(mocks.linkWithCredential).toHaveBeenCalledWith(signedInUser, {
      providerId: 'google.com',
      idToken,
    });
    expect(res.user.uid).toBe('uid_mobile_email');
  });

  it('preserves browser signInWithPopup flow and existing profile metadata on web', async () => {
    mocks.isNativePlatform.mockReturnValue(false);
    const webUser = {
      uid: 'uid_web_1',
      displayName: 'Google Display Name',
      email: 'web@tovo.app',
      photoURL: 'https://google.example/pic.jpg',
      emailVerified: true,
      providerData: [{ providerId: 'google.com' }],
    };
    mocks.signInWithPopup.mockResolvedValue({ user: webUser });
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'uid_web_1',
        displayName: 'Web User',
        email: 'web@tovo.app',
        photoURL: '',
        role: 'admin',
        accountStatus: 'active',
        emailVerified: true,
      }),
    });

    const res = await AuthService.signInWithGoogle();

    expect(mocks.signInWithPopup).toHaveBeenCalledTimes(1);
    expect(mocks.nativeSignInWithGoogle).not.toHaveBeenCalled();
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      { path: 'users/uid_web_1' },
      expect.objectContaining({
        displayName: 'Web User',
        photoURL: 'https://google.example/pic.jpg',
      })
    );
    expect(res.profile.role).toBe('admin');
    expect(res.profile.displayName).toBe('Web User');
  });

  it('supports email/password login cleanly on both Web and Capacitor Android', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const emailUser = { uid: 'uid_pw_1', email: 'pw@tovo.app', emailVerified: true };
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: emailUser });
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'uid_pw_1',
        displayName: 'Password User',
        email: 'pw@tovo.app',
        authProvider: 'password',
        role: 'user',
        accountStatus: 'active',
        emailVerified: true,
      }),
    });

    const res = await AuthService.loginWithEmail('pw@tovo.app', 'Secret123!', true);

    expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      mocks.mockAuthInstance,
      'pw@tovo.app',
      'Secret123!'
    );
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(res.profile.uid).toBe('uid_pw_1');
  });

  it('clears native credential session on signOut when running on Capacitor', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    await AuthService.signOut();
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.mockAuthInstance);
    expect(mocks.nativeSignOut).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    mocks.isNativePlatform.mockReturnValue(false);
    await AuthService.signOut();
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.mockAuthInstance);
    expect(mocks.nativeSignOut).not.toHaveBeenCalled();
  });
});
