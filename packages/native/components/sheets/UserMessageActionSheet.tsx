import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useAjoraTheme } from "../../providers/AjoraThemeProvider";
import { UserMessage } from "@ag-ui/core";
import { Ionicons } from "@expo/vector-icons";

interface UserMessageActionSheetProps {
  message?: UserMessage;
  onRegenerate?: (message: UserMessage) => void;
  onCopy?: (message: UserMessage) => void;
  onClose?: () => void;
}

const UserMessageActionSheet = forwardRef<
  BottomSheetModal,
  UserMessageActionSheetProps
>(({ message, onRegenerate, onCopy, onClose }, ref) => {
  const theme = useAjoraTheme();

  const snapPoints = useMemo(() => ["35%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const handleCopy = () => {
    if (message && onCopy) {
      onCopy(message);
      // Let parent handle closing if needed, or we close here
      // (ref as any)?.current?.dismiss();
      // Usually copy implies done, but let's keep it open or close based on UX?
      // Standard is close on action.
      // (ref as any)?.current?.dismiss();
    }
  };

  const handleRegenerate = () => {
    if (message && onRegenerate) {
      onRegenerate(message);
      (ref as any)?.current?.dismiss();
    }
  };

  const handleCancel = () => {
    (ref as any)?.current?.dismiss();
    onClose?.();
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
    >
      <BottomSheetView style={[styles.contentContainer, { paddingBottom: 32 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Message Options
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: pressed
                  ? theme.colors.itemSelected
                  : "transparent",
              },
            ]}
            onPress={handleRegenerate}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.text} />
            <Text style={[styles.optionText, { color: theme.colors.text }]}>
              Regenerate Response
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: pressed
                  ? theme.colors.itemSelected
                  : "transparent",
              },
            ]}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.optionText, { color: theme.colors.text }]}>
              Copy Message
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: pressed
                  ? theme.colors.itemSelected
                  : "transparent",
              },
            ]}
            onPress={handleCancel}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={theme.colors.error}
            />
            <Text style={[styles.optionText, { color: theme.colors.error }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionsContainer: {
    flex: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
});

export default UserMessageActionSheet;
