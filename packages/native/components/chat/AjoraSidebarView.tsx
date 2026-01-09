import React, { useMemo } from "react";
import { Modal, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraModalHeader } from "./AjoraModalHeader";
import { renderSlot, SlotValue } from "../../lib/slots";
import {
  useAjoraChatConfiguration,
} from "../../providers/AjoraChatConfigurationProvider";

export type AjoraSidebarViewProps = AjoraChatViewProps & {
  header?: SlotValue<typeof AjoraModalHeader>;
  style?: StyleProp<ViewStyle>;
};

export function AjoraSidebarView({ header, style, ...props }: AjoraSidebarViewProps) {
  const configuration = useAjoraChatConfiguration();
  const isSidebarOpen = configuration?.isModalOpen ?? false;
  const setModalOpen = configuration?.setModalOpen;

  const headerElement = useMemo(() => renderSlot(header, AjoraModalHeader, {}), [header]);

  return (
    <Modal
      visible={isSidebarOpen}
      animationType="slide"
      onRequestClose={() => setModalOpen?.(false)}
    >
        <View style={[styles.container, style]}>
          {headerElement}
          <View style={styles.chatContainer}>
            <AjoraChatView {...props} style={styles.chatView} />
          </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
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
