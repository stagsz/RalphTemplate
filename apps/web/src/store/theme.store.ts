import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Storage key for persisted theme state.
 */
const THEME_STORAGE_KEY = 'hazop-theme';

/**
 * Color scheme options.
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Theme state interface.
 */
interface ThemeState {
  /** Current color scheme (light or dark) */
  colorScheme: ColorScheme;

  /** Whether theme state has been loaded from storage */
  isHydrated: boolean;
}

/**
 * Theme store actions interface.
 */
interface ThemeActions {
  /** Set the color scheme */
  setColorScheme: (scheme: ColorScheme) => void;

  /** Toggle between light and dark mode */
  toggleColorScheme: () => void;

  /** Mark theme as hydrated (loaded from storage) */
  setHydrated: () => void;
}

/**
 * Complete theme store type.
 */
export type ThemeStore = ThemeState & ThemeActions;

/**
 * Get initial color scheme based on system preference.
 */
function getInitialColorScheme(): ColorScheme {
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Initial theme state.
 */
const initialState: ThemeState = {
  colorScheme: getInitialColorScheme(),
  isHydrated: false,
};

/**
 * Theme store for managing application color scheme.
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Respects system preference on initial load
 * - Provides toggle action for dark mode switch
 *
 * @example
 * ```tsx
 * const { colorScheme, toggleColorScheme } = useThemeStore();
 *
 * return (
 *   <button onClick={toggleColorScheme}>
 *     {colorScheme === 'dark' ? 'Switch to light' : 'Switch to dark'}
 *   </button>
 * );
 * ```
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      setColorScheme: (scheme: ColorScheme) => {
        set({ colorScheme: scheme });
      },

      toggleColorScheme: () => {
        const current = get().colorScheme;
        set({ colorScheme: current === 'dark' ? 'light' : 'dark' });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist colorScheme
      partialize: (state) => ({
        colorScheme: state.colorScheme,
      }),
      // On rehydration, mark as hydrated
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);

/**
 * Selector for getting the current color scheme.
 */
export const selectColorScheme = (state: ThemeStore) => state.colorScheme;

/**
 * Selector for checking if theme is dark.
 */
export const selectIsDark = (state: ThemeStore) => state.colorScheme === 'dark';

/**
 * Selector for getting hydration status.
 */
export const selectIsHydrated = (state: ThemeStore) => state.isHydrated;
