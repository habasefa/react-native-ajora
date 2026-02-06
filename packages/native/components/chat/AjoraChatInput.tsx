import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  FC,
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
  Image,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import Lightbox from "react-native-lightbox-v2";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  useAjoraChatConfiguration,
  AjoraChatLabels,
  AjoraChatDefaultLabels,
} from "../../providers/AjoraChatConfigurationProvider";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";
import { AjoraChatAudioRecorder } from "./AjoraChatAudioRecorder";
import {
  AttachmentSheet,
  type AttachmentType,
  AgentPickerSheet,
  type AgentOption,
  ModelsSheet,
  type ModelOption,
} from "../sheets";
import {
  type FileAttachment,
  type AttachmentUploadState,
  handleAttachmentSelection,
} from "../../lib/fileSystem";
import {
  SuggestionsProvidedProps,
  TriggersConfig,
  useMentions,
} from "react-native-controlled-mentions";
import {
  AjoraMentionSuggestions,
  MentionSuggestion,
} from "./AjoraMentionSuggestions";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AjoraChatInputMode = "input" | "transcribe" | "processing";

/**
 * Attachment preview item
 */
export interface AttachmentPreviewItem extends FileAttachment {}

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
    error?: string;
  };
}

// Hardcoded defaults removed in favor of global theme inheritance
// To customize colors, use the `theme` prop or override global AjoraTheme
export interface AjoraChatInputProps {
  /** Current input mode */
  mode?: AjoraChatInputMode;
  /** Whether auto-focus is enabled */
  autoFocus?: boolean;
  /** Callback when message is submitted */
  onSubmitMessage?: (value: string, attachments?: FileAttachment[]) => void;
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
  /** List of suggestions for mentions */
  mentionSuggestions?: MentionSuggestion[];
  /** Callback when a mention suggestion is selected */
  onMentionSelect?: (suggestion: MentionSuggestion) => void;
  /** Callback when the mention keyword changes */
  onMentionKeywordChange?: (keyword: string | null) => void;
  /** Show add button */
  showAddButton?: boolean;
  /** Callback when add button is pressed */
  onAddPress?: () => void;
  /** Show settings button */
  showSettingsButton?: boolean;
  /** Callback when settings button is pressed */
  onSettingsPress?: () => void;
  /** Style for mention text in input */
  mentionTextStyle?: StyleProp<TextStyle>;
  /** Whether mentions are loading */
  mentionLoading?: boolean;
  /** Custom component to render suggestion item */
  SuggestionItem?: React.ComponentType<any>;
  /** Function to get string representation of mention for input */
  getMentionPlainString?: (suggestion: MentionSuggestion) => string;
  /** Function to get value of mention */
  getMentionValue?: (suggestion: MentionSuggestion) => string;
  /** Maximum number of suggestions to display */
  maxSuggestions?: number;
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
  /** Callback when an attachment type is selected */
  onAttachmentSelect?: (type: AttachmentType) => void;
  /** Callback when an agent is selected from the picker */
  onAgentSelect?: (agent: AgentOption) => void;
  /** Currently selected agent ID for the agent picker */
  selectedAgentId?: string;
  /** Custom agent options for the agent picker */
  agents?: AgentOption[];
  /** Callback when a model is selected */
  onModelSelect?: (model: ModelOption) => void;
  /** Currently selected model ID */
  selectedModelId?: string;
  /** Custom model options */
  models?: ModelOption[];
  /** Attachments to preview in the input */
  attachments?: AttachmentPreviewItem[];
  /** Callback when an attachment is removed */
  onRemoveAttachment?: (attachmentId: string) => void;
  /** Callback for handling attachment upload/preview state */
  onAttachmentPreview?: (
    file: FileAttachment,
    callbacks: {
      onProgress: (progress: number) => void;
      onComplete: (updatedFile?: FileAttachment) => void;
      onError: (error?: Error) => void;
    },
  ) => void;

