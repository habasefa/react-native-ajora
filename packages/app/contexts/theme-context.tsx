import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ColorScheme = "light" | "dark" | "auto";

interface ThemePreferenceContextType {
  themePreference: ColorScheme;
  setThemePreference: (preference: ColorScheme) => void;
  isLoaded: boolean;
}

const ThemePreferenceContext = createContext<
  ThemePreferenceContextType | undefined
>(undefined);

const THEME_STORAGE_KEY = "app_theme_preference";

// Load theme preference from AsyncStorage
const getStoredTheme = async (): Promise<ColorScheme | null> => {
  try {
    const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (saved && (saved === "light" || saved === "dark" || saved === "auto")) {
      return saved as ColorScheme;
    }
  } catch (error) {
    console.warn("Failed to load theme from AsyncStorage:", error);
  }
  return null;
};

// Save theme preference to AsyncStorage
const setStoredTheme = async (preference: ColorScheme): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.warn("Failed to save theme to AsyncStorage:", error);
  }
};

/**
 * ThemePreferenceProvider manages the user's theme preference (light/dark/auto)
 * and persists it to AsyncStorage. This works alongside React Navigation's
 * ThemeProvider which handles the actual theming.
 */
export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] =
    useState<ColorScheme>("auto");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await getStoredTheme();
      if (saved) {
        setThemePreferenceState(saved);
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  // Save theme preference when it changes
  const setThemePreference = (preference: ColorScheme) => {
    setThemePreferenceState(preference);
    setStoredTheme(preference);
  };

  return (
    <ThemePreferenceContext.Provider
      value={{
        themePreference,
        setThemePreference,
        isLoaded,
      }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}

/**
 * Hook to access theme preference and setter
 */
export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (context === undefined) {
    throw new Error(
      "useThemePreference must be used within a ThemePreferenceProvider"
    );
  }
  return context;
}

/**
 * Hook that combines theme preference with system color scheme
 * to return the actual color scheme to use
 */
export function useColorScheme(): "light" | "dark" {
  const systemColorScheme = useRNColorScheme();
  const { themePreference } = useThemePreference();

  if (themePreference === "auto") {
    return systemColorScheme === "dark" ? "dark" : "light";
  }
  return themePreference;
}
