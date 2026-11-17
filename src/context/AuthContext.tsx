import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AuthCredential, User, onAuthStateChanged, reload } from 'firebase/auth';
import { auth, testConnection } from '../lib/firebase';
import { storageService } from '../services/storage/storage.service';
import { AuthService, GoogleAccountConflictError } from '../services/auth/auth.service';
import { UserProfile } from '../types';

export type AuthModalMode = 'welcome' | 'login' | 'signup' | 'forgot' | 'verify' | 'suspended';

export interface PendingGoogleLink {
  email: string;
  credential: AuthCredential;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isGuest: boolean;
  isEmailVerified: boolean;
  activeUserId: string;
  loading: boolean;
  firebaseConnected: boolean;
  pendingGoogleLink: PendingGoogleLink | null;
  clearPendingGoogleLink: () => void;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  continueAsGuest: () => void;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  reloadUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  bootstrapAdmin: () => Promise<{ success: boolean; message: string }>;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  authModalMode: AuthModalMode;
  setAuthModalMode: (mode: AuthModalMode) => void;
  showAdminModal: boolean;
  setShowAdminModal: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [pendingGoogleLink, setPendingGoogleLink] = useState<PendingGoogleLink | null>(null);
  const [, setSessionRevision] = useState<number>(0);

  // Prevent concurrent profile race while explicit signIn/linking mutates Firestore
  const explicitAuthInProgressRef = useRef<boolean>(false);

  // Auth & Admin UI modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('welcome');
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Guest bypass disabled for zero-trust authentication
  const continueAsGuest = () => {
    setIsGuest(false);
    setShowAuthModal(false);
  };

  const clearPendingGoogleLink = useCallback(() => {
    setPendingGoogleLink(null);
  }, []);