  // ========================================================================
  // Icons Customization
  // ========================================================================

  /** Custom icons to override default icons */
  icons?: {
    /** Custom send icon */
    send?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
    /** Custom stop icon */
    stop?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
    /** Custom attachment/add icon */
    attachment?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
    /** Custom microphone icon */
    microphone?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
    /** Custom model selector icon */
    model?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
    /** Custom agent selector icon */
    agent?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
    /** Custom settings icon */
    settings?:
      | React.ReactNode
      | ((props: { size: number; color: string }) => React.ReactNode);
  };
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
  attachmentPreview: React.ReactElement | null;
  mode: AjoraChatInputMode;
  isRunning: boolean;
  value: string;
  canSend: boolean;
  canStop: boolean;
  colors: Required<NonNullable<AjoraChatInputTheme["colors"]>>;
  attachments: AttachmentPreviewItem[];
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
const INPUT_PADDING_HORIZONTAL = 16;

// ============================================================================
// Sub-Component Props Types
// ============================================================================

export interface AjoraChatTextInputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<TextStyle>;
  testID?: string;
  colors?: AjoraChatInputTheme["colors"];
  mentionSuggestions?: MentionSuggestion[];
  onMentionSelect?: (suggestion: MentionSuggestion) => void;
  onMentionKeywordChange?: (keyword: string | null) => void;
  mentionTextStyle?: StyleProp<TextStyle>;
  mentionLoading?: boolean;
  SuggestionItem?: React.ComponentType<any>;
  getMentionPlainString?: (suggestion: MentionSuggestion) => string;
  getMentionValue?: (suggestion: MentionSuggestion) => string;
  maxSuggestions?: number;
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
  colors: Required<NonNullable<AjoraChatInputTheme["colors"]>>;
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
      colors,
      mentionSuggestions,
      onMentionSelect,
      onMentionKeywordChange,
      value,
      onChangeText,
      getMentionPlainString,
      getMentionValue,
      ...props
    },
    ref,
  ) {
    const triggersConfig: TriggersConfig<"mention"> = {
      mention: {
        trigger: "@",
        textStyle: props.mentionTextStyle || {
          fontWeight: "bold",
          color: colors?.primary || "blue",
        },
      },
    };

    const { textInputProps, triggers } = useMentions({
      value: value ?? "",
      onChange: onChangeText || (() => {}),
      triggersConfig,
    });

    useEffect(() => {
      onMentionKeywordChange?.(triggers.mention?.keyword ?? null);
    }, [triggers.mention?.keyword, onMentionKeywordChange]);

    return (
      <>
        <AjoraMentionSuggestions
          {...triggers.mention}
          suggestions={mentionSuggestions}
          onSelect={(suggestion) => {
            if (getMentionPlainString) {
              getMentionPlainString(suggestion);
            }
            if (getMentionValue) {
              getMentionValue(suggestion);
            }

            if (triggers.mention.onSelect) {
              triggers.mention.onSelect(suggestion);
            }
            onMentionSelect?.(suggestion);
          }}
          loading={props.mentionLoading}
          SuggestionItem={props.SuggestionItem}
          maxSuggestions={props.maxSuggestions}
          theme={{
            container: {
              left: -INPUT_PADDING_HORIZONTAL,
              right: -INPUT_PADDING_HORIZONTAL,
            },
          }}
        />

        <RNTextInput
          ref={ref}
          style={[styles.textInput, { color: colors?.text }, style]}
          placeholder={placeholder}
          placeholderTextColor={colors?.placeholder}
          multiline
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
          keyboardType="default"
          scrollEnabled
          testID={testID}
          accessibilityLabel={placeholder}
          accessibilityHint="Enter your message here"
          {...props}
          {...textInputProps}
        />
      </>
    );
  },
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
// Attachment Preview Sub-Component
// ============================================================================

