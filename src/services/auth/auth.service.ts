import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  linkWithCredential,
  linkWithPopup,
  GoogleAuthProvider,
  AuthCredential,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  reload,
  User,
  getIdToken,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { apiUrl } from '../../lib/api';
import { UserProfile } from '../../types';

export class GoogleAccountConflictError extends Error {
  public readonly code = 'auth/account-exists-with-different-credential';
  public readonly email: string;
  public readonly pendingCredential: AuthCredential;

  constructor(email: string, pendingCredential: AuthCredential, message?: string) {
    super(
      message ||
        `An account already exists${email ? ` for ${email}` : ''} with email and password. Sign in with your email and password to verify ownership and link your Google account.`
    );
    this.name = 'GoogleAccountConflictError';
    this.email = email;
    this.pendingCredential = pendingCredential;
  }
}

export class AuthService {
  /**
   * Validate password strength: minimum 8 characters, at least 1 letter and 1 number
   */
  public static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number.' };
    }
    return { valid: true };
  }

  /**
   * Validate email format
   */
  public static validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  /**
   * Register a new user with Email and Password
   */
  public static async registerWithEmail(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User; profile: UserProfile }> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) throw new Error('Full name is required.');
    if (!this.validateEmail(cleanEmail)) throw new Error('Please enter a valid email address.');

    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) throw new Error(passCheck.message);

    // 1. Create Firebase Auth User
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    // 2. Set Display Name in Firebase Auth profile
    try {
      await updateProfile(user, { displayName: cleanName });
    } catch (e) {
      console.warn('Profile name update note:', e);
    }

    // 3. Send email verification link
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn('Email verification link send warning:', e);
    }

    // 4. Create User Profile Document in Firestore (`users/{uid}`)
    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: user.uid,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: '',
      authProvider: 'password',
      emailVerified: false,
      role: 'user',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      onboardingCompleted: true,
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }

    return { user, profile };
  }

  /**
   * Sign in with Email and Password
   */
  public static async loginWithEmail(
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ user: User; profile: UserProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!this.validateEmail(cleanEmail)) throw new Error('Please enter a valid email address.');
    if (!password) throw new Error('Password is required.');

    // 1. Set persistence
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    } catch (e) {
      console.warn('Persistence setting warning:', e);
    }

    // 2. Sign In via official Firebase Authentication
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    // 3. Fetch User Profile - Login must NEVER create a new profile or account
    const profileDoc = await getDoc(doc(db, 'users', user.uid));
    if (!profileDoc.exists()) {
      await this.signOut();
      throw new Error('No registered profile exists for this account. Please complete registration.');
    }

    const profile = profileDoc.data() as UserProfile;
    if (profile.accountStatus === 'suspended') {
      await this.signOut();
      throw new Error('This account has been suspended by an administrator. Access is denied.');
    }

    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: now,
        emailVerified: user.emailVerified,
        updatedAt: now,
      });
      profile.lastLoginAt = now;
      profile.emailVerified = user.emailVerified;
    } catch (e) {
      console.warn('Could not update last login timestamp:', e);
    }

    return { user, profile };
  }

  /**
   * Extract email UI hint from a Google OIDC ID token payload (UI prefill only, never used as auth proof)
   */
  private static extractEmailHintFromIdToken(idToken: string): string {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2) return '';
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    } catch {
      return '';
    }
  }

  /**
   * Detect if Credential Manager itself is unsupported on the Android device/Play Services version
   */
  private static isCredentialManagerUnsupported(error: unknown): boolean {
    const message = error instanceof Error
      ? error.message
      : typeof (error as any)?.message === 'string'
        ? (error as any).message
        : String(error || '');
    const lower = message.toLowerCase();
    return (
      lower.includes('getcredentialunsupportedexception') ||
      lower.includes('credential manager is not supported') ||
      lower.includes('credential_manager_unsupported') ||
      lower.includes('no provider found')
    );
  }

  /**
   * Map native Android Credential Manager / Google Sign-In & Firebase Auth errors to clear user-facing errors
   */
  private static mapGoogleAuthError(
    error: unknown,
    pendingCredential?: AuthCredential,
    emailHint: string = ''
  ): Error {
    if (error instanceof GoogleAccountConflictError) {
      return error;
    }

    const rawCode = typeof (error as any)?.code === 'string' ? (error as any).code : '';
    const message = error instanceof Error
      ? error.message
      : typeof (error as any)?.message === 'string'
        ? (error as any).message
        : String(error || 'Google Sign-In failed.');
    const lower = message.toLowerCase();

    // Account exists with different credential (e.g. email/password)
    if (rawCode === 'auth/account-exists-with-different-credential') {
      let credFromErr: AuthCredential | null = null;
      try {
        credFromErr = GoogleAuthProvider.credentialFromError(error as any);
      } catch {
        credFromErr = null;
      }
      const conflictEmail =
        typeof (error as any)?.customData?.email === 'string'
          ? (error as any).customData.email.trim().toLowerCase()
          : emailHint;
      const effectiveCred = credFromErr || pendingCredential;
      if (effectiveCred) {
        return new GoogleAccountConflictError(conflictEmail, effectiveCred);
      }
      const conflictErr = new Error(
        `An account already exists${conflictEmail ? ` for ${conflictEmail}` : ''} with email and password. Please sign in with your password and link Google in Settings.`
      );
      (conflictErr as any).code = 'auth/account-exists-with-different-credential';
      return conflictErr;
    }

    // No Google account present on device / Credential Manager has no eligible credentials
    if (
      lower.includes('no credentials available') ||
      lower.includes('nocredential') ||
      lower.includes('cannot find a matching credential') ||
      lower.includes('no google account')
    ) {
      const noAccountError = new Error(
        'No Google account is available on this device. Add a Google account in Android Settings or sign in with email and password.'
      );
      (noAccountError as any).code = 'auth/no-google-account';
      return noAccountError;
    }

    // User intentionally cancelled the native Credential Manager / Google Sign-In sheet or popup
    if (
      rawCode === 'auth/popup-closed-by-user' ||
      rawCode === 'auth/cancelled-popup-request' ||
      lower.includes('cancel') ||
      lower.includes('12501') ||
      lower.includes('16:') ||
      lower.includes('activity is cancelled by the user')
    ) {
      const cancelError = new Error('Google Sign-In was cancelled.');
      (cancelError as any).code = 'auth/popup-closed-by-user';
      return cancelError;
    }

    // Missing google-services.json, OAuth Web Client ID, SHA-1/SHA-256 mismatch, or disabled provider
    if (
      rawCode === 'auth/operation-not-allowed' ||
      rawCode === 'auth/unauthorized-domain' ||
      rawCode === 'auth/invalid-oauth-client-id' ||
      lower.includes('will_be_overridden') ||
      lower.includes('providerconfiguration') ||
      lower.includes('default_web_client_id') ||
      lower.includes('developer_error') ||
      lower.includes('12500') ||
      /\b10\b/.test(lower)
    ) {
      const configErr = new Error(
        'Google Sign-In is not configured properly for this build. Verify google-services.json, Web OAuth client ID, Google provider status, and Android SHA-1/SHA-256 fingerprints in Firebase Console.'
      );
      (configErr as any).code = rawCode || 'auth/configuration-mismatch';
      return configErr;
    }

    // Credential / linking specific Firebase errors
    if (rawCode === 'auth/credential-already-in-use' || rawCode === 'auth/email-already-in-use') {
      const linkedErr = new Error(
        'This Google account is already associated with a different Tovo account.'
      );
      (linkedErr as any).code = rawCode;
      return linkedErr;
    }

    if (rawCode === 'auth/provider-already-linked') {
      const alreadyLinkedErr = new Error(
        'A Google account is already linked to this Tovo account.'
      );
      (alreadyLinkedErr as any).code = rawCode;
      return alreadyLinkedErr;
    }

    if (rawCode === 'auth/invalid-credential' || rawCode === 'auth/invalid-id-token') {
      const invalidCredErr = new Error(
        'The Google authentication credential is invalid or expired. Please try signing in again.'
      );
      (invalidCredErr as any).code = rawCode;
      return invalidCredErr;
    }

    if (rawCode === 'auth/user-disabled') {
      const disabledErr = new Error('This account has been disabled. Please contact an administrator.');
      (disabledErr as any).code = rawCode;
      return disabledErr;
    }

    if (rawCode === 'auth/popup-blocked') {
      const popupBlockedErr = new Error(
        'The Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.'
      );
      (popupBlockedErr as any).code = rawCode;
      return popupBlockedErr;
    }

    // Network connectivity failure
    if (
      rawCode === 'auth/network-request-failed' ||
      lower.includes('network') ||
      lower.includes('timeout') ||
      lower.includes('unable to resolve') ||
      lower.includes('7:')
    ) {
      const netErr = new Error('Network error during Google Sign-In. Check your internet connection and try again.');
      (netErr as any).code = 'auth/network-request-failed';
      return netErr;
    }

    const mapped = new Error(message || 'Google Sign-In failed. Please try again.');
    if (rawCode) {
      (mapped as any).code = rawCode;
    }
    return mapped;
  }

  /**
   * Acquire a native Google OAuth credential via @capacitor-firebase/authentication
   * using skipNativeAuth: true so Firebase JS SDK remains the single Auth source of truth.
   */
  private static async acquireNativeGoogleCredential(): Promise<{
    credential: AuthCredential;
    emailHint: string;
  }> {
    let nativeResult: Awaited<ReturnType<typeof FirebaseAuthentication.signInWithGoogle>>;
    try {
      nativeResult = await FirebaseAuthentication.signInWithGoogle({
        skipNativeAuth: true,
      });
    } catch (error) {
      if (this.isCredentialManagerUnsupported(error)) {
        try {
          nativeResult = await FirebaseAuthentication.signInWithGoogle({
            skipNativeAuth: true,
            useCredentialManager: false,
          });
        } catch (fallbackError) {
          throw this.mapGoogleAuthError(fallbackError);
        }
      } else {
        throw this.mapGoogleAuthError(error);
      }
    }

    const idToken = nativeResult?.credential?.idToken;
    if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
      throw new Error('Google Sign-In returned an invalid authentication response (missing ID token).');
    }

    const emailHint = this.extractEmailHintFromIdToken(idToken);
    const credential = GoogleAuthProvider.credential(idToken);
    return { credential, emailHint };
  }

  /**
   * Synchronize or initialize the Firestore user profile after Google Authentication.
   * Preserves existing user profile attributes, role, accountStatus, and authProvider.
   */
  private static async syncGoogleUserProfile(user: User): Promise<{ user: User; profile: UserProfile }> {
    const now = new Date().toISOString();
    const profileRef = doc(db, 'users', user.uid);
    const profileDoc = await getDoc(profileRef);
    const isGoogleLinked = Boolean(user.providerData?.some((p) => p.providerId === 'google.com'));

    let profile: UserProfile;
    if (profileDoc.exists()) {
      profile = profileDoc.data() as UserProfile;
      if (profile.accountStatus === 'suspended') {
        await this.signOut();
        throw new Error('Your account has been suspended by an administrator.');
      }

      // Preserve existing user profile fields unexpectedly overwritten during Google login/linking
      const preservedDisplayName = profile.displayName?.trim()
        ? profile.displayName
        : user.displayName || 'Tovo User';
      const preservedPhotoUrl = profile.photoURL?.trim()
        ? profile.photoURL
        : user.photoURL || '';
      const resolvedEmailVerified = Boolean(profile.emailVerified || user.emailVerified || isGoogleLinked);

      await updateDoc(profileRef, {
        lastLoginAt: now,
        emailVerified: resolvedEmailVerified,
        displayName: preservedDisplayName,
        photoURL: preservedPhotoUrl,
        updatedAt: now,
      });
      profile.lastLoginAt = now;
      profile.emailVerified = resolvedEmailVerified;
      profile.displayName = preservedDisplayName;
      profile.photoURL = preservedPhotoUrl;
    } else {
      profile = {
        uid: user.uid,
        displayName: user.displayName || 'Tovo User',
        email: user.email?.toLowerCase() || '',
        photoURL: user.photoURL || '',
        authProvider: 'google.com',
        emailVerified: true,
        role: 'user',
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        onboardingCompleted: true,
      };
      await setDoc(profileRef, profile);
    }

    return { user, profile };
  }

  /**
   * Sign in with Google:
   * - Native Android/iOS (Capacitor): Uses @capacitor-firebase/authentication with skipNativeAuth: true
   *   and exchanges the returned Google ID token with the single Firebase JS Auth instance.
   * - Web browser: Uses Firebase JS signInWithPopup flow.
   */
  public static async signInWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
    if (Capacitor.isNativePlatform()) {
      const { credential, emailHint } = await this.acquireNativeGoogleCredential();
      try {
        const cred = await signInWithCredential(auth, credential);
        return await this.syncGoogleUserProfile(cred.user);
      } catch (error) {
        throw this.mapGoogleAuthError(error, credential, emailHint);
      }
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const cred = await signInWithPopup(auth, provider);
      return await this.syncGoogleUserProfile(cred.user);
    } catch (error) {
      throw this.mapGoogleAuthError(error);
    }
  }

  /**
   * Securely link a verified Google AuthCredential to an already-authenticated Firebase user session
   */
  public static async linkPendingGoogleCredential(
    user: User,
    credential: AuthCredential
  ): Promise<{ user: User; profile: UserProfile }> {
    try {
      const result = await linkWithCredential(user, credential);
      try {
        await reload(result.user);
        await result.user.getIdToken(true);
      } catch (refreshErr) {
        console.warn('Token refresh after account linking note:', refreshErr);
      }
      return await this.syncGoogleUserProfile(auth.currentUser || result.user);
    } catch (error) {
      throw this.mapGoogleAuthError(error);
    }
  }

  /**
   * Link a Google account directly to the currently signed-in Firebase user (e.g. from Settings)
   */
  public static async linkCurrentUserWithGoogle(user: User): Promise<{ user: User; profile: UserProfile }> {
    if (Capacitor.isNativePlatform()) {
      const { credential } = await this.acquireNativeGoogleCredential();
      return this.linkPendingGoogleCredential(user, credential);
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await linkWithPopup(user, provider);
      try {
        await reload(result.user);
        await result.user.getIdToken(true);
      } catch (refreshErr) {
        console.warn('Token refresh after popup account linking note:', refreshErr);
      }
      return await this.syncGoogleUserProfile(auth.currentUser || result.user);
    } catch (error) {
      throw this.mapGoogleAuthError(error);
    }
  }

  /**
   * Sign out from the single Firebase JS Auth instance and clear native credential cache if on Capacitor
   */
  public static async signOut(): Promise<void> {
    await signOut(auth);
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch (e) {
        console.warn('Native Google/Firebase sign-out cleanup note:', e);
      }
    }
  }

  /**
   * Send Password Reset Email
   */
  public static async sendPasswordReset(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!this.validateEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    await sendPasswordResetEmail(auth, cleanEmail);
  }

  /**
   * Resend Email Verification
   */
  public static async resendEmailVerification(user: User): Promise<void> {
    await sendEmailVerification(user);
  }

  /**
   * Fetch User Profile from Firestore
   */
  public static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Check if the current user has the custom admin claim
   */
  public static async checkAdminClaim(user: User): Promise<boolean> {
    try {
      const tokenResult = await user.getIdTokenResult(true);
      return !!tokenResult.claims.admin;
    } catch (e) {
      console.warn('Error checking admin claim:', e);
      return false;
    }
  }

  /**
   * Bootstrap Admin procedure
   */
  public static async bootstrapAdmin(user: User): Promise<{ success: boolean; message: string }> {
    const token = await getIdToken(user, true);
    const response = await fetch(apiUrl('/api/admin/bootstrap'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initialize administrator role.');
    }

    // Force refresh token to pull in the new custom claim
    await user.getIdTokenResult(true);
    return data;
  }

  /**
   * Delete User Account & all associated data via trusted server endpoint
   */
  public static async deleteAccount(user: User): Promise<void> {
    const token = await getIdToken(user, true);
    const response = await fetch(apiUrl('/api/user/account'), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Account deletion failed.');
    }

    await this.signOut();
  }
}
