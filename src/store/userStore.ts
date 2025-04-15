import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "better-auth";
import { getSession, signOut } from "../../auth-client";

export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: Theme;
  emailsPerPage: number;
  notificationsEnabled: boolean;
  autoReadReceipts: boolean;
  compactView: boolean;
  signature?: string;
  defaultReplyBehavior: 'reply' | 'replyAll';
  inboxLayout: 'default' | 'compact' | 'comfortable';
  spellCheckEnabled: boolean;
  aiSuggestionsEnabled: boolean;
}

interface UserStore {
  // User authentication data
  user: User | null;
  isLoading: boolean;
  
  // User preferences
  preferences: UserPreferences;
  
  // Actions
  setUser: (user: User | null) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  initializeUser: () => Promise<void>;
  logout: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  emailsPerPage: 25,
  notificationsEnabled: true,
  autoReadReceipts: true,
  compactView: false,
  defaultReplyBehavior: 'reply',
  inboxLayout: 'default',
  spellCheckEnabled: true,
  aiSuggestionsEnabled: true,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoading: false,
      preferences: defaultPreferences,
      
      // Actions
      setUser: (user: User | null) => set({ user }),
      
      updatePreferences: (updates: Partial<UserPreferences>) => {
        const { preferences } = get();
        set({
          preferences: { ...preferences, ...updates },
        });
      },
      
      initializeUser: async () => {
        set({ isLoading: true });
        try {
          const session = await getSession();
          if (session?.data) {
            set({ user: session.data.user });
          }
        } catch (error) {
          console.error('Failed to initialize user:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: () => {
        set({ user: null });
        signOut();
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// Helper hooks for specific parts of the state
export const useUserPreferences = () => useUserStore(state => state.preferences);
export const useUser = () => useUserStore(state => state.user);
export const useIsAuthenticated = () => useUserStore(state => !!state.user);


