import React, { useMemo } from "react";
import { View, StyleProp, ViewStyle } from "react-native";

import { Composer, ComposerProps } from "../Composer";
import { Send, SendProps } from "../Send";
import { Actions, ActionsProps } from "../Actions";
import { IMessage } from "../types";
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
  } = props;

  const actionsFragment = useMemo(() => {
    const props = {
      onPressActionButton,
      options,
      optionTintColor,
      icon,
      wrapperStyle,
      containerStyle,
    };

    return (
      <View style={styles.actionsContainer}>
        {renderActions?.(props) ||
          (onPressActionButton && <Actions {...props} />)}
      </View>
    );
  }, [
    renderActions,
    onPressActionButton,
    options,
    optionTintColor,
    icon,
    wrapperStyle,
    containerStyle,
  ]);

  const composerFragment = useMemo(() => {
    return (
      renderComposer?.(props as ComposerProps) || (
        <Composer {...(props as ComposerProps)} />
      )
    );
  }, [renderComposer, props]);

  return (
    <View style={styles.composer}>
      {composerFragment}
      <View style={styles.actionsContainer}>
        {actionsFragment}
        {renderSend?.(props) || <Send {...props} />}
      </View>
    </View>
  );
}
