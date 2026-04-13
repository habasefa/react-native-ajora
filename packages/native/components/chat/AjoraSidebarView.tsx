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
  BottomSheetView,
  type BottomSheetBackdropProps,
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
};

// ============================================================================
// Collapsed Input Bar
// ============================================================================

function CollapsedInputBar({
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
      style={[
        styles.collapsedBar,
        {
          backgroundColor: theme.colors.inputBackground,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityHint="Tap to open chat"
    >
      <Ionicons
        name="chatbubble-outline"
        size={18}
        color={theme.colors.placeholder}
      />
      <Text style={[styles.collapsedPlaceholder, { color: theme.colors.placeholder }]}>
        {placeholder ?? "Ask a question..."}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// AjoraSidebarView
// ============================================================================

const SNAP_POINTS = [80, "95%"];

export function AjoraSidebarView({
  header,
  style,
  collapsedPlaceholder,
  ...props
}: AjoraSidebarViewProps) {
  const configuration = useAjoraChatConfiguration();
  const isOpen = configuration?.isModalOpen ?? false;
  const setModalOpen = configuration?.setModalOpen;
  const theme = useAjoraTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);

  // Sync configuration state → sheet snap index
  useEffect(() => {
    bottomSheetRef.current?.snapToIndex(isOpen ? 1 : 0);
  }, [isOpen]);

  // Sync sheet snap index → configuration state
  const handleSheetChange = useCallback(
    (index: number) => {
      const expanded = index === 1;
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

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.5}
        pressBehavior="collapse"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 1 : 0}
      snapPoints={SNAP_POINTS}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={false}
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
      <BottomSheetView style={styles.sheetContent}>
        {!isOpen ? (
          <CollapsedInputBar
            placeholder={collapsedPlaceholder}
            onPress={() => setModalOpen?.(true)}
          />
        ) : (
          <View style={styles.expandedContainer}>
            {headerElement}
            <View style={styles.chatContainer}>
              <AjoraChatView {...props} style={styles.chatView} />
            </View>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetContent: {
    flex: 1,
  },
  collapsedBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  collapsedPlaceholder: {
    fontSize: 15,
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
