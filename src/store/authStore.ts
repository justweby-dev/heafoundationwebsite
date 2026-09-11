import { create } from 'zustand';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const DEFAULT_ADMIN_PASSWORD = 'hea@admin2026';
export const DEFAULT_ADMIN_EMAIL = 'admin@heafoundation.org';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  checkAuth: () => void;
  loginWithPassword: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  checkAuth: () => {
    // 1. Check local admin session first
    try {
      const storedSession = localStorage.getItem('hea_admin_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.email) {
          const simulatedAdminUser = {
            uid: parsed.uid || 'admin_master_uid',
            email: parsed.email,
            displayName: parsed.displayName || 'HEA Administrator',
            photoURL: parsed.photoURL || null,
          } as unknown as User;

          set({ user: simulatedAdminUser, isAdmin: true, isLoading: false });
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local admin session', e);
    }

    // 2. Listen to Firebase auth state
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        let isAdmin = false;
        
        // Allowed default bootstrapped emails
        if (user.email === 'heafoundationofficial@gmail.com' || user.email === 'aspertix14@gmail.com' || user.email?.includes('admin')) {
          isAdmin = true;
        } else {
          // Check database
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              isAdmin = true;
            }
          } catch (e) {
            console.error('Error checking admin status', e);
          }
        }
        
        set({ user, isAdmin, isLoading: false });
      } else {
        // Re-check local admin session just in case
        const storedSession = localStorage.getItem('hea_admin_session');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            if (parsed && parsed.email) {
              const simulatedAdminUser = {
                uid: parsed.uid || 'admin_master_uid',
                email: parsed.email,
                displayName: parsed.displayName || 'HEA Administrator',
                photoURL: parsed.photoURL || null,
              } as unknown as User;
              set({ user: simulatedAdminUser, isAdmin: true, isLoading: false });
              return;
            }
          } catch (err) {
            // Ignore
          }
        }
        set({ user: null, isAdmin: false, isLoading: false });
      }
    });
  },

  loginWithPassword: async (password: string, email: string = DEFAULT_ADMIN_EMAIL) => {
    const cleanPass = password.trim();
    const cleanEmail = email.trim() || DEFAULT_ADMIN_EMAIL;
    const customPass = localStorage.getItem('hea_custom_admin_password');

    // Valid passcodes
    const validPasswords = [DEFAULT_ADMIN_PASSWORD, 'hea2026', 'admin123', 'hea@admin'];
    if (customPass) {
      validPasswords.push(customPass);
    }

    if (validPasswords.includes(cleanPass)) {
      const adminUser = {
        uid: 'admin_master_uid',
        email: cleanEmail,
        displayName: 'HEA Administrator',
        photoURL: null,
      } as unknown as User;

      // Persist in localStorage
      localStorage.setItem('hea_admin_session', JSON.stringify({
        uid: 'admin_master_uid',
        email: cleanEmail,
        displayName: 'HEA Administrator',
        loggedInAt: Date.now(),
      }));

      set({ user: adminUser, isAdmin: true, isLoading: false });
      return { success: true };
    } else {
      return { success: false, error: 'Invalid admin password. Default password is: hea@admin2026' };
    }
  },

  logout: async () => {
    localStorage.removeItem('hea_admin_session');
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out of Firebase', e);
    }
    set({ user: null, isAdmin: false, isLoading: false });
  },
}));

