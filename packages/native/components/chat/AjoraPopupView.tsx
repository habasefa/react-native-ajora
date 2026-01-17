import React, { useMemo } from "react";
import { Modal, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import AjoraChatView, { AjoraChatViewProps } from "./AjoraChatView";
import { AjoraModalHeader } from "./AjoraModalHeader";
import { AjoraChatToggleButton } from "./AjoraChatToggleButton";
import { renderSlot, SlotValue } from "../../lib/slots";
import { useAjoraChatConfiguration } from "../../providers/AjoraChatConfigurationProvider";

export type AjoraPopupViewProps = AjoraChatViewProps & {
  header?: SlotValue<typeof AjoraModalHeader>;
  style?: StyleProp<ViewStyle>;
};

export function AjoraPopupView({
  header,
  style,
  ...restProps
}: AjoraPopupViewProps) {
  const configuration = useAjoraChatConfiguration();
  const isPopupOpen = configuration?.isModalOpen ?? false;
  const setModalOpen = configuration?.setModalOpen;

  const headerElement = useMemo(
    () => renderSlot(header, AjoraModalHeader, {}),
    [header]
  );

  return (
    <>
      <AjoraChatToggleButton />
      <Modal
        visible={isPopupOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen?.(false)}
      >
        <View style={[styles.container, style]}>
          {headerElement}
          <View style={styles.chatContainer}>
            <AjoraChatView {...restProps} style={styles.chatView} />
          </View>
        </View>
      </Modal>
    </>
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

AjoraPopupView.displayName = "AjoraPopupView";

export default AjoraPopupView;
