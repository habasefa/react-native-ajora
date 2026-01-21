import { SharedValue } from "react-native-reanimated";

// ============================================================================
// Animation Configuration Types
// ============================================================================

/**
 * Animation entrance/exit types for messages
 */
export type AjoraAnimationType =
  | "slideUp"
  | "slideDown"
  | "fadeIn"
  | "fadeOut"
  | "scale"
  | "spring"
  | "none";

/**
 * Spring animation configuration
 */
export interface AjoraSpringConfig {
  /** Damping ratio (default: 15) */
  damping: number;
  /** Stiffness (default: 150) */
  stiffness: number;
  /** Mass (default: 1) */
  mass: number;
}

/**
 * Timing animation configuration
 */
export interface AjoraTimingConfig {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name */
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bezier";
}

/**
 * Complete animation configuration for Ajora components
 */
export interface AjoraAnimationConfig {
  /** Enable/disable all animations */
  enabled: boolean;

  /** Respect system reduce motion setting */
  respectReduceMotion: boolean;

  /** Message animations */
  message: {
    /** Animation when message enters */
    enter: AjoraAnimationType;
    /** Animation when message exits */
    exit: AjoraAnimationType;
    /** Duration in ms (for timing animations) */
    duration: number;
    /** Spring config (for spring animations) */
    spring: AjoraSpringConfig;
  };

  /** Typing indicator animations */
  typingIndicator: {
    enabled: boolean;
    /** Dot pulse animation speed in ms */
    pulseSpeed: number;
  };

  /** Suggestion pills animations */
  suggestions: {
    enabled: boolean;
    /** Stagger delay between each pill */
    staggerDelay: number;
    /** Animation type */
    type: AjoraAnimationType;
  };

  /** Scroll to bottom button */
  scrollButton: {
    enabled: boolean;
    /** Fade in/out duration */
    duration: number;
  };

  /** Input area animations */
  input: {
    /** Animate height changes */
    animateHeight: boolean;
    /** Button press feedback */
    buttonFeedback: boolean;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default animation configuration
 */
export const defaultAnimationConfig: AjoraAnimationConfig = {
  enabled: true,
  respectReduceMotion: true,

  message: {
    enter: "fadeIn",
    exit: "fadeOut",
    duration: 200,
    spring: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
  },

  typingIndicator: {
    enabled: true,
    pulseSpeed: 600,
  },

  suggestions: {
    enabled: true,
    staggerDelay: 50,
    type: "fadeIn",
  },

  scrollButton: {
    enabled: true,
    duration: 150,
  },

  input: {
    animateHeight: true,
    buttonFeedback: true,
  },
};

/**
 * Minimal animation configuration (subtle animations)
 */
export const minimalAnimationConfig: AjoraAnimationConfig = {
  ...defaultAnimationConfig,
  message: {
    enter: "fadeIn",
    exit: "fadeOut",
    duration: 100,
    spring: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
  },
  suggestions: {
    enabled: true,
    staggerDelay: 0,
    type: "fadeIn",
  },
};

/**
 * No animations configuration
 */
export const noAnimationConfig: AjoraAnimationConfig = {
  enabled: false,
  respectReduceMotion: true,
  message: {
    enter: "none",
    exit: "none",
    duration: 0,
    spring: { damping: 0, stiffness: 0, mass: 0 },
  },
  typingIndicator: {
    enabled: false,
    pulseSpeed: 0,
  },
  suggestions: {
    enabled: false,
    staggerDelay: 0,
    type: "none",
  },
  scrollButton: {
    enabled: false,
    duration: 0,
  },
  input: {
    animateHeight: false,
    buttonFeedback: false,
  },
};

/**
 * Spring-heavy configuration (bouncy feel)
 */
export const springAnimationConfig: AjoraAnimationConfig = {
  ...defaultAnimationConfig,
  message: {
    enter: "spring",
    exit: "fadeOut",
    duration: 300,
    spring: {
      damping: 12,
      stiffness: 120,
      mass: 1,
    },
  },
  suggestions: {
    enabled: true,
    staggerDelay: 75,
    type: "spring",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Merge custom animation config with defaults
 */
export function createAnimationConfig(
  customConfig: Partial<AjoraAnimationConfig>,
): AjoraAnimationConfig {
  return {
    ...defaultAnimationConfig,
    ...customConfig,
    message: {
      ...defaultAnimationConfig.message,
      ...(customConfig.message ?? {}),
    },
    typingIndicator: {
      ...defaultAnimationConfig.typingIndicator,
      ...(customConfig.typingIndicator ?? {}),
    },
    suggestions: {
      ...defaultAnimationConfig.suggestions,
      ...(customConfig.suggestions ?? {}),
    },
    scrollButton: {
      ...defaultAnimationConfig.scrollButton,
      ...(customConfig.scrollButton ?? {}),
    },
    input: {
      ...defaultAnimationConfig.input,
      ...(customConfig.input ?? {}),
    },
  };
}
