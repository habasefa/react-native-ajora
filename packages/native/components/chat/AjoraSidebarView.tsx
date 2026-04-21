import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraModalHeader } from "./AjoraModalHeader";
import { renderSlot, SlotValue } from "../../lib/slots";
import { useAjoraChatConfiguration } from "../../providers/AjoraChatConfigurationProvider";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";

// ============================================================================
// Types
// ============================================================================

export type AjoraSidebarViewProps = AjoraChatViewProps & {
  header?: SlotValue<typeof AjoraModalHeader>;
  style?: StyleProp<ViewStyle>;
  /** Placeholder text for the collapsed input bar */
  collapsedPlaceholder?: string;
  /**
   * Renderer for the collapsed affordance (shown when the sheet is closed).
   * Receives `onPress` to open the sheet. Defaults to the bundled pill-shaped
   * input bar. Provide a custom component — e.g. a floating action button —
   * when the host screen's layout demands a smaller footprint.
   */
  collapsed?: SlotValue<typeof CollapsedInputBar>;
};

// ============================================================================
// Collapsed Input Bar
// ============================================================================

export function CollapsedInputBar({
  placeholder,
  onPress,
}: {
  placeholder?: string;
  onPress: () => void;
}) {
  const theme = useAjoraTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.collapsedBar}
      accessibilityRole="button"
      accessibilityHint="Tap to open chat"
    >
      <View
        style={[
          styles.collapsedInput,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.collapsedPlaceholder, { color: theme.colors.placeholder }]}>
          {placeholder ?? "Ask a question..."}
        </Text>
        <View style={[styles.collapsedSendButton, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// AjoraSidebarView
// ============================================================================

const SNAP_POINTS = ["95%"];

export function AjoraSidebarView({
  header,
  style,
  collapsedPlaceholder,
  collapsed,
  ...props
}: AjoraSidebarViewProps) {
  const configuration = useAjoraChatConfiguration();
  const isOpen = configuration?.isModalOpen ?? false;
  const setModalOpen = configuration?.setModalOpen;
  const theme = useAjoraTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);

  // Wire FlashList's scroll events into the BottomSheet so vertical pans
  // inside the message list scroll the list instead of dragging the sheet.
  // The returned component must render inside <BottomSheet> (it calls
  // `useBottomSheetInternal` internally), which is satisfied because we
  // forward it down to AjoraChatView's scroll slot — AjoraChatView is
  // mounted under <BottomSheet> below.
  const bottomSheetScrollable = useBottomSheetScrollableCreator();

  const scrollViewSlot = useMemo(() => {
    const userSlot = (props as AjoraChatViewProps).scrollView;
    // No consumer override — inject our BottomSheet-aware scroller.
    if (userSlot === undefined || userSlot === null) {
      return { renderScrollComponent: bottomSheetScrollable };
    }
    // Partial-props object: merge so we don't stomp consumer tweaks, but
    // let consumer-provided `renderScrollComponent` win if they set one.
    if (typeof userSlot === "object" && !React.isValidElement(userSlot)) {
      return { renderScrollComponent: bottomSheetScrollable, ...userSlot };
    }
    // Full component/string override — respect it. The consumer is on the
    // hook for BottomSheet compatibility.
    return userSlot;
  }, [bottomSheetScrollable, (props as AjoraChatViewProps).scrollView]);

  // Sync configuration state → sheet
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  // Sync sheet state → configuration state
  const handleSheetChange = useCallback(
    (index: number) => {
      const expanded = index === 0;
      if (expanded !== isOpen) {
        setModalOpen?.(expanded);
      }
    },
    [isOpen, setModalOpen],
  );

  const headerElement = useMemo(
    () => renderSlot(header, AjoraModalHeader, {}),
    [header],
  );

  const openSheet = useCallback(() => setModalOpen?.(true), [setModalOpen]);

  const collapsedElement = useMemo(
    () =>
      renderSlot(collapsed, CollapsedInputBar, {
        placeholder: collapsedPlaceholder,
        onPress: openSheet,
      }),
    [collapsed, collapsedPlaceholder, openSheet],
  );

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.rootWrapper]}
      pointerEvents="box-none"
    >
      {!isOpen && (
        <View style={styles.collapsedBarWrapper} pointerEvents="box-none">
          {collapsedElement}
        </View>
      )}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={SNAP_POINTS}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
        backgroundStyle={[
          styles.sheetBackground,
          { backgroundColor: theme.colors.surface },
        ]}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        style={style}
      >
        <View style={styles.expandedContainer}>
          {headerElement}
          <View style={styles.chatContainer}>
            <AjoraChatView
              {...props}
              scrollView={scrollViewSlot as AjoraChatViewProps["scrollView"]}
              style={styles.chatView}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Elevate the whole sidebar above host-screen content that sets its own
  // zIndex (e.g. absolutely-positioned header icons). Without this, the
  // backdrop and sheet can render beneath zIndex:1 siblings.
  rootWrapper: {
    zIndex: 100,
    elevation: 100,
  },
  sheetBackground: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  collapsedBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  collapsedBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  collapsedInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  collapsedPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  collapsedSendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  expandedContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatView: {
    flex: 1,
  },
});

AjoraSidebarView.displayName = "AjoraSidebarView";

export default AjoraSidebarView;
