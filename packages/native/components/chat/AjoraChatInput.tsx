import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  Platform,
  Animated,
  AccessibilityInfo,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import {
  useAjoraChatConfiguration,
  AjoraChatLabels,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { AjoraChatAudioRecorder } from "./AjoraChatAudioRecorder";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AjoraChatInputMode = "input" | "transcribe" | "processing";

/**
 * Agent type option for selection
 */
export interface AgentTypeOption {
  id: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Default agent type options
 */
export const DEFAULT_AGENT_TYPES: AgentTypeOption[] = [
  { id: "fast", label: "Fast", description: "Quick responses", icon: "flash" },
  {
    id: "balanced",
    label: "Balanced",
    description: "Quality & speed",
    icon: "options",
  },
  {
    id: "quality",
    label: "Quality",
    description: "Best responses",
    icon: "diamond",
  },
];

/**
 * Theme configuration for AjoraChatInput styling
 */
export interface AjoraChatInputTheme {
  /** Main container style */
  container?: StyleProp<ViewStyle>;
  /** Inner wrapper for the input area */
  inputWrapper?: StyleProp<ViewStyle>;
  /** Text input style */
  textInput?: StyleProp<TextStyle>;
  /** Toolbar container (left side buttons) */
  toolbarContainer?: StyleProp<ViewStyle>;
  /** Actions container (right side buttons) */
  actionsContainer?: StyleProp<ViewStyle>;
  /** Icon button base style */
  iconButton?: StyleProp<ViewStyle>;
  /** Agent selector pill style */
  agentSelector?: StyleProp<ViewStyle>;
  /** Agent selector text style */
  agentSelectorText?: StyleProp<TextStyle>;
  /** Send button style */
  sendButton?: StyleProp<ViewStyle>;
  /** Stop button style */
  stopButton?: StyleProp<ViewStyle>;
  /** Mic button style */
  micButton?: StyleProp<ViewStyle>;
  /** Color scheme */
  colors?: {
    background?: string;
    inputBackground?: string;
    text?: string;
    placeholder?: string;
    primary?: string;
    secondary?: string;
    accent?: string;
    iconDefault?: string;
    iconActive?: string;
    border?: string;
  };
}

/**
 * Default dark theme colors (Gemini-inspired)
 */
export const DEFAULT_DARK_COLORS = {
  background: "#1A1A1A",
  inputBackground: "#2D2D2D",
  text: "#FFFFFF",
  placeholder: "#8E8E93",
  primary: "#4A9EFF",
  secondary: "#3D3D3D",
  accent: "#8AB4F8",
  iconDefault: "#8E8E93",
  iconActive: "#FFFFFF",
  border: "#3D3D3D",
};

/**
 * Default light theme colors
 */
export const DEFAULT_LIGHT_COLORS = {
  background: "transparent",
  inputBackground: "#FFFFFF",
  text: "#1F2937",
  placeholder: "#9CA3AF",
  primary: "#3B82F6",
  secondary: "#F3F4F6",
  accent: "#2563EB",
  iconDefault: "#6B7280",
  iconActive: "#1F2937",
  border: "#E0E0E0",
};

/**
 * Base props for AjoraChatInput component
 */
export interface AjoraChatInputProps {
  /** Current input mode */
  mode?: AjoraChatInputMode;
  /** Whether auto-focus is enabled */
  autoFocus?: boolean;
  /** Callback when message is submitted */
  onSubmitMessage?: (value: string) => void;
  /** Callback to stop the current operation */
  onStop?: () => void;
  /** Whether the agent is currently running */
  isRunning?: boolean;
  /** Callback when transcription starts */
  onStartTranscribe?: () => void;
  /** Callback when transcription is cancelled */
  onCancelTranscribe?: () => void;
  /** Callback when transcription is finished */
  onFinishTranscribe?: () => void;
  /** Controlled value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Custom theme overrides */
  theme?: AjoraChatInputTheme;
  /** Maximum number of lines before scrolling */
  maxLines?: number;
  /** Placeholder text override */
  placeholder?: string;
  /** Test ID for testing */
  testID?: string;
  /** Whether to use dark mode */
  darkMode?: boolean;
  /** Agent type options */
  agentTypes?: AgentTypeOption[];
  /** Currently selected agent type ID */
  selectedAgentType?: string;
  /** Callback when agent type changes */
  onAgentTypeChange?: (agentType: AgentTypeOption) => void;
  /** Show agent type selector */
  showAgentSelector?: boolean;
  /** Show add button */
  showAddButton?: boolean;
  /** Callback when add button is pressed */
  onAddPress?: () => void;
  /** Show settings button */
  showSettingsButton?: boolean;
  /** Callback when settings button is pressed */
  onSettingsPress?: () => void;
  /** Custom text input component */
  textInput?: React.ReactElement;
  /** Custom send button component */
  sendButton?: React.ReactElement;
  /** Custom stop button component */
  stopButton?: React.ReactElement;
  /** Custom start transcribe button component */
  startTranscribeButton?: React.ReactElement;
  /** Custom audio recorder component */
  audioRecorder?: React.ReactElement;
  /** Render function for custom layout */
  children?: (props: AjoraChatInputChildrenArgs) => React.ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Child render function arguments
 */
export interface AjoraChatInputChildrenArgs {
  textInput: React.ReactElement;
  sendButton: React.ReactElement;
  stopButton: React.ReactElement;
  startTranscribeButton: React.ReactElement;
  audioRecorder: React.ReactElement;
  agentSelector: React.ReactElement;
  addButton: React.ReactElement;
  settingsButton: React.ReactElement;
  mode: AjoraChatInputMode;
  isRunning: boolean;
  value: string;
  canSend: boolean;
  canStop: boolean;
  colors: typeof DEFAULT_DARK_COLORS;
}

/**
 * Ref handle for imperative actions
 */
export interface AjoraChatInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

// ============================================================================
// Constants
// ============================================================================

const INPUT_MIN_HEIGHT = 42;
const INPUT_MAX_HEIGHT = 120;
const LINE_HEIGHT = 20;
const ICON_SIZE = 22;
const BUTTON_SIZE = 40;

// ============================================================================
// Sub-Component Props Types
// ============================================================================

export interface AjoraChatTextInputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<TextStyle>;
  testID?: string;
  colors?: typeof DEFAULT_DARK_COLORS;
}

export interface AjoraChatIconButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconFamily?: "ionicons" | "material" | "feather";
  size?: number;
  color?: string;
  activeColor?: string;
  isActive?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export interface AgentSelectorProps {
  options: AgentTypeOption[];
  selectedId?: string;
  onSelect: (option: AgentTypeOption) => void;
  colors: typeof DEFAULT_DARK_COLORS;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * TextInput sub-component
 */
const AjoraChatTextInput = forwardRef<RNTextInput, AjoraChatTextInputProps>(
  function AjoraChatTextInput(
    {
      style,
      placeholder = "Ask Ajora...",
      testID,
      colors = DEFAULT_DARK_COLORS,
      ...props
    },
    ref
  ) {
    return (
      <RNTextInput
        ref={ref}
        style={[styles.textInput, { color: colors.text }, style]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        multiline
        textAlignVertical="top"
        blurOnSubmit={false}
        autoCorrect
        autoCapitalize="sentences"
        keyboardType="default"
        scrollEnabled
        testID={testID}
        accessibilityLabel={placeholder}
        accessibilityHint="Enter your message here"
        {...props}
      />
    );
  }
);

AjoraChatTextInput.displayName = "AjoraChatInput.TextInput";

/**
 * Icon Button sub-component
 */
const AjoraChatIconButton: React.FC<AjoraChatIconButtonProps> = ({
  onPress,
  disabled = false,
  icon,
  iconFamily = "ionicons",
  size = ICON_SIZE,
  color,
  activeColor,
  isActive = false,
  style,
  testID,
  accessibilityLabel,
}) => {
  const iconColor = isActive ? (activeColor ?? color) : color;

  const renderIcon = () => {
    switch (iconFamily) {
      case "material":
        return (
          <MaterialIcons
            name={icon as keyof typeof MaterialIcons.glyphMap}
            size={size}
            color={iconColor}
          />
        );
      case "feather":
        return (
          <Feather
            name={icon as keyof typeof Feather.glyphMap}
            size={size}
            color={iconColor}
          />
        );
      default:
        return <Ionicons name={icon} size={size} color={iconColor} />;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        style,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      {renderIcon()}
    </Pressable>
  );
};

AjoraChatIconButton.displayName = "AjoraChatInput.IconButton";

/**
 * Agent Type Selector sub-component
 */
const AgentSelector: React.FC<AgentSelectorProps> = ({
  options,
  selectedId,
  onSelect,
  colors,
  style,
  testID,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption =
    options.find((opt) => opt.id === selectedId) ?? options[0];

  const handleSelect = (option: AgentTypeOption) => {
    onSelect(option);
    setModalVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.agentSelector,
          { borderColor: colors.border },
          style,
          pressed && styles.buttonPressed,
        ]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Agent type: ${selectedOption?.label}`}
        accessibilityHint="Tap to change agent type"
      >
        {selectedOption?.icon && (
          <Ionicons
            name={selectedOption.icon}
            size={14}
            color={colors.iconActive}
            style={styles.agentSelectorIcon}
          />
        )}
        <Text style={[styles.agentSelectorText, { color: colors.text }]}>
          {selectedOption?.label ?? "Select"}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.iconDefault} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Agent Type
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item.id === selectedId && {
                      backgroundColor: colors.secondary,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={
                        item.id === selectedId
                          ? colors.primary
                          : colors.iconDefault
                      }
                      style={styles.modalOptionIcon}
                    />
                  )}
                  <View style={styles.modalOptionText}>
                    <Text
                      style={[
                        styles.modalOptionLabel,
                        { color: colors.text },
                        item.id === selectedId && { color: colors.primary },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.description && (
                      <Text
                        style={[
                          styles.modalOptionDescription,
                          { color: colors.placeholder },
                        ]}
                      >
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {item.id === selectedId && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

AgentSelector.displayName = "AjoraChatInput.AgentSelector";

// ============================================================================
// Main Component
// ============================================================================

const AjoraChatInputComponent = forwardRef<
  AjoraChatInputRef,
  AjoraChatInputProps
>(function AjoraChatInputComponent(
  {
    mode = "input",
    autoFocus = false,
    onSubmitMessage,
    onStop,
    isRunning = false,
    onStartTranscribe,
    onCancelTranscribe,
    onFinishTranscribe,
    value,
    onChange,
    theme,
    maxLines = 5,
    placeholder,
    testID = "ajora-chat-input",
    darkMode = false,
    agentTypes = DEFAULT_AGENT_TYPES,
    selectedAgentType,
    onAgentTypeChange,
    showAgentSelector = true,
    showAddButton = true,
    onAddPress,
    showSettingsButton = true,
    onSettingsPress,
    textInput: customTextInput,
    sendButton: customSendButton,
    stopButton: customStopButton,
    startTranscribeButton: customStartTranscribeButton,
    audioRecorder: customAudioRecorder,
    children,
    style,
  },
  ref
) {
  // ========================================================================
  // State & Refs
  // ========================================================================

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => value ?? "");
  const [internalAgentType, setInternalAgentType] = useState(
    selectedAgentType ?? agentTypes[0]?.id
  );
  const inputRef = useRef<RNTextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ========================================================================
  // Configuration
  // ========================================================================

  const config = useAjoraChatConfiguration();
  const labels = config?.labels ?? AjoraChatDefaultLabels;

  // Colors based on theme
  const colors = useMemo(() => {
    const baseColors = darkMode ? DEFAULT_DARK_COLORS : DEFAULT_LIGHT_COLORS;
    return { ...baseColors, ...theme?.colors };
  }, [darkMode, theme?.colors]);

  // ========================================================================
  // Derived State
  // ========================================================================

  const resolvedValue = isControlled ? (value ?? "") : internalValue;
  const isProcessing = mode !== "transcribe" && isRunning;
  const canSend = resolvedValue.trim().length > 0 && !!onSubmitMessage;
  const canStop = !!onStop;
  const maxHeight = Math.min(maxLines * LINE_HEIGHT + 20, INPUT_MAX_HEIGHT);
  const currentAgentType = selectedAgentType ?? internalAgentType;

  // ========================================================================
  // Effects
  // ========================================================================

  useEffect(() => {
    if (!isControlled && value !== undefined) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  useEffect(() => {
    if (autoFocus && mode === "input") {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, mode]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [mode, fadeAnim]);

  useEffect(() => {
    if (isRunning) {
      AccessibilityInfo.announceForAccessibility("Processing message");
    }
  }, [isRunning]);

  // ========================================================================
  // Imperative Handle
  // ========================================================================

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        if (!isControlled) {
          setInternalValue("");
        }
        onChange?.("");
      },
      getValue: () => resolvedValue,
    }),
    [isControlled, onChange, resolvedValue]
  );

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleChangeText = useCallback(
    (text: string) => {
      if (!isControlled) {
        setInternalValue(text);
      }
      onChange?.(text);
    },
    [isControlled, onChange]
  );

  const clearInputValue = useCallback(() => {
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
  }, [isControlled, onChange]);

  const handleSend = useCallback(() => {
    if (!canSend) return;

    const trimmedValue = resolvedValue.trim();
    onSubmitMessage?.(trimmedValue);
    clearInputValue();

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [canSend, resolvedValue, onSubmitMessage, clearInputValue]);

  const handleStop = useCallback(() => {
    onStop?.();
  }, [onStop]);

  const handleSubmitEditing = useCallback(
    (_event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      if (isProcessing) {
        handleStop();
      } else {
        handleSend();
      }
    },
    [isProcessing, handleSend, handleStop]
  );

  const handleAgentTypeChange = useCallback(
    (option: AgentTypeOption) => {
      if (!selectedAgentType) {
        setInternalAgentType(option.id);
      }
      onAgentTypeChange?.(option);
    },
    [selectedAgentType, onAgentTypeChange]
  );

  // ========================================================================
  // Computed Styles
  // ========================================================================

  const computedStyles = useMemo(
    () => ({
      container: [styles.container, theme?.container, style],
      inputWrapper: [
        styles.inputWrapper,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
        },
        theme?.inputWrapper,
      ],
      textInput: [
        styles.textInput,
        { minHeight: INPUT_MIN_HEIGHT, maxHeight, color: colors.text },
        theme?.textInput,
      ],
      toolbarContainer: [styles.toolbarContainer, theme?.toolbarContainer],
      actionsContainer: [styles.actionsContainer, theme?.actionsContainer],
    }),
    [colors, theme, style, maxHeight]
  );

  // ========================================================================
  // Render Elements
  // ========================================================================

  const textInputElement = customTextInput ?? (
    <AjoraChatTextInput
      ref={inputRef}
      value={resolvedValue}
      onChangeText={handleChangeText}
      onSubmitEditing={handleSubmitEditing}
      editable={!isRunning && mode === "input"}
      autoFocus={autoFocus}
      placeholder={placeholder ?? labels.chatInputPlaceholder}
      style={computedStyles.textInput}
      colors={colors}
      testID={`${testID}-text-input`}
    />
  );

  const audioRecorderElement = customAudioRecorder ?? (
    <AjoraChatAudioRecorder
      isRunning={isRunning}
      onRecordingComplete={() => {}}
    />
  );

  const addButtonElement = (
    <AjoraChatIconButton
      onPress={onAddPress}
      icon="add"
      color={colors.iconDefault}
      activeColor={colors.iconActive}
      testID={`${testID}-add-button`}
      accessibilityLabel="Add attachment"
    />
  );

  const settingsButtonElement = (
    <AjoraChatIconButton
      onPress={onSettingsPress}
      icon="options"
      color={colors.iconDefault}
      activeColor={colors.iconActive}
      testID={`${testID}-settings-button`}
      accessibilityLabel="Settings"
    />
  );

  const agentSelectorElement = (
    <AgentSelector
      options={agentTypes}
      selectedId={currentAgentType}
      onSelect={handleAgentTypeChange}
      colors={colors}
      testID={`${testID}-agent-selector`}
    />
  );

  const micButtonElement = customStartTranscribeButton ?? (
    <AjoraChatIconButton
      onPress={onStartTranscribe}
      disabled={isRunning}
      icon="mic-outline"
      color={colors.iconDefault}
      activeColor={colors.iconActive}
      style={[styles.circleButton, { backgroundColor: colors.secondary }]}
      testID={`${testID}-mic-button`}
      accessibilityLabel="Voice input"
    />
  );

  const sendButtonElement = customSendButton ?? (
    <Pressable
      onPress={handleSend}
      disabled={!canSend}
      style={({ pressed }) => [
        styles.circleButton,
        styles.sendButton,
        { backgroundColor: canSend ? colors.primary : colors.secondary },
        pressed && canSend && styles.buttonPressed,
      ]}
      testID={`${testID}-send-button`}
      accessibilityRole="button"
      accessibilityLabel="Send message"
      accessibilityState={{ disabled: !canSend }}
    >
      <Ionicons
        name="arrow-up"
        size={20}
        color={canSend ? "#FFFFFF" : colors.iconDefault}
      />
    </Pressable>
  );

  const stopButtonElement = customStopButton ?? (
    <Pressable
      onPress={handleStop}
      disabled={!canStop}
      style={({ pressed }) => [
        styles.circleButton,
        styles.stopButton,
        pressed && canStop && styles.buttonPressed,
      ]}
      testID={`${testID}-stop-button`}
      accessibilityRole="button"
      accessibilityLabel="Stop processing"
      accessibilityState={{ disabled: !canStop }}
    >
      <Ionicons name="stop" size={16} color="#FFFFFF" />
    </Pressable>
  );

  // ========================================================================
  // Render with children function
  // ========================================================================

  if (children) {
    const childProps: AjoraChatInputChildrenArgs = {
      textInput: textInputElement,
      sendButton: sendButtonElement,
      stopButton: stopButtonElement,
      startTranscribeButton: micButtonElement,
      audioRecorder: audioRecorderElement,
      agentSelector: agentSelectorElement,
      addButton: addButtonElement,
      settingsButton: settingsButtonElement,
      mode,
      isRunning,
      value: resolvedValue,
      canSend,
      canStop,
      colors,
    };

    return <>{children(childProps)}</>;
  }

  // ========================================================================
  // Default Render (Gemini-inspired layout)
  // ========================================================================

  return (
    <Animated.View
      style={[computedStyles.container, { opacity: fadeAnim }]}
      testID={testID}
      accessibilityRole="none"
      accessibilityLabel="Chat input area"
    >
      {/* Main Input Container */}
      <View style={computedStyles.inputWrapper}>
        {/* Top Row: Text Input */}
        <View style={styles.inputRow}>
          {mode === "transcribe" ? audioRecorderElement : textInputElement}
        </View>

        {/* Bottom Row: Toolbar */}
        <View style={styles.bottomRow}>
          {/* Left Side: Add & Settings Buttons */}
          <View style={computedStyles.toolbarContainer}>
            {showAddButton && addButtonElement}
            {showSettingsButton && settingsButtonElement}
          </View>

          {/* Center: Agent Type Selector */}
          {showAgentSelector && (
            <View style={styles.centerContainer}>{agentSelectorElement}</View>
          )}

          {/* Right Side: Action Buttons */}
          <View style={computedStyles.actionsContainer}>
            {mode === "transcribe" ? (
              <>
                <AjoraChatIconButton
                  onPress={onCancelTranscribe}
                  icon="close"
                  color="#EF4444"
                  style={[
                    styles.circleButton,
                    { backgroundColor: "rgba(239, 68, 68, 0.2)" },
                  ]}
                  accessibilityLabel="Cancel recording"
                />
                <AjoraChatIconButton
                  onPress={onFinishTranscribe}
                  icon="checkmark"
                  color="#22C55E"
                  style={[
                    styles.circleButton,
                    { backgroundColor: "rgba(34, 197, 94, 0.2)" },
                  ]}
                  accessibilityLabel="Finish recording"
                />
              </>
            ) : (
              <>
                {onStartTranscribe && !isProcessing && micButtonElement}
                {isProcessing ? stopButtonElement : sendButtonElement}
              </>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

// ============================================================================
// Compose Component with Sub-Components
// ============================================================================

type AjoraChatInputType = typeof AjoraChatInputComponent & {
  TextInput: typeof AjoraChatTextInput;
  IconButton: typeof AjoraChatIconButton;
  AgentSelector: typeof AgentSelector;
  AudioRecorder: typeof AjoraChatAudioRecorder;
};

export const AjoraChatInput = AjoraChatInputComponent as AjoraChatInputType;

// Attach sub-components
AjoraChatInput.TextInput = AjoraChatTextInput;
AjoraChatInput.IconButton = AjoraChatIconButton;
AjoraChatInput.AgentSelector = AgentSelector;
AjoraChatInput.AudioRecorder = AjoraChatAudioRecorder;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {},
  inputWrapper: {
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputRow: {
    width: "100%",
  },
  textInput: {
    width: "100%",
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  toolbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BUTTON_SIZE / 2,
  },
  circleButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    // Base styles applied via inline
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  agentSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  agentSelectorIcon: {
    marginRight: 2,
  },
  agentSelectorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOptionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
});

// ============================================================================
// Default Export
// ============================================================================

export default AjoraChatInput;
