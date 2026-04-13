/**
 * @vitest-environment jsdom
 */
import React from "react";
import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";

vi.mock("react-native", () => ({
  Platform: { select: (opts: Record<string, string>) => opts.ios ?? opts.default ?? "System" },
}));

import {
  AjoraThemeProvider,
  useAjoraTheme,
  useAjoraColors,
  useAjoraSpacing,
  createAjoraTheme,
  lightTheme,
  darkTheme,
} from "../AjoraThemeProvider";

describe("AjoraThemeProvider", () => {
  describe("Default theme", () => {
    it("should provide light theme by default", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider>{children}</AjoraThemeProvider>
        ),
      });

      expect(result.current.name).toBe("light");
      expect(result.current.colors.primary).toBe(lightTheme.colors.primary);
      expect(result.current.colors.background).toBe(
        lightTheme.colors.background
      );
    });

    it("should provide dark theme when darkMode=true", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider darkMode>{children}</AjoraThemeProvider>
        ),
      });

      expect(result.current.name).toBe("dark");
      expect(result.current.colors.primary).toBe(darkTheme.colors.primary);
      expect(result.current.colors.background).toBe(
        darkTheme.colors.background
      );
    });
  });

  describe("Custom theme", () => {
    it("should deep-merge custom colors over the base theme", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider theme={{ colors: { primary: "#FF5722" } }}>
            {children}
          </AjoraThemeProvider>
        ),
      });

      expect(result.current.colors.primary).toBe("#FF5722");
      expect(result.current.colors.background).toBe(
        lightTheme.colors.background
      );
    });

    it("should deep-merge custom spacing", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider theme={{ spacing: { md: 20 } }}>
            {children}
          </AjoraThemeProvider>
        ),
      });

      expect(result.current.spacing.md).toBe(20);
      expect(result.current.spacing.sm).toBe(lightTheme.spacing.sm);
    });

    it("should deep-merge custom borderRadius", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider theme={{ borderRadius: { md: 16 } }}>
            {children}
          </AjoraThemeProvider>
        ),
      });

      expect(result.current.borderRadius.md).toBe(16);
    });

    it("should apply custom theme on top of dark base when darkMode=true", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider darkMode theme={{ colors: { primary: "#00BCD4" } }}>
            {children}
          </AjoraThemeProvider>
        ),
      });

      expect(result.current.colors.primary).toBe("#00BCD4");
      expect(result.current.colors.background).toBe(
        darkTheme.colors.background
      );
    });

    it("should allow overriding the theme name", () => {
      const { result } = renderHook(() => useAjoraTheme(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider theme={{ name: "custom" }}>
            {children}
          </AjoraThemeProvider>
        ),
      });

      expect(result.current.name).toBe("custom");
    });
  });

  describe("Hooks", () => {
    it("useAjoraTheme should return light theme when no provider exists", () => {
      const { result } = renderHook(() => useAjoraTheme());

      expect(result.current.name).toBe("light");
      expect(result.current.colors.primary).toBe(lightTheme.colors.primary);
    });

    it("useAjoraColors should return colors from the provider", () => {
      const { result } = renderHook(() => useAjoraColors(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider darkMode>{children}</AjoraThemeProvider>
        ),
      });

      expect(result.current.primary).toBe(darkTheme.colors.primary);
      expect(result.current.background).toBe(darkTheme.colors.background);
    });

    it("useAjoraSpacing should return spacing from the provider", () => {
      const { result } = renderHook(() => useAjoraSpacing(), {
        wrapper: ({ children }) => (
          <AjoraThemeProvider theme={{ spacing: { lg: 30 } }}>
            {children}
          </AjoraThemeProvider>
        ),
      });

      expect(result.current.lg).toBe(30);
      expect(result.current.md).toBe(lightTheme.spacing.md);
    });
  });

  describe("createAjoraTheme utility", () => {
    it("should create a theme extending the light base by default", () => {
      const theme = createAjoraTheme({ colors: { primary: "#9C27B0" } });

      expect(theme.colors.primary).toBe("#9C27B0");
      expect(theme.colors.background).toBe(lightTheme.colors.background);
      expect(theme.spacing).toEqual(lightTheme.spacing);
    });

    it("should create a theme extending the dark base", () => {
      const theme = createAjoraTheme(
        { colors: { primary: "#9C27B0" } },
        "dark"
      );

      expect(theme.colors.primary).toBe("#9C27B0");
      expect(theme.colors.background).toBe(darkTheme.colors.background);
    });

    it("should deep-merge nested objects", () => {
      const theme = createAjoraTheme({
        typography: { sizes: { md: 18 } },
      });

      expect(theme.typography.sizes.md).toBe(18);
      expect(theme.typography.sizes.sm).toBe(lightTheme.typography.sizes.sm);
      expect(theme.typography.sizes.lg).toBe(lightTheme.typography.sizes.lg);
    });
  });

  describe("Theme values", () => {
    it("lightTheme and darkTheme should have all required color keys", () => {
      const expectedKeys = [
        "primary", "primaryVariant", "background", "surface",
        "text", "textSecondary", "border", "error", "success", "warning",
        "userBubble", "userBubbleText", "assistantBubble", "assistantBubbleText",
        "inputBackground", "placeholder", "iconDefault", "iconActive",
        "itemSelected", "itemSelectedText",
      ] as const;

      for (const key of expectedKeys) {
        expect(lightTheme.colors[key]).toBeDefined();
        expect(darkTheme.colors[key]).toBeDefined();
      }
    });

    it("lightTheme and darkTheme should have all spacing keys", () => {
      const spacingKeys = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;

      for (const key of spacingKeys) {
        expect(typeof lightTheme.spacing[key]).toBe("number");
        expect(typeof darkTheme.spacing[key]).toBe("number");
      }
    });

    it("shadow presets should have elevation for Android compatibility", () => {
      for (const preset of ["none", "sm", "md", "lg"] as const) {
        expect(typeof lightTheme.shadows[preset].elevation).toBe("number");
      }
    });
  });
});