  const loadUserProfile = useCallback(async (firebaseUser: User) => {
    try {
      const p = await AuthService.getUserProfile(firebaseUser.uid);
      if (p) {
        if (p.accountStatus === 'suspended') {
          await AuthService.signOut();
          setUser(null);
          setProfile(null);
          setIsGuest(false);
          setIsAdmin(false);
          setAuthModalMode('suspended');
          setShowAuthModal(true);
          return;
        }
        setProfile(p);
      }

      // Check custom claims strictly from Firebase token
      const hasAdmin = await AuthService.checkAdminClaim(firebaseUser);
      setIsAdmin(hasAdmin);
    } catch (e) {
      console.warn('Error loading user profile or admin claims:', e);
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Test connection on boot per Firebase guidelines
    testConnection().then((ok) => {
      if (active) setFirebaseConnected(ok);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        if (!explicitAuthInProgressRef.current) {
          await loadUserProfile(currentUser);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsGuest(false);
      }
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadUserProfile]);

  const registerWithEmail = async (name: string, email: string, password: string) => {
    explicitAuthInProgressRef.current = true;
    try {
      const { user: registeredUser, profile: newProfile } = await AuthService.registerWithEmail(name, email, password);
      setPendingGoogleLink(null);
      setUser(registeredUser);
      setProfile(newProfile);
      setIsGuest(false);
      setIsAdmin(false);
      setAuthModalMode('verify');
    } finally {
      explicitAuthInProgressRef.current = false;
    }
  };

  const loginWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
    explicitAuthInProgressRef.current = true;
    try {
      const { user: loggedInUser, profile: fetchedProfile } = await AuthService.loginWithEmail(email, password, rememberMe);
      let activeUser = loggedInUser;
      let activeProfile = fetchedProfile;

      // If user previously hit account-exists-with-different-credential, securely link the pending Google credential
      // only after Firebase has verified password ownership of the matching account.
      if (pendingGoogleLink) {
        const cleanEmail = email.trim().toLowerCase();
        const matchesConflictEmail =
          !pendingGoogleLink.email || pendingGoogleLink.email === cleanEmail;

        if (matchesConflictEmail) {
          try {
            const linked = await AuthService.linkPendingGoogleCredential(
              loggedInUser,
              pendingGoogleLink.credential
            );
            activeUser = linked.user;
            activeProfile = linked.profile;
          } finally {
            setPendingGoogleLink(null);
          }
        } else {
          setPendingGoogleLink(null);
        }
      }

      setUser(activeUser);
      setProfile(activeProfile);
      setSessionRevision((prev) => prev + 1);
      setIsGuest(false);

      // Strictly check verified custom claims only
      const hasAdmin = await AuthService.checkAdminClaim(activeUser);
      setIsAdmin(hasAdmin);
      setShowAuthModal(false);
    } finally {
      explicitAuthInProgressRef.current = false;
    }
  };

  const signInWithGoogle = async () => {
    explicitAuthInProgressRef.current = true;
    try {
      const { user: loggedInUser, profile: fetchedProfile } = await AuthService.signInWithGoogle();
      setPendingGoogleLink(null);
      setUser(loggedInUser);
      setProfile(fetchedProfile);
      setSessionRevision((prev) => prev + 1);
      setIsGuest(false);

      // Strictly check verified custom claims only
      const hasAdmin = await AuthService.checkAdminClaim(loggedInUser);
      setIsAdmin(hasAdmin);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error instanceof GoogleAccountConflictError || error?.code === 'auth/account-exists-with-different-credential') {
        const conflictCred = (error as GoogleAccountConflictError)?.pendingCredential;
        if (conflictCred) {
          setPendingGoogleLink({
            email: (error as GoogleAccountConflictError).email || '',
            credential: conflictCred,
          });
        }
      }
      throw error;
    } finally {
      explicitAuthInProgressRef.current = false;
    }
  };

  const linkGoogleAccount = async () => {
    const targetUser = auth.currentUser || user;
    if (!targetUser) {
      throw new Error('You must be signed in to link a Google account.');
    }
    explicitAuthInProgressRef.current = true;
    try {
      const { user: linkedUser, profile: updatedProfile } = await AuthService.linkCurrentUserWithGoogle(targetUser);
      setPendingGoogleLink(null);
      setUser(linkedUser);
      setProfile(updatedProfile);
      setSessionRevision((prev) => prev + 1);
    } finally {
      explicitAuthInProgressRef.current = false;
    }
  };

  const signOutUser = async () => {
    try {
      const prevUid = user?.uid;
      setPendingGoogleLink(null);
      await AuthService.signOut();
      if (prevUid) {
        // Clear local storage / SQLite user-isolated cache to prevent data leakage during account switching
        await storageService.clearUserData(prevUid);
      }
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsGuest(false);
      setShowAdminModal(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await AuthService.sendPasswordReset(email);
  };

  const resendVerification = async () => {
    if (!user) throw new Error('No user is currently signed in.');
    await AuthService.resendEmailVerification(user);
  };

  const reloadUser = async () => {
    const targetUser = auth.currentUser || user;
    if (!targetUser) return;
    await reload(targetUser);
    if (auth.currentUser) {
      // Preserve Firebase User instance prototype methods (getIdToken, getIdTokenResult, etc.)
      setUser(auth.currentUser);
      setSessionRevision((prev) => prev + 1);
      await loadUserProfile(auth.currentUser);
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user is currently signed in.');
    const prevUid = user.uid;
    setPendingGoogleLink(null);
    await AuthService.deleteAccount(user);
    await storageService.clearUserData(prevUid);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsGuest(false);
  };

  const bootstrapAdmin = async () => {
    if (!user) throw new Error('You must be signed in to initialize administrator access.');
    const result = await AuthService.bootstrapAdmin(user);
    await reloadUser();
    setIsAdmin(true);
    return result;
  };

  const activeUserId = user?.uid || '';
  const isEmailVerified = Boolean(
    user && (user.emailVerified || user.providerData.some((p) => p.providerId === 'google.com'))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isGuest,
        isEmailVerified,
        activeUserId,
        loading,
        firebaseConnected,
        pendingGoogleLink,
        clearPendingGoogleLink,
        registerWithEmail,
        loginWithEmail,
        signInWithGoogle,
        linkGoogleAccount,
        continueAsGuest,
        signOutUser,
        sendPasswordReset,
        resendVerification,
        reloadUser,
        deleteAccount,
        bootstrapAdmin,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
        showAdminModal,
        setShowAdminModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