interface AttachmentPreviewProps {
  attachments: AttachmentPreviewItem[];
  onRemove: (id: string) => void;
  colors: Required<NonNullable<AjoraChatInputTheme["colors"]>>;
  testID?: string;
}

const ATTACHMENT_PREVIEW_SIZE = 56;

/**
 * Attachment Preview sub-component - shows image thumbnails with upload spinner
 */
const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemove,
  colors,
  testID,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <View style={attachmentPreviewStyles.container} testID={testID}>
      {attachments.map((attachment) => (
        <View key={attachment.id} style={attachmentPreviewStyles.itemWrapper}>
          {/* Image Thumbnail */}
          <View
            style={[
              attachmentPreviewStyles.thumbnailContainer,
              { backgroundColor: colors.secondary },
            ]}
          >
            {attachment.type === "image" && attachment.uri ? (
              // @ts-expect-error - Lightbox types are incomplete
              <Lightbox
                renderContent={() => (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      resizeMode: "contain",
                    }}
                  />
                )}
                activeProps={{
                  style: { flex: 1, width: "100%", height: "100%" },
                }}
                underlayColor="transparent"
                style={attachmentPreviewStyles.thumbnail}
              >
                <Image
                  source={{ uri: attachment.uri }}
                  style={attachmentPreviewStyles.thumbnail}
                  resizeMode="cover"
                  accessibilityLabel={
                    attachment.displayName || "Attached image"
                  }
                />
              </Lightbox>
            ) : (
              <View
                style={[
                  attachmentPreviewStyles.filePlaceholder,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Ionicons
                  name={
                    attachment.type === "document"
                      ? "document-text-outline"
                      : "document-outline"
                  }
                  size={24}
                  color={colors.iconDefault}
                />
              </View>
            )}

            {/* Upload Spinner Overlay */}
            {attachment.uploadState === "uploading" && (
              <View
                style={[
                  attachmentPreviewStyles.spinnerOverlay,
                  { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={colors.background}
                  accessibilityLabel="Uploading attachment"
                />
                {attachment.uploadProgress !== undefined && (
                  <Text
                    style={{
                      color: colors.background,
                      fontSize: 10,
                      marginTop: 4,
                      fontWeight: "600",
                    }}
                  >
                    {Math.round(attachment.uploadProgress)}%
                  </Text>
                )}
              </View>
            )}

            {/* Error indicator */}
            {attachment.uploadState === "error" && (
              <View
                style={[
                  attachmentPreviewStyles.spinnerOverlay,
                  // Use error color with opacity for error state
                  { backgroundColor: colors.error, opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={colors.background}
                />
              </View>
            )}
          </View>

          {/* Remove Button */}
          <Pressable
            onPress={() => onRemove(attachment.id)}
            style={({ pressed }) => [
              attachmentPreviewStyles.removeButton,
              { backgroundColor: colors.inputBackground },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            ]}
            accessibilityLabel="Remove attachment"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={14} color={colors.text} />
          </Pressable>
        </View>
      ))}
    </View>
  );
};

AttachmentPreview.displayName = "AjoraChatInput.AttachmentPreview";

const attachmentPreviewStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  itemWrapper: {
    position: "relative",
  },
  thumbnailContainer: {
    width: ATTACHMENT_PREVIEW_SIZE,
    height: ATTACHMENT_PREVIEW_SIZE,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  filePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

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
    agentTypes,
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
    onAttachmentSelect,
    onAgentSelect,
    selectedAgentId,
    agents,
    onModelSelect,
    selectedModelId,
    models,
    attachments = [],
    onRemoveAttachment,
    onAttachmentPreview,
    icons,
    mentionSuggestions,
    onMentionSelect,
    onMentionKeywordChange,
    mentionTextStyle,
    mentionLoading,
    SuggestionItem,
    getMentionPlainString,
    getMentionValue,
    maxSuggestions,
  },
  ref,
) {
  // ========================================================================
  // State & Refs
  // ========================================================================

  const isControlled = value !== undefined;
  const isModelControlled = selectedModelId !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => value ?? "");
  const [internalAttachments, setInternalAttachments] = useState<
    AttachmentPreviewItem[]
  >([]);
  const [internalAgentType, setInternalAgentType] = useState(
    selectedAgentType ?? agentTypes?.[0]?.id,
  );
  // Default to the first model if no selectedModelId provided
  const defaultModelId = models?.[0]?.id ?? "";
  const [internalModelId, setInternalModelId] = useState<string>(
    selectedModelId ?? defaultModelId,
  );
  const inputRef = useRef<RNTextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Bottom Sheet Modal refs
  const attachmentSheetRef = useRef<BottomSheetModal>(null);
  const agentPickerSheetRef = useRef<BottomSheetModal>(null);
  const modelsSheetRef = useRef<BottomSheetModal>(null);

  // ========================================================================
  // Configuration
  // ========================================================================

  const config = useAjoraChatConfiguration();
  const labels = config?.labels ?? AjoraChatDefaultLabels;

  // Get global theme from context
  const globalTheme = useAjoraTheme();

  // Colors based on theme - priority: local theme prop > global theme > darkMode default
  // Colors based on theme - priority: local theme prop > global theme > defaults
  const colors = useMemo(() => {
    // Map global theme colors to input color format
    const defaultColors = {
      background: globalTheme.colors.background,
      inputBackground: globalTheme.colors.inputBackground, // Or surface if preferred
      text: globalTheme.colors.text,
      placeholder: globalTheme.colors.placeholder, // Ensure placeholder defined in global map
      primary: globalTheme.colors.primary,
      secondary: globalTheme.colors.surface, // Map surface to secondary (often button backgrounds)
      accent: globalTheme.colors.primaryVariant,
      iconDefault: globalTheme.colors.iconDefault,
      iconActive: globalTheme.colors.iconActive,
      border: globalTheme.colors.border,
      error: globalTheme.colors.error,
    };

    return { ...defaultColors, ...theme?.colors } as Required<
      NonNullable<AjoraChatInputTheme["colors"]>
    >;
  }, [globalTheme, theme?.colors]);

  // ========================================================================
  // Derived State
  // ========================================================================

  const resolvedAttachments = useMemo(() => {
    return [...(attachments ?? []), ...internalAttachments];
  }, [attachments, internalAttachments]);

  const resolvedValue = isControlled ? (value ?? "") : internalValue;
  const isProcessing = mode !== "transcribe" && isRunning;
  const hasAttachments = resolvedAttachments.length > 0;
  const isUploading = resolvedAttachments.some(
    (a) => a.uploadState === "uploading",
  );
  const canSend =
    (resolvedValue.trim().length > 0 || hasAttachments) &&
    !!onSubmitMessage &&
    !isUploading;
  const canStop = !!onStop;
  const maxHeight = Math.min(maxLines * LINE_HEIGHT + 20, INPUT_MAX_HEIGHT);
  const currentAgentType = selectedAgentType ?? internalAgentType;

  // Model selection - single source of truth
  const modelsList: ModelOption[] = models ?? [];
  const resolvedModelId = isModelControlled ? selectedModelId : internalModelId;
  const selectedModel = useMemo(() => {
    if (!resolvedModelId || modelsList.length === 0) return null;
    return modelsList.find((m) => m.id === resolvedModelId) ?? null;
  }, [resolvedModelId, modelsList]);

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
    return undefined;
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
    [isControlled, onChange, resolvedValue],
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
    [isControlled, onChange],
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
    onSubmitMessage?.(trimmedValue, resolvedAttachments);
    clearInputValue();
    setInternalAttachments([]);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [
    canSend,
    resolvedValue,
    resolvedAttachments,
    onSubmitMessage,
    clearInputValue,
  ]);

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
    [isProcessing, handleSend, handleStop],
  );

  const handleAgentTypeChange = useCallback(
    (option: AgentTypeOption) => {
      if (!selectedAgentType) {
        setInternalAgentType(option.id);
      }
      onAgentTypeChange?.(option);
    },
    [selectedAgentType, onAgentTypeChange],
  );

  // ========================================================================
  // Bottom Sheet Handlers
  // ========================================================================

  const handleOpenAttachmentSheet = useCallback(() => {
    Keyboard.dismiss();
    attachmentSheetRef.current?.present();
    onAddPress?.();
  }, [onAddPress]);

  const handleOpenAgentPickerSheet = useCallback(() => {
    Keyboard.dismiss();
    agentPickerSheetRef.current?.present();
    onSettingsPress?.();
  }, [onSettingsPress]);

  const handleOpenModelsSheet = useCallback(() => {
    Keyboard.dismiss();
    modelsSheetRef.current?.present();
  }, []);

  const handleAttachmentSelect = useCallback(
    async (type: AttachmentType) => {
      onAttachmentSelect?.(type);

      if (onAttachmentPreview) {
        attachmentSheetRef.current?.close();
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await handleAttachmentSelection(type as any);

          if (result.success) {
            const files =
              result.attachments ||
              (result.attachment ? [result.attachment] : []);

            if (files.length > 0) {
              const newItems: AttachmentPreviewItem[] = files.map((f) => ({
                ...f,
                uploadState: "uploading",
                uploadProgress: 0,
              }));

              setInternalAttachments((prev) => [...prev, ...newItems]);

              files.forEach((file) => {
                onAttachmentPreview(file, {
                  onProgress: (progress) => {
                    setInternalAttachments((prev) =>
                      prev.map((p) =>
                        p.id === file.id
                          ? {
                              ...p,
                              uploadProgress: progress,
                              uploadState: "uploading",
                            }
                          : p,
                      ),
                    );
                  },
                  onComplete: (updatedFile) => {
                    setInternalAttachments((prev) =>
                      prev.map((p) =>
                        p.id === file.id
                          ? {
                              ...(updatedFile ?? p),
                              uploadState: "uploaded",
                              uploadProgress: 100,
                            }
                          : p,
                      ),
                    );
                  },
                  onError: (_error) => {
                    setInternalAttachments((prev) =>
                      prev.map((p) =>
                        p.id === file.id ? { ...p, uploadState: "error" } : p,
                      ),
                    );
                  },
                });
              });
            }
          } else if (result.error) {
            console.error("Error selecting attachments:", result.error);
          }
        } catch (error) {
          console.error("Error selecting attachments:", error);
        }
      }
    },
    [onAttachmentSelect, onAttachmentPreview],
  );

  const handleAgentSelect = useCallback(
    (agent: AgentOption) => {
      onAgentSelect?.(agent);
    },
    [onAgentSelect],
  );

  const handleModelSelect = useCallback(
    (model: ModelOption) => {
      if (!isModelControlled) {
        setInternalModelId(model.id);
      }
      onModelSelect?.(model);
    },
    [onModelSelect, isModelControlled],
  );

  const handleRemoveAttachment = useCallback(
    (attachmentId: string) => {
      setInternalAttachments((prev) =>
        prev.filter((a) => a.id !== attachmentId),
      );
      onRemoveAttachment?.(attachmentId);
    },
    [onRemoveAttachment],
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
    [colors, theme, style, maxHeight],
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
      mentionSuggestions={mentionSuggestions}
      onMentionSelect={onMentionSelect}
      onMentionKeywordChange={onMentionKeywordChange}
      mentionTextStyle={mentionTextStyle}
      mentionLoading={mentionLoading}
      SuggestionItem={SuggestionItem}
      getMentionPlainString={getMentionPlainString}
      getMentionValue={getMentionValue}
      maxSuggestions={maxSuggestions}
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
      onPress={handleOpenAttachmentSheet}
      icon="add"
      color={colors.iconDefault}
      activeColor={colors.iconActive}
      testID={`${testID}-add-button`}
      accessibilityLabel="Add attachment"
    />
  );

  const settingsButtonElement = (
    <AjoraChatIconButton
      onPress={handleOpenAgentPickerSheet}
      icon="options"
      color={colors.iconDefault}
      activeColor={colors.iconActive}
      testID={`${testID}-settings-button`}
      accessibilityLabel="Settings"
    />
  );

  const agentSelectorElement = icons?.model ? (
    <Pressable
      onPress={handleOpenModelsSheet}
      style={({ pressed }) => [
        styles.agentSelector,
        { borderColor: colors.border },
        pressed && styles.buttonPressed,
      ]}
      testID={`${testID}-agent-selector`}
      accessibilityRole="button"
      accessibilityLabel={`Selected model: ${selectedModel?.name ?? "Select model"}`}
      accessibilityHint="Tap to select AI model"
    >
      {typeof icons.model === "function"
        ? icons.model({ size: 14, color: colors.iconActive })
        : icons.model}
      <Text
        style={[styles.agentSelectorText, { color: colors.text }]}
        numberOfLines={1}
      >
        {selectedModel?.name ?? "Select Model"}
      </Text>
      <Ionicons name="chevron-down" size={14} color={colors.iconDefault} />
    </Pressable>
  ) : (
    <Pressable
      onPress={handleOpenModelsSheet}
      style={({ pressed }) => [
        styles.agentSelector,
        { borderColor: colors.border },
        pressed && styles.buttonPressed,
      ]}
      testID={`${testID}-agent-selector`}
      accessibilityRole="button"
      accessibilityLabel={`Selected model: ${selectedModel?.name ?? "Select model"}`}
      accessibilityHint="Tap to select AI model"
    >
      <Text
        style={[styles.agentSelectorText, { color: colors.text }]}
        numberOfLines={1}
      >
        {selectedModel?.name ?? "Select Model"}
      </Text>
      <Ionicons name="chevron-down" size={14} color={colors.iconDefault} />
    </Pressable>
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

  const sendButtonElement =
    customSendButton ??
    (icons?.send ? (
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.circleButton,
          { backgroundColor: canSend ? colors.primary : colors.secondary },
          pressed && canSend && styles.buttonPressed,
        ]}
        testID={`${testID}-send-button`}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
      >
        {typeof icons.send === "function"
          ? icons.send({
              size: 20,
              color: canSend ? colors.background : colors.iconDefault,
            })
          : icons.send}
      </Pressable>
    ) : (
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.circleButton,
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
          color={canSend ? colors.background : colors.iconDefault}
        />
      </Pressable>
    ));

  const stopButtonElement =
    customStopButton ??
    (icons?.stop ? (
      <Pressable
        onPress={handleStop}
        disabled={!canStop}
        style={({ pressed }) => [
          styles.circleButton,
          { backgroundColor: colors.error },
          pressed && canStop && styles.buttonPressed,
        ]}
        testID={`${testID}-stop-button`}
        accessibilityRole="button"
        accessibilityLabel="Stop processing"
        accessibilityState={{ disabled: !canStop }}
      >
        {typeof icons.stop === "function"
          ? icons.stop({ size: 16, color: colors.background })
          : icons.stop}
      </Pressable>
    ) : (
      <Pressable
        onPress={handleStop}
        disabled={!canStop}
        style={({ pressed }) => [
          styles.circleButton,
          { backgroundColor: colors.error },
          pressed && canStop && styles.buttonPressed,
        ]}
        testID={`${testID}-stop-button`}
        accessibilityRole="button"
        accessibilityLabel="Stop processing"
        accessibilityState={{ disabled: !canStop }}
      >
        <Ionicons name="stop" size={16} color={colors.background} />
      </Pressable>
    ));

  const attachmentPreviewElement =
    resolvedAttachments.length > 0 ? (
      <AttachmentPreview
        attachments={resolvedAttachments}
        onRemove={handleRemoveAttachment}
        colors={colors}
        testID={`${testID}-attachment-preview`}
      />
    ) : null;

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
      attachmentPreview: attachmentPreviewElement,
      mode,
      isRunning,
      value: resolvedValue,
      canSend,
      canStop,
      colors,
      attachments: resolvedAttachments,
    };

    return <>{children(childProps)}</>;
  }

  // ========================================================================
  // Default Render (Gemini-inspired layout)
  // ========================================================================

  return (
    <>
      <Animated.View
        style={[computedStyles.container, { opacity: fadeAnim }]}
        testID={testID}
        accessibilityRole="none"
        accessibilityLabel="Chat input area"
      >
        {/* Main Input Container */}
        <View style={computedStyles.inputWrapper}>
          {/* Attachment Previews */}
          {resolvedAttachments.length > 0 && (
            <AttachmentPreview
              attachments={resolvedAttachments}
              onRemove={handleRemoveAttachment}
              colors={colors}
              testID={`${testID}-attachment-preview`}
            />
          )}

          {/* Top Row: Text Input */}
          <View style={styles.inputRow}>
            {mode === "transcribe" ? audioRecorderElement : textInputElement}
          </View>

          {/* Bottom Row: Toolbar */}
          <View style={styles.bottomRow}>
            {/* Left Side: Add & Settings Buttons */}
            <View style={computedStyles.toolbarContainer}>
              {showAddButton && addButtonElement}
              {showSettingsButton &&
                agents &&
                agents.length > 0 &&
                settingsButtonElement}
            </View>

            {/* Center: Model Selector */}
            {showAgentSelector && modelsList.length > 0 && (
              <View style={styles.centerContainer}>{agentSelectorElement}</View>
            )}

            {/* Right Side: Action Buttons */}
            <View style={computedStyles.actionsContainer}>
              {isProcessing ? stopButtonElement : sendButtonElement}
            </View>
          </View>
        </View>

        {/* Disclaimer Text */}
        <Text style={[styles.disclaimerText, { color: colors.placeholder }]}>
          {labels.chatDisclaimerText}
        </Text>
      </Animated.View>

      {/* Bottom Sheets */}
      <AttachmentSheet
        ref={attachmentSheetRef}
        onSelect={handleAttachmentSelect}
        testID={`${testID}-attachment-sheet`}
      />

      <AgentPickerSheet
        ref={agentPickerSheetRef}
        selectedAgentId={selectedAgentId}
        onSelect={handleAgentSelect}
        agents={agents}
        testID={`${testID}-agent-picker-sheet`}
      />

      <ModelsSheet
        ref={modelsSheetRef}
        selectedModelId={resolvedModelId}
        onSelect={handleModelSelect}
        models={modelsList}
        testID={`${testID}-models-sheet`}
      />
    </>
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
  AttachmentPreview: typeof AttachmentPreview;
};

export const AjoraChatInput = AjoraChatInputComponent as AjoraChatInputType;

// Attach sub-components
AjoraChatInput.TextInput = AjoraChatTextInput;
AjoraChatInput.IconButton = AjoraChatIconButton;
AjoraChatInput.AgentSelector = AgentSelector;
AjoraChatInput.AudioRecorder = AjoraChatAudioRecorder;
AjoraChatInput.AttachmentPreview = AttachmentPreview;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputWrapper: {
    width: "100%",
    borderRadius: 32,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    paddingTop: 14,
    paddingBottom: 10,
    borderWidth: 1.5,
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
    width: "100%",
  },
  toolbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    minWidth: 88,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    minWidth: 88,
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
  disclaimerText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: 16,
  },
});

// ============================================================================
// Default Export
// ============================================================================

export default AjoraChatInput;
