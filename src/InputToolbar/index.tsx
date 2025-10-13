import React, { useMemo } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";

import { Composer, ComposerProps } from "../Composer";
import { Send, SendProps } from "../Send";
import { Actions, ActionsProps } from "../Actions";
import { AttachmentPreview } from "./AttachmentPreview";
import RecordingView from "../Recording";
import { IMessage } from "../types";
import { useChatContext } from "../AjoraContext";
import styles from "./styles";

export interface InputToolbarProps<TMessage extends IMessage> {
  options?: { [key: string]: () => void };
  optionTintColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  primaryStyle?: StyleProp<ViewStyle>;
  accessoryStyle?: StyleProp<ViewStyle>;
  renderAccessory?(props: InputToolbarProps<TMessage>): React.ReactNode;
  renderActions?(props: ActionsProps): React.ReactNode;
  renderSend?(props: SendProps<TMessage>): React.ReactNode;
  renderComposer?(props: ComposerProps): React.ReactNode;
  onPressActionButton?(): void;
  icon?: () => React.ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  renderAttachment?: () => React.ReactNode;
  onUpload?(
    uri: string,
    onProgress?: (progress: number, isUploaded?: boolean) => void
  ): Promise<string>;
}

export function InputToolbar<TMessage extends IMessage = IMessage>(
  props: InputToolbarProps<TMessage>
) {
  const {
    renderActions,
    onPressActionButton,
    renderComposer,
    renderSend,
    options,
    optionTintColor,
    icon,
    wrapperStyle,
    containerStyle,
    renderAttachment,
    onUpload,
  } = props;

  const { ajora } = useChatContext();
  const { attachement, isRecording } = ajora;

  const actionsFragment = useMemo(() => {
    const props = {
      onPressActionButton,
      options,
      optionTintColor,
      icon,
      wrapperStyle,
      containerStyle,
      onUpload,
    };

    return (
      <View style={styles.actionsContainer}>
        {renderActions?.(props) || <Actions {...props} />}
      </View>
    );
  }, [
    renderActions,
    options,
    optionTintColor,
    icon,
    wrapperStyle,
    containerStyle,
    onUpload,
  ]);

  const composerFragment = useMemo(() => {
    return (
      renderComposer?.(props as ComposerProps) || (
        <Composer {...(props as ComposerProps)} />
      )
    );
  }, [renderComposer, props]);

  if (isRecording) {
    return (
      <View style={[styles.composer, { minHeight: attachement ? 200 : 100 }]}>
        <RecordingView />
        <View style={[styles.actionsContainer, { justifyContent: "flex-end" }]}>
          {renderSend?.(props) || <Send {...props} />}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.composer, { minHeight: attachement ? 200 : 100 }]}>
      <AttachmentPreview renderAttachment={renderAttachment} />

      {composerFragment}
      <View style={styles.actionsContainer}>
        {actionsFragment}
        {renderSend?.(props) || <Send {...props} />}
      </View>
    </View>
  );
}
