/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { useConfigureSuggestions } from "../use-configure-suggestions";
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

describe("useConfigureSuggestions", () => {
  let addSuggestionsConfigMock: ReturnType<typeof vi.fn>;
  let removeSuggestionsConfigMock: ReturnType<typeof vi.fn>;
  let reloadSuggestionsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addSuggestionsConfigMock = vi.fn(() => "config-1");
    removeSuggestionsConfigMock = vi.fn();
    reloadSuggestionsMock = vi.fn();

    mockUseAjora.mockReturnValue({
      ajora: {
        addSuggestionsConfig: addSuggestionsConfigMock,
        removeSuggestionsConfig: removeSuggestionsConfigMock,
        reloadSuggestions: reloadSuggestionsMock,
        agents: {},
      },
    });

    mockUseConfig.mockReturnValue({
      agentId: "default",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("dynamic config registration", () => {
    it("registers a dynamic suggestions config on mount", () => {
      const TestComponent: React.FC = () => {
        useConfigureSuggestions({
          instructions: "Suggest next actions",
          minSuggestions: 1,
          maxSuggestions: 3,
          available: "always",
        });
        return null;
      };

      render(<TestComponent />);

      expect(addSuggestionsConfigMock).toHaveBeenCalledTimes(1);
      expect(addSuggestionsConfigMock).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: "Suggest next actions",
          minSuggestions: 1,
          maxSuggestions: 3,
        }),
      );
    });
  });

  describe("static config registration", () => {
    it("registers static suggestions with normalized isLoading", () => {
      const TestComponent: React.FC = () => {
        useConfigureSuggestions({
          suggestions: [
            { title: "Option A", message: "Do A" },
            { title: "Option B", message: "Do B" },
          ],
          available: "always",
        });
        return null;
      };

      render(<TestComponent />);

      expect(addSuggestionsConfigMock).toHaveBeenCalledTimes(1);
      const registeredConfig = addSuggestionsConfigMock.mock.calls[0][0];
      expect(registeredConfig.suggestions).toEqual([
        { title: "Option A", message: "Do A", isLoading: false },
        { title: "Option B", message: "Do B", isLoading: false },
      ]);
    });
  });

  describe("cleanup on unmount", () => {
    it("removes the config when the component unmounts", () => {
      const TestComponent: React.FC = () => {
        useConfigureSuggestions({
          instructions: "Test cleanup",
          minSuggestions: 1,
          maxSuggestions: 3,
          available: "always",
        });
        return null;
      };

      const { unmount } = render(<TestComponent />);
      expect(addSuggestionsConfigMock).toHaveBeenCalledTimes(1);

      unmount();
      expect(removeSuggestionsConfigMock).toHaveBeenCalledWith("config-1");
    });
  });

  describe("null/disabled config", () => {
    it("does not register when config is null", () => {
      const TestComponent: React.FC = () => {
        useConfigureSuggestions(null);
        return null;
      };

      render(<TestComponent />);

      expect(addSuggestionsConfigMock).not.toHaveBeenCalled();
    });

    it("does not register when available is 'disabled'", () => {
      const TestComponent: React.FC = () => {
        useConfigureSuggestions({
          instructions: "Disabled",
          minSuggestions: 1,
          maxSuggestions: 3,
          available: "disabled",
        });
        return null;
      };

      render(<TestComponent />);

      expect(addSuggestionsConfigMock).not.toHaveBeenCalled();
    });
  });

  describe("reload behavior", () => {
    it("reloads suggestions for targeted agent after registering config", () => {
      const TestComponent: React.FC = () => {
        useConfigureSuggestions({
          instructions: "Suggest actions",
          minSuggestions: 1,
          maxSuggestions: 3,
          available: "always",
          consumerAgentId: "myAgent",
        });
        return null;
      };

      render(<TestComponent />);

      expect(reloadSuggestionsMock).toHaveBeenCalledWith("myAgent");
    });
  });
});
