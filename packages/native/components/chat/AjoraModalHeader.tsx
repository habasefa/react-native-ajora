// @ts-nocheck
import * as React from "react";
import { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, TextStyle } from "react-native";
import { useAjoraChatConfiguration, AjoraChatDefaultLabels } from "../../providers/AjoraChatConfigurationProvider";
import { renderSlot, WithSlots } from "../../lib/slots";

type HeaderSlots = {
  titleContent: typeof AjoraModalHeader.Title;
  closeButton: typeof AjoraModalHeader.CloseButton;
};

type HeaderRestProps = {
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export type AjoraModalHeaderProps = WithSlots<HeaderSlots, HeaderRestProps>;

export function AjoraModalHeader({
  title,
  titleContent,
  closeButton,
  children,
  style,
  ...rest
}: AjoraModalHeaderProps) {
  const configuration = useAjoraChatConfiguration();

  const fallbackTitle = configuration?.labels.modalHeaderTitle ?? AjoraChatDefaultLabels.modalHeaderTitle;
  const resolvedTitle = title ?? fallbackTitle;

  const handleClose = useCallback(() => {
    configuration?.setModalOpen(false);
  }, [configuration]);

  const BoundTitle = renderSlot(titleContent, AjoraModalHeader.Title, {
    children: resolvedTitle,
  });

  const BoundCloseButton = renderSlot(closeButton, AjoraModalHeader.CloseButton, {
    onPress: handleClose,
  });

  if (children) {
    return (
      <React.Fragment>
        {children({
          titleContent: BoundTitle,
          closeButton: BoundCloseButton,
          title: resolvedTitle,
          ...rest,
        })}
      </React.Fragment>
    );
  }

   
  return (
     
    <View style={[styles.header, style]} {...rest}>
      {/* @ts-ignore */}
      <View style={styles.titleContainer}>{BoundTitle}</View>
      {/* @ts-ignore */}
      <View style={styles.closeContainer}>{BoundCloseButton}</View>
    </View>
  );
}

export namespace AjoraModalHeader {
  export const Title: React.FC<{ children: React.ReactNode; style?: StyleProp<TextStyle> }> = ({ children, style, ...props }) => (
     
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );

  export const CloseButton: React.FC<{ onPress?: () => void; style?: StyleProp<ViewStyle> }> = ({
    style,
    onPress,
    ...props
  }) => (
     
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.closeButton,
        pressed && styles.pressed,
        style,
      ]}
      aria-label="Close"
      {...props}
    >
      {/* @ts-ignore */}
      <Text style={styles.closeIcon}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingLeft: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
  },
  closeContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  closeIcon: {
    fontSize: 20,
    color: "#8E8E93",
  },
  pressed: {
    opacity: 0.5,
  },
});

export default AjoraModalHeader;
