/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup, act } from "@testing-library/react";
import { useSuggestions } from "../use-suggestions";
import { useAjora } from "../../providers/AjoraProvider";
import { useAjoraChatConfiguration } from "../../providers/AjoraChatConfigurationProvider";

vi.mock("../../providers/AjoraProvider", () => ({
  useAjora: vi.fn(),
}));

vi.mock("../../providers/AjoraChatConfigurationProvider", () => ({
  useAjoraChatConfiguration: vi.fn(),
}));

const mockUseAjora = useAjora as ReturnType<typeof vi.fn>;
const mockUseConfig = useAjoraChatConfiguration as ReturnType<typeof vi.fn>;

describe("useSuggestions", () => {
  let getSuggestionsMock: ReturnType<typeof vi.fn>;
  let reloadSuggestionsMock: ReturnType<typeof vi.fn>;
  let clearSuggestionsMock: ReturnType<typeof vi.fn>;
  let subscribeMock: ReturnType<typeof vi.fn>;
  let lastSubscriber: any;

  beforeEach(() => {
    getSuggestionsMock = vi.fn(() => ({
      suggestions: [],
      isLoading: false,
    }));
    reloadSuggestionsMock = vi.fn();
    clearSuggestionsMock = vi.fn();
    subscribeMock = vi.fn((subscriber: any) => {
      lastSubscriber = subscriber;
      return { unsubscribe: vi.fn() };
    });

    mockUseAjora.mockReturnValue({
      ajora: {
        getSuggestions: getSuggestionsMock,
        reloadSuggestions: reloadSuggestionsMock,
        clearSuggestions: clearSuggestionsMock,
        subscribe: subscribeMock,
      },
    });

    mockUseConfig.mockReturnValue({
      agentId: "default",
      modelId: "default",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Captures hook return values for assertion
  let hookResult: ReturnType<typeof useSuggestions>;

  const TestComponent: React.FC<{ agentId?: string }> = ({ agentId }) => {
    hookResult = useSuggestions({ agentId });
    return null;
  };

  describe("initial state", () => {
    it("returns empty suggestions and isLoading false by default", () => {
      render(<TestComponent />);

      expect(hookResult.suggestions).toEqual([]);
      expect(hookResult.isLoading).toBe(false);
    });

    it("calls getSuggestions with resolved agentId", () => {
      render(<TestComponent agentId="myAgent" />);

      expect(getSuggestionsMock).toHaveBeenCalledWith("myAgent");
    });

    it("falls back to config agentId when none provided", () => {
      mockUseConfig.mockReturnValue({ agentId: "configAgent" });

      render(<TestComponent />);

      expect(getSuggestionsMock).toHaveBeenCalledWith("configAgent");
    });
  });

  describe("subscription", () => {
    it("subscribes to suggestion changes on mount", () => {
      render(<TestComponent />);

      expect(subscribeMock).toHaveBeenCalled();
      expect(lastSubscriber.onSuggestionsChanged).toBeDefined();
      expect(lastSubscriber.onSuggestionsStartedLoading).toBeDefined();
      expect(lastSubscriber.onSuggestionsFinishedLoading).toBeDefined();
    });

    it("updates suggestions when onSuggestionsChanged fires for matching agentId", () => {
      render(<TestComponent agentId="myAgent" />);

      const newSuggestions = [
        { title: "Option 1", message: "Do 1", isLoading: false },
      ];

      act(() => {
        lastSubscriber.onSuggestionsChanged({
          agentId: "myAgent",
          suggestions: newSuggestions,
        });
      });

      expect(hookResult.suggestions).toEqual(newSuggestions);
    });

    it("ignores suggestions for a different agentId", () => {
      render(<TestComponent agentId="myAgent" />);

      act(() => {
        lastSubscriber.onSuggestionsChanged({
          agentId: "otherAgent",
          suggestions: [{ title: "X", message: "Y", isLoading: false }],
        });
      });

      expect(hookResult.suggestions).toEqual([]);
    });

    it("sets isLoading true on onSuggestionsStartedLoading", () => {
      render(<TestComponent agentId="myAgent" />);
      expect(hookResult.isLoading).toBe(false);

      act(() => {
        lastSubscriber.onSuggestionsStartedLoading({ agentId: "myAgent" });
      });

      expect(hookResult.isLoading).toBe(true);
    });

    it("sets isLoading false on onSuggestionsFinishedLoading", () => {
      render(<TestComponent agentId="myAgent" />);

      act(() => {
        lastSubscriber.onSuggestionsStartedLoading({ agentId: "myAgent" });
      });
      expect(hookResult.isLoading).toBe(true);

      act(() => {
        lastSubscriber.onSuggestionsFinishedLoading({ agentId: "myAgent" });
      });
      expect(hookResult.isLoading).toBe(false);
    });
  });

  describe("actions", () => {
    it("reloadSuggestions calls ajora.reloadSuggestions with resolved agentId", () => {
      render(<TestComponent agentId="myAgent" />);

      act(() => {
        hookResult.reloadSuggestions();
      });

      expect(reloadSuggestionsMock).toHaveBeenCalledWith("myAgent");
    });

    it("clearSuggestions calls ajora.clearSuggestions with resolved agentId", () => {
      render(<TestComponent agentId="myAgent" />);

      act(() => {
        hookResult.clearSuggestions();
      });

      expect(clearSuggestionsMock).toHaveBeenCalledWith("myAgent");
    });
  });
});
